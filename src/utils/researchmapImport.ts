import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

import { PublicationMasterRecord, PublicationMasterResearchmapFields } from "../types/publicationMaster";
import {
  PublicationArtifactPaths,
  readPublicationMasterFile,
  writePublicationArtifacts,
} from "./publicationMasterFile";
import {
  extractPrimaryPublicationTitle,
  findDuplicatePublicationTitleGroups,
  hasMatchingPublicationTitle,
  normalizePublicationTitle,
} from "./publicationTitle";

const PUBLICATION_TYPES = new Set(["published_papers", "presentations", "misc"]);
const HISTORY_FILE_NAME = ".researchmap-import-history.json";

type PublicationType = PublicationMasterResearchmapFields["type"];

interface ResearchmapJsonlRecord {
  insert?: {
    type?: string;
  };
  merge?: Record<string, unknown>;
  force?: Record<string, unknown>;
}

interface MatchCandidate {
  index: number;
  strategy: "doi" | "title";
}

export interface ResearchmapImportIssue {
  lineNumber: number;
  reason: string;
  type: string;
  title: string;
  date: string;
}

export interface ResearchmapImportReport {
  sourcePath: string;
  dryRun: boolean;
  importedAt: string;
  summary: {
    totalLines: number;
    publicationRecords: number;
    matched: number;
    added: number;
    skippedNonPublication: number;
    ambiguous: number;
    invalid: number;
  };
  ambiguousMatches: ResearchmapImportIssue[];
  invalidRecords: ResearchmapImportIssue[];
  archivedTo?: string;
}

export interface ResearchmapImportOptions {
  dryRun?: boolean;
  archiveDirPath?: string;
  importedAt?: Date;
}

interface ImportHistoryEntry {
  sha256: string;
  importedAt: string;
  sourcePath: string;
  archivedPath: string;
}

interface ImportHistoryFile {
  version: 1;
  entries: ImportHistoryEntry[];
}

export function importPublicationMasterFromResearchmap(
  inputFilePath: string,
  artifactPaths: PublicationArtifactPaths,
  options: ResearchmapImportOptions = {}
): ResearchmapImportReport {
  const dryRun = options.dryRun ?? false;
  const importedAt = (options.importedAt || new Date()).toISOString();
  const archiveDirPath =
    options.archiveDirPath || path.join(path.dirname(inputFilePath), "archive");
  const historyFilePath = path.join(archiveDirPath, HISTORY_FILE_NAME);
  const inputContent = fs.readFileSync(inputFilePath, "utf8");
  const fileHash = crypto.createHash("sha256").update(inputContent).digest("hex");
  const history = readImportHistory(historyFilePath);

  if (history.entries.some((entry) => entry.sha256 === fileHash)) {
    throw new Error(`この JSONL は既に取り込み済みです: ${inputFilePath}`);
  }

  const existingRecords = readPublicationMasterFile(artifactPaths.masterJsonFilePath);
  const usedExistingIndexes = new Set<number>();
  const nextRecords = [...existingRecords];
  const ambiguousMatches: ResearchmapImportIssue[] = [];
  const invalidRecords: ResearchmapImportIssue[] = [];
  let publicationRecords = 0;
  let matched = 0;
  let added = 0;
  let skippedNonPublication = 0;

  const lines = inputContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line, lineIndex) => {
    const record = parseJsonlLine(line, lineIndex + 1);
    const type = record.insert?.type || "";

    if (!PUBLICATION_TYPES.has(type)) {
      skippedNonPublication += 1;
      return;
    }

    publicationRecords += 1;

    try {
      const importedRecord = buildMasterRecordFromResearchmapRecord(
        record,
        buildImportedRecordId(existingRecords, nextRecords, lineIndex)
      );
      const candidates = findMatchingCandidates(existingRecords, usedExistingIndexes, importedRecord);

      if (candidates.length > 1) {
        ambiguousMatches.push(
          buildIssue(lineIndex + 1, importedRecord, `複数の既存業績が ${candidates[0].strategy} で一致しました`)
        );
        return;
      }

      if (candidates.length === 1) {
        const candidate = candidates[0];
        const existingRecord = existingRecords[candidate.index];
        usedExistingIndexes.add(candidate.index);
        nextRecords[candidate.index] = {
          ...existingRecord,
          researchmapFields: mergeResearchmapFields(
            existingRecord.researchmapFields,
            importedRecord.researchmapFields
          ),
          localMeta: existingRecord.localMeta,
        };
        matched += 1;
        return;
      }

      nextRecords.push({
        ...importedRecord,
        id: uniquifyRecordId(nextRecords, importedRecord.id),
      });
      added += 1;
    } catch (error: unknown) {
      invalidRecords.push(
        buildIssue(
          lineIndex + 1,
          fallbackRecord(type, getPayload(record)),
          error instanceof Error ? error.message : "不明なエラー"
        )
      );
    }
  });

  const report: ResearchmapImportReport = {
    sourcePath: inputFilePath,
    dryRun,
    importedAt,
    summary: {
      totalLines: lines.length,
      publicationRecords,
      matched,
      added,
      skippedNonPublication,
      ambiguous: ambiguousMatches.length,
      invalid: invalidRecords.length,
    },
    ambiguousMatches,
    invalidRecords,
  };

  appendDuplicateTitleIssues(report.invalidRecords, nextRecords);
  report.summary.invalid = report.invalidRecords.length;

  if (dryRun || ambiguousMatches.length > 0 || invalidRecords.length > 0) {
    return report;
  }

  writePublicationArtifacts(nextRecords, artifactPaths);
  const archivedTo = archiveImportedFile(inputFilePath, archiveDirPath, fileHash, importedAt);
  writeImportHistory(historyFilePath, {
    version: 1,
    entries: [
      ...history.entries,
      {
        sha256: fileHash,
        importedAt,
        sourcePath: inputFilePath,
        archivedPath: archivedTo,
      },
    ],
  });

  return {
    ...report,
    archivedTo,
  };
}

function parseJsonlLine(line: string, lineNumber: number): ResearchmapJsonlRecord {
  try {
    return JSON.parse(line) as ResearchmapJsonlRecord;
  } catch (error: unknown) {
    throw new Error(`line ${lineNumber} の JSON 解析に失敗しました`);
  }
}

function fallbackRecord(type: string, payload: Record<string, unknown>): PublicationMasterRecord {
  const publicationType = normalizePublicationType(type) || "misc";

  return {
    id: `invalid-${publicationType}`,
    researchmapFields: compactObject({
      type: publicationType,
      paper_title: optionalLocalizedText(payload.paper_title),
      presentation_title: optionalLocalizedText(payload.presentation_title),
      publication_name: optionalLocalizedText(payload.publication_name),
      event: optionalLocalizedText(payload.event),
      publication_date: optionalString(payload.publication_date),
    }) as PublicationMasterResearchmapFields,
    localMeta: {
      hasEmptyFields: false,
      notes: "",
    },
  };
}

function buildMasterRecordFromResearchmapRecord(
  record: ResearchmapJsonlRecord,
  fallbackId: string
): PublicationMasterRecord {
  const type = normalizePublicationType(record.insert?.type);

  if (!type) {
    throw new Error("publication type が不正です");
  }

  const payload = getPayload(record);
  const researchmapFields = sanitizeResearchmapFields(type, payload);
  const recordId = buildRecordId(researchmapFields, fallbackId);

  return {
    id: recordId,
    researchmapFields,
    localMeta: {
      hasEmptyFields: false,
      notes: "",
    },
  };
}

function sanitizeResearchmapFields(
  type: PublicationType,
  payload: Record<string, unknown>
): PublicationMasterResearchmapFields {
  const subtype = resolveSubtype(type, payload);

  return compactObject({
    type,
    subtype,
    paper_title: optionalLocalizedText(payload.paper_title),
    presentation_title: optionalLocalizedText(payload.presentation_title),
    authors: optionalLocalizedPeople(payload.authors),
    presenters: optionalLocalizedPeople(payload.presenters),
    publication_name: optionalLocalizedText(payload.publication_name),
    event: optionalLocalizedText(payload.event),
    publication_date: optionalString(payload.publication_date),
    from_event_date: optionalString(payload.from_event_date),
    to_event_date: optionalString(payload.to_event_date),
    identifiers: optionalIdentifiers(payload.identifiers),
    see_also: optionalSeeAlso(payload.see_also),
    volume: optionalString(payload.volume),
    number: optionalString(payload.number),
    starting_page: optionalString(payload.starting_page),
    ending_page: optionalString(payload.ending_page),
    location: optionalLocalizedText(payload.location),
    description: optionalLocalizedText(payload.description),
    referee: optionalBoolean(payload.referee),
    invited: optionalBoolean(payload.invited),
    published_paper_owner_roles: optionalStringArray(payload.published_paper_owner_roles),
    presentation_type: optionalString(payload.presentation_type),
    published_paper_type: optionalString(payload.published_paper_type),
    misc_type: optionalString(payload.misc_type),
    is_international_presentation: optionalBoolean(payload.is_international_presentation),
    is_international_journal: optionalBoolean(payload.is_international_journal),
  }) as PublicationMasterResearchmapFields;
}

function resolveSubtype(
  type: PublicationType,
  payload: Record<string, unknown>
): string | undefined {
  if (type === "published_papers") {
    return optionalString(payload.published_paper_type) || optionalString(payload.subtype);
  }
  if (type === "presentations") {
    return optionalString(payload.presentation_type) || optionalString(payload.subtype);
  }
  return optionalString(payload.misc_type) || optionalString(payload.subtype);
}

function findMatchingCandidates(
  existingRecords: PublicationMasterRecord[],
  usedExistingIndexes: Set<number>,
  importedRecord: PublicationMasterRecord
): MatchCandidate[] {
  const doiMatches = existingRecords
    .map((record, index) => ({ record, index }))
    .filter(({ index, record }) => {
      return !usedExistingIndexes.has(index) && isDoiMatch(record, importedRecord);
    })
    .map(({ index }) => ({ index, strategy: "doi" as const }));

  if (doiMatches.length > 0) {
    return doiMatches;
  }

  return existingRecords
    .map((record, index) => ({ record, index }))
    .filter(({ index, record }) => {
      return !usedExistingIndexes.has(index) && hasMatchingPublicationTitle(record.researchmapFields, importedRecord.researchmapFields);
    })
    .map(({ index }) => ({ index, strategy: "title" as const }));
}

function isDoiMatch(left: PublicationMasterRecord, right: PublicationMasterRecord): boolean {
  const leftDoi = normalizeDoi(left.researchmapFields.identifiers?.doi?.[0]);
  const rightDoi = normalizeDoi(right.researchmapFields.identifiers?.doi?.[0]);
  return Boolean(leftDoi && rightDoi && leftDoi === rightDoi);
}

function mergeResearchmapFields(
  existingFields: PublicationMasterResearchmapFields,
  importedFields: PublicationMasterResearchmapFields
): PublicationMasterResearchmapFields {
  return deepMergePreferImported(existingFields, importedFields) as PublicationMasterResearchmapFields;
}

function deepMergePreferImported(existingValue: unknown, importedValue: unknown): unknown {
  if (importedValue === undefined) {
    return cloneValue(existingValue);
  }
  if (existingValue === undefined || existingValue === null) {
    return cloneValue(importedValue);
  }
  if (Array.isArray(importedValue)) {
    return cloneValue(importedValue);
  }
  if (
    typeof existingValue !== "object" ||
    existingValue === null ||
    typeof importedValue !== "object" ||
    importedValue === null
  ) {
    return cloneValue(importedValue);
  }

  const mergedEntries = new Map<string, unknown>();
  const keys = new Set([
    ...Object.keys(existingValue as Record<string, unknown>),
    ...Object.keys(importedValue as Record<string, unknown>),
  ]);

  keys.forEach((key) => {
    mergedEntries.set(
      key,
      deepMergePreferImported(
        (existingValue as Record<string, unknown>)[key],
        (importedValue as Record<string, unknown>)[key]
      )
    );
  });

  return compactObject(Object.fromEntries(mergedEntries));
}

function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, cloneValue(item)])
    );
  }
  return value;
}

function buildRecordId(fields: PublicationMasterResearchmapFields, fallbackId: string): string {
  const year = (fields.publication_date || "undated").slice(0, 4);
  const title = extractPrimaryPublicationTitle(fields);
  const slugBase = slugify(title || extractVenue(fields) || fallbackId);
  return `pub-${year}-${slugBase || fallbackId}`;
}

function buildImportedRecordId(
  existingRecords: PublicationMasterRecord[],
  nextRecords: PublicationMasterRecord[],
  lineIndex: number
): string {
  const existingIds = new Set([...existingRecords, ...nextRecords].map((record) => record.id));
  const baseId = `researchmap-import-${lineIndex + 1}`;
  let candidateId = baseId;
  let suffix = 2;

  while (existingIds.has(candidateId)) {
    candidateId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return candidateId;
}

function uniquifyRecordId(records: PublicationMasterRecord[], baseId: string): string {
  const existingIds = new Set(records.map((record) => record.id));

  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let suffix = 2;
  let candidateId = `${baseId}-${suffix}`;
  while (existingIds.has(candidateId)) {
    suffix += 1;
    candidateId = `${baseId}-${suffix}`;
  }
  return candidateId;
}

function buildIssue(
  lineNumber: number,
  record: PublicationMasterRecord,
  reason: string
): ResearchmapImportIssue {
  return {
    lineNumber,
    reason,
    type: record.researchmapFields.type,
    title: extractPrimaryPublicationTitle(record.researchmapFields),
    date: record.researchmapFields.publication_date || "",
  };
}

function archiveImportedFile(
  sourcePath: string,
  archiveDirPath: string,
  fileHash: string,
  importedAt: string
): string {
  fs.mkdirSync(archiveDirPath, { recursive: true });
  const sourceExt = path.extname(sourcePath) || ".jsonl";
  const sourceBaseName = path.basename(sourcePath, sourceExt);
  const timestamp = importedAt.replace(/[:.]/g, "-");
  const archivedPath = path.join(
    archiveDirPath,
    `${sourceBaseName}.${timestamp}.${fileHash.slice(0, 12)}.imported${sourceExt}`
  );

  try {
    fs.renameSync(sourcePath, archivedPath);
  } catch {
    fs.copyFileSync(sourcePath, archivedPath);
    fs.unlinkSync(sourcePath);
  }

  return archivedPath;
}

function readImportHistory(historyFilePath: string): ImportHistoryFile {
  if (!fs.existsSync(historyFilePath)) {
    return {
      version: 1,
      entries: [],
    };
  }

  return JSON.parse(fs.readFileSync(historyFilePath, "utf8")) as ImportHistoryFile;
}

function writeImportHistory(historyFilePath: string, history: ImportHistoryFile): void {
  fs.mkdirSync(path.dirname(historyFilePath), { recursive: true });
  fs.writeFileSync(historyFilePath, `${JSON.stringify(history, null, 2)}\n`, "utf8");
}

function getPayload(record: ResearchmapJsonlRecord): Record<string, unknown> {
  const payload = record.merge || record.force || {};
  return typeof payload === "object" && payload !== null
    ? (payload as Record<string, unknown>)
    : {};
}

function normalizePublicationType(value: string | undefined): PublicationType | undefined {
  if (value === "published_papers" || value === "presentations" || value === "misc") {
    return value;
  }
  return undefined;
}

function normalizeDoi(value: string | undefined): string {
  return (value || "").trim().replace(/^https?:\/\/doi\.org\//i, "").toLowerCase();
}

function extractVenue(fields: PublicationMasterResearchmapFields): string {
  return fields.publication_name?.ja || fields.publication_name?.en || fields.event?.ja || fields.event?.en || "";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function compactObject<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (item === undefined || item === null) {
        return false;
      }
      if (Array.isArray(item)) {
        return item.length > 0;
      }
      if (typeof item === "object") {
        return Object.keys(item).length > 0;
      }
      return true;
    })
  ) as Partial<T>;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function optionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
  return normalized.length > 0 ? normalized : undefined;
}

function optionalLocalizedText(value: unknown): { ja?: string; en?: string } | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return compactObject({
    ja: optionalString((value as Record<string, unknown>).ja),
    en: optionalString((value as Record<string, unknown>).en),
  });
}

function optionalLocalizedPeople(
  value: unknown
): { ja?: Array<{ name: string }>; en?: Array<{ name: string }> } | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return compactObject({
    ja: optionalPeopleArray((value as Record<string, unknown>).ja),
    en: optionalPeopleArray((value as Record<string, unknown>).en),
  });
}

function optionalPeopleArray(value: unknown): Array<{ name: string }> | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value
    .filter((person): person is Record<string, unknown> => Boolean(person) && typeof person === "object")
    .map((person) => ({
      name: optionalString(person.name) || "",
    }))
    .filter((person) => person.name);

  return normalized.length > 0 ? normalized : undefined;
}

function optionalIdentifiers(value: unknown): { doi?: string[] } | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return compactObject({
    doi: optionalStringArray((value as Record<string, unknown>).doi),
  });
}

function optionalSeeAlso(
  value: unknown
): Array<{ "@id": string; label: string }> | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
    .map((entry) => ({
      "@id": optionalString(entry["@id"]) || "",
      label: optionalString(entry.label) || "",
    }))
    .filter((entry) => entry["@id"] && entry.label);

  return normalized.length > 0 ? normalized : undefined;
}

function appendDuplicateTitleIssues(
  invalidRecords: ResearchmapImportIssue[],
  records: PublicationMasterRecord[]
): void {
  findDuplicatePublicationTitleGroups(records).forEach((group) => {
    invalidRecords.push({
      lineNumber: 0,
      reason: `タイトル重複: ${group.recordIds.join(", ")}`,
      type: "duplicate_title",
      title: group.title,
      date: "",
    });
  });
}
