import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

import {
  LegacyPublicationMasterResearchmapFields,
  LocalizedPeople,
  LocalizedText,
  PublicationMasterFields,
  PublicationMasterRecord,
} from "../types/publicationMaster";
import {
  PublicationArtifactPaths,
  readPublicationMasterFile,
  writePublicationArtifacts,
} from "./publicationMasterFile";
import { findDuplicatePublicationTitleGroups, normalizePublicationTitle } from "./publicationTitle";
import {
  buildCanonicalFingerprint,
  compactObject,
  describePublicationRecord,
  fromLegacyResearchmapFields,
  getPublicationDate,
  getPublicationDoi,
  getPublicationTitleText,
  getPublicationVenue,
  getPublicationVenueText,
  normalizeDoi,
} from "./publicationMasterSchema";

const PUBLICATION_TYPES = new Set(["published_papers", "presentations", "misc"]);
const HISTORY_FILE_NAME = ".researchmap-import-history.json";

type PublicationType = PublicationMasterFields["type"];
type MatchStrategy = "record_id" | "doi" | "fingerprint" | "title";

interface ResearchmapJsonlRecord {
  insert?: {
    id?: string;
    type?: string;
    user_id?: string;
  };
  merge?: Record<string, unknown>;
  force?: Record<string, unknown>;
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

interface SourceRecordSummary {
  type: string;
  title: string;
  date: string;
  recordId?: string;
}

interface JsonlLineEntry {
  line: string;
  lineNumber: number;
}

interface CandidateRecordSummary extends SourceRecordSummary {
  id: string;
  subtype?: string;
}

interface StrictMatchResult {
  strategy: Exclude<MatchStrategy, "title">;
  candidates: PublicationMasterRecord[];
}

interface PotentialReviewResult {
  strategy: MatchStrategy;
  candidates: PublicationMasterRecord[];
}

export interface ResearchmapImportIssue {
  lineNumber: number;
  reason: string;
  sourceRecord: SourceRecordSummary;
}

export interface ResearchmapImportReviewItem extends ResearchmapImportIssue {
  matchStrategy?: MatchStrategy;
  candidateRecords: CandidateRecordSummary[];
  conflictingFields: string[];
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
    review: number;
    invalid: number;
  };
  reviewItems: ResearchmapImportReviewItem[];
  invalidRecords: ResearchmapImportIssue[];
  archivedTo?: string;
}

export interface ResearchmapImportOptions {
  dryRun?: boolean;
  archiveDirPath?: string;
  importedAt?: Date;
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
  const nextRecords = existingRecords.map((record) => cloneRecord(record));
  const usedTargetIds = new Set<string>();
  const reviewItems: ResearchmapImportReviewItem[] = [];
  const invalidRecords: ResearchmapImportIssue[] = [];
  let publicationRecords = 0;
  let matched = 0;
  let added = 0;
  let skippedNonPublication = 0;

  const lines = inputContent
    .split(/\r?\n/)
    .map((line, lineIndex) => ({
      line: line.trim(),
      lineNumber: lineIndex + 1,
    }))
    .filter((entry) => entry.line.length > 0);

  lines.forEach((entry, lineIndex) => {
    const { line, lineNumber } = entry;

    try {
      const record = parseJsonlLine(line, lineNumber);
      const type = record.insert?.type || "";

      if (!PUBLICATION_TYPES.has(type)) {
        skippedNonPublication += 1;
        return;
      }

      publicationRecords += 1;

      const importedRecord = buildMasterRecordFromResearchmapRecord(
        record,
        buildImportedRecordId(existingRecords, nextRecords, lineIndex),
        importedAt,
        hashJsonlLine(line)
      );

      if (!hasCanonicalTitle(importedRecord.fields)) {
        reviewItems.push(
          buildReviewItem(
            lineNumber,
            importedRecord,
            "title が不足しているため自動追加できません",
            "title",
            [],
            ["fields.title"]
          )
        );
        return;
      }

      const strictMatch = findStrictMatch(nextRecords, importedRecord);

      if (strictMatch.candidates.length > 1) {
        markUsedTargetIds(usedTargetIds, strictMatch.candidates);
        reviewItems.push(
          buildReviewItem(
            lineNumber,
            importedRecord,
            `strict match (${strictMatch.strategy}) が一意に定まりません`,
            strictMatch.strategy,
            strictMatch.candidates,
            collectAmbiguousConflictingFields(strictMatch.candidates, importedRecord)
          )
        );
        return;
      }

      if (strictMatch.candidates.length === 1) {
        const candidate = strictMatch.candidates[0];
        const conflictingFields = collectConflictingFields(candidate, importedRecord);

        if (usedTargetIds.has(candidate.id)) {
          reviewItems.push(
            buildReviewItem(
              lineNumber,
              importedRecord,
              "同一 import 内で同じ対象 record に複数行が対応しています",
              strictMatch.strategy,
              [candidate],
              conflictingFields.length > 0 ? conflictingFields : ["id"]
            )
          );
          return;
        }

        if (conflictingFields.length > 0) {
          markUsedTargetIds(usedTargetIds, [candidate]);
          reviewItems.push(
            buildReviewItem(
              lineNumber,
              importedRecord,
              "strict match は見つかりましたが保護対象 field に差分があります",
              strictMatch.strategy,
              [candidate],
              conflictingFields
            )
          );
          return;
        }

        usedTargetIds.add(candidate.id);
        const targetIndex = nextRecords.findIndex((recordItem) => recordItem.id === candidate.id);
        nextRecords[targetIndex] = mergeMatchedRecord(candidate, importedRecord);
        matched += 1;
        return;
      }

      const potentialReview = findPotentialReviewMatch(nextRecords, importedRecord);
      if (potentialReview.candidates.length > 0) {
        markUsedTargetIds(usedTargetIds, potentialReview.candidates);
        const conflictingFields =
          potentialReview.candidates.length === 1
            ? collectConflictingFields(potentialReview.candidates[0], importedRecord)
            : collectAmbiguousConflictingFields(potentialReview.candidates, importedRecord);

        reviewItems.push(
          buildReviewItem(
            lineNumber,
            importedRecord,
            "strict match に該当しない近接候補があるため review が必要です",
            potentialReview.strategy,
            potentialReview.candidates,
            conflictingFields
          )
        );
        return;
      }

      const nextRecord = {
        ...importedRecord,
        id: uniquifyRecordId(nextRecords, importedRecord.id),
      };
      nextRecords.push(nextRecord);
      usedTargetIds.add(nextRecord.id);
      added += 1;
    } catch (error: unknown) {
      invalidRecords.push(buildImportErrorIssue(lineNumber, error));
    }
  });

  appendDuplicateTitleIssues(invalidRecords, nextRecords);

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
      review: reviewItems.length,
      invalid: invalidRecords.length,
    },
    reviewItems,
    invalidRecords,
  };

  if (dryRun || reviewItems.length > 0 || invalidRecords.length > 0) {
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

function buildMasterRecordFromResearchmapRecord(
  record: ResearchmapJsonlRecord,
  fallbackId: string,
  importedAt: string,
  payloadHash: string
): PublicationMasterRecord {
  const type = normalizePublicationType(record.insert?.type);
  if (!type) {
    throw new Error("publication type が不正です");
  }

  const payload = getPayload(record);
  const legacyFields = sanitizeResearchmapFields(type, payload);
  const fields = fromLegacyResearchmapFields(legacyFields);
  const recordId = buildRecordId(fields, fallbackId);

  return compactObject({
    id: recordId,
    fields,
    localMeta: {
      hasEmptyFields: false,
      notes: "",
    },
    sync: {
      researchmap: compactObject({
        recordId: optionalString(record.insert?.id),
        userId: optionalString(record.insert?.user_id),
        lastImportedAt: importedAt,
        lastPayloadHash: payloadHash,
      }),
    },
  }) as PublicationMasterRecord;
}

function sanitizeResearchmapFields(
  type: PublicationType,
  payload: Record<string, unknown>
): LegacyPublicationMasterResearchmapFields {
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
    promoter: optionalLocalizedText(payload.promoter),
    address_country: optionalString(payload.address_country),
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
    presentation_type:
      type === "presentations" ? optionalString(payload.presentation_type) : undefined,
    published_paper_type:
      type === "published_papers" ? optionalString(payload.published_paper_type) : undefined,
    misc_type: type === "misc" ? optionalString(payload.misc_type) : undefined,
    is_international_presentation:
      type === "presentations"
        ? optionalBoolean(payload.is_international_presentation)
        : undefined,
    is_international_journal:
      type === "presentations" ? undefined : optionalBoolean(payload.is_international_journal),
  }) as LegacyPublicationMasterResearchmapFields;
}

function findStrictMatch(
  currentRecords: PublicationMasterRecord[],
  importedRecord: PublicationMasterRecord
): StrictMatchResult {
  const importedRecordId = importedRecord.sync?.researchmap?.recordId;
  if (importedRecordId) {
    const matches = currentRecords.filter(
      (record) => record.sync?.researchmap?.recordId === importedRecordId
    );
    if (matches.length > 0) {
      return {
        strategy: "record_id",
        candidates: matches,
      };
    }
  }

  const importedDoi = normalizeDoi(getPublicationDoi(importedRecord.fields));
  if (importedDoi) {
    const matches = currentRecords.filter(
      (record) => normalizeDoi(getPublicationDoi(record.fields)) === importedDoi
    );
    if (matches.length > 0) {
      return {
        strategy: "doi",
        candidates: matches,
      };
    }
  }

  const fingerprint = buildCanonicalFingerprint(importedRecord.fields);
  if (!isEmptyFingerprint(fingerprint)) {
    const matches = currentRecords.filter(
      (record) => buildCanonicalFingerprint(record.fields) === fingerprint
    );
    if (matches.length > 0) {
      return {
        strategy: "fingerprint",
        candidates: matches,
      };
    }
  }

  return {
    strategy: "fingerprint",
    candidates: [],
  };
}

function findPotentialReviewMatch(
  currentRecords: PublicationMasterRecord[],
  importedRecord: PublicationMasterRecord
): PotentialReviewResult {
  const importedTitle = normalizePublicationTitle(getPublicationTitleText(importedRecord.fields));

  if (!importedTitle) {
    return {
      strategy: "title",
      candidates: [],
    };
  }

  const matches = currentRecords.filter(
    (record) => normalizePublicationTitle(getPublicationTitleText(record.fields)) === importedTitle
  );

  return {
    strategy: "title",
    candidates: matches,
  };
}

function collectConflictingFields(
  existingRecord: PublicationMasterRecord,
  importedRecord: PublicationMasterRecord
): string[] {
  const conflicts: string[] = [];
  const existingFields = existingRecord.fields;
  const importedFields = importedRecord.fields;

  if (existingFields.type !== importedFields.type) {
    conflicts.push("fields.type");
  }

  if (
    existingFields.subtype &&
    importedFields.subtype &&
    existingFields.subtype !== importedFields.subtype
  ) {
    conflicts.push("fields.subtype");
  }

  const existingDoi = normalizeDoi(getPublicationDoi(existingFields));
  const importedDoi = normalizeDoi(getPublicationDoi(importedFields));
  if (existingDoi && importedDoi && existingDoi !== importedDoi) {
    conflicts.push("fields.identifiers.doi");
  }

  const existingTitle = normalizePublicationTitle(getPublicationTitleText(existingFields));
  const importedTitle = normalizePublicationTitle(getPublicationTitleText(importedFields));
  if (
    (existingTitle && importedTitle && existingTitle !== importedTitle) ||
    hasLocalizedTextConflict(existingFields.title, importedFields.title)
  ) {
    conflicts.push("fields.title");
  }

  if (hasContributorConflict(existingFields, importedFields)) {
    conflicts.push("fields.contributors");
  }

  const existingVenue = normalizePublicationTitle(getPublicationVenueText(existingFields, "ja") || getPublicationVenueText(existingFields, "en"));
  const importedVenue = normalizePublicationTitle(getPublicationVenueText(importedFields, "ja") || getPublicationVenueText(importedFields, "en"));
  if (
    (existingVenue && importedVenue && existingVenue !== importedVenue) ||
    hasLocalizedTextConflict(existingFields.venue?.name, importedFields.venue?.name)
  ) {
    conflicts.push("fields.venue.name");
  }

  if (hasLocalizedTextConflict(existingFields.venue?.promoter, importedFields.venue?.promoter)) {
    conflicts.push("fields.venue.promoter");
  }

  if (
    existingFields.venue?.addressCountry &&
    importedFields.venue?.addressCountry &&
    existingFields.venue.addressCountry !== importedFields.venue.addressCountry
  ) {
    conflicts.push("fields.venue.addressCountry");
  }

  if (hasDateConflict(existingFields, importedFields)) {
    conflicts.push("fields.dates");
  }

  if (
    existingFields.isInternational !== undefined &&
    importedFields.isInternational !== undefined &&
    existingFields.isInternational !== importedFields.isInternational
  ) {
    conflicts.push("fields.isInternational");
  }

  return conflicts;
}

function mergeMatchedRecord(
  existingRecord: PublicationMasterRecord,
  importedRecord: PublicationMasterRecord
): PublicationMasterRecord {
  return {
    ...existingRecord,
    fields: mergePublicationFields(existingRecord.fields, importedRecord.fields),
    localMeta: existingRecord.localMeta,
    sync: compactObject({
      researchmap: compactObject({
        ...existingRecord.sync?.researchmap,
        ...importedRecord.sync?.researchmap,
      }),
    }),
  };
}

function mergePublicationFields(
  existingFields: PublicationMasterFields,
  importedFields: PublicationMasterFields
): PublicationMasterFields {
  return compactObject({
    type: importedFields.type,
    subtype: importedFields.subtype || existingFields.subtype,
    title: mergeLocalizedText(existingFields.title, importedFields.title),
    contributors: importedFields.contributors || existingFields.contributors,
    venue: mergeVenue(existingFields.venue, importedFields.venue),
    dates: compactObject({
      published: importedFields.dates?.published || existingFields.dates?.published,
      eventStart: importedFields.dates?.eventStart || existingFields.dates?.eventStart,
      eventEnd: importedFields.dates?.eventEnd || existingFields.dates?.eventEnd,
    }),
    identifiers: compactObject({
      doi: importedFields.identifiers?.doi || existingFields.identifiers?.doi,
    }),
    links: importedFields.links || existingFields.links,
    bibliographic: compactObject({
      volume: importedFields.bibliographic?.volume || existingFields.bibliographic?.volume,
      number: importedFields.bibliographic?.number || existingFields.bibliographic?.number,
      startPage:
        importedFields.bibliographic?.startPage || existingFields.bibliographic?.startPage,
      endPage: importedFields.bibliographic?.endPage || existingFields.bibliographic?.endPage,
    }),
    location: mergeLocalizedText(existingFields.location, importedFields.location),
    description: mergeLocalizedText(existingFields.description, importedFields.description),
    review:
      importedFields.review !== undefined ? importedFields.review : existingFields.review,
    invited:
      importedFields.invited !== undefined ? importedFields.invited : existingFields.invited,
    ownerRoles: importedFields.ownerRoles || existingFields.ownerRoles,
    isInternational:
      importedFields.isInternational !== undefined
        ? importedFields.isInternational
        : existingFields.isInternational,
  }) as PublicationMasterFields;
}

function mergeVenue(
  existingVenue: PublicationMasterFields["venue"],
  importedVenue: PublicationMasterFields["venue"]
): PublicationMasterFields["venue"] {
  if (!existingVenue) {
    return importedVenue;
  }

  if (!importedVenue) {
    return existingVenue;
  }

  return {
    kind: importedVenue.kind || existingVenue.kind,
    name: mergeLocalizedText(existingVenue.name, importedVenue.name),
    promoter: mergeLocalizedText(existingVenue.promoter, importedVenue.promoter),
    addressCountry: importedVenue.addressCountry || existingVenue.addressCountry,
  };
}

function mergeLocalizedText(
  existingValue: LocalizedText | undefined,
  importedValue: LocalizedText | undefined
): LocalizedText | undefined {
  return compactObject({
    ja: importedValue?.ja || existingValue?.ja,
    en: importedValue?.en || existingValue?.en,
  }) as LocalizedText;
}

function hasContributorConflict(
  existingFields: PublicationMasterFields,
  importedFields: PublicationMasterFields
): boolean {
  if (!existingFields.contributors?.length || !importedFields.contributors?.length) {
    return false;
  }

  if (existingFields.contributors.length !== importedFields.contributors.length) {
    return true;
  }

  return existingFields.contributors.some((contributor, index) => {
    const importedContributor = importedFields.contributors?.[index];
    if (!importedContributor) {
      return true;
    }

    return (
      contributor.role !== importedContributor.role ||
      normalizePublicationTitle(contributor.name.ja || contributor.name.en) !==
        normalizePublicationTitle(importedContributor.name.ja || importedContributor.name.en) ||
      hasLocalizedTextConflict(contributor.name, importedContributor.name)
    );
  });
}

function hasDateConflict(
  existingFields: PublicationMasterFields,
  importedFields: PublicationMasterFields
): boolean {
  const keys: Array<keyof NonNullable<PublicationMasterFields["dates"]>> = [
    "published",
    "eventStart",
    "eventEnd",
  ];

  return keys.some((key) => {
    const existingValue = existingFields.dates?.[key];
    const importedValue = importedFields.dates?.[key];
    return Boolean(existingValue && importedValue && existingValue !== importedValue);
  });
}

function collectAmbiguousConflictingFields(
  candidateRecords: PublicationMasterRecord[],
  importedRecord: PublicationMasterRecord
): string[] {
  const conflicts = new Set<string>();

  candidateRecords.forEach((candidateRecord) => {
    collectConflictingFields(candidateRecord, importedRecord).forEach((field) => {
      conflicts.add(field);
    });
  });

  addCandidateVarianceFields(conflicts, candidateRecords);

  if (conflicts.size === 0) {
    conflicts.add("id");
  }

  return Array.from(conflicts);
}

function addCandidateVarianceFields(
  conflicts: Set<string>,
  candidateRecords: PublicationMasterRecord[]
): void {
  if (hasDistinctValues(candidateRecords.map((record) => record.id))) {
    conflicts.add("id");
  }

  if (
    hasDistinctValues(
      candidateRecords.map((record) => record.sync?.researchmap?.recordId || "")
    )
  ) {
    conflicts.add("sync.researchmap.recordId");
  }

  if (hasDistinctValues(candidateRecords.map((record) => record.fields.type))) {
    conflicts.add("fields.type");
  }

  if (hasDistinctValues(candidateRecords.map((record) => record.fields.subtype || ""))) {
    conflicts.add("fields.subtype");
  }

  if (
    hasDistinctValues(
      candidateRecords.map((record) => normalizeDoi(getPublicationDoi(record.fields)))
    )
  ) {
    conflicts.add("fields.identifiers.doi");
  }

  if (
    hasDistinctValues(
      candidateRecords.map((record) =>
        normalizePublicationTitle(getPublicationTitleText(record.fields))
      )
    )
  ) {
    conflicts.add("fields.title");
  }

  if (
    hasDistinctValues(
      candidateRecords.map((record) =>
        normalizePublicationTitle(
          getPublicationVenueText(record.fields, "ja") ||
            getPublicationVenueText(record.fields, "en")
        )
      )
    )
  ) {
    conflicts.add("fields.venue.name");
  }

  if (
    hasDistinctValues(
      candidateRecords.map((record) => JSON.stringify(record.fields.venue?.promoter || {}))
    )
  ) {
    conflicts.add("fields.venue.promoter");
  }

  if (
    hasDistinctValues(
      candidateRecords.map((record) => record.fields.venue?.addressCountry || "")
    )
  ) {
    conflicts.add("fields.venue.addressCountry");
  }

  if (
    hasDistinctValues(
      candidateRecords.map((record) => JSON.stringify(record.fields.dates || {}))
    )
  ) {
    conflicts.add("fields.dates");
  }

  if (
    hasDistinctValues(
      candidateRecords.map((record) => JSON.stringify(record.fields.contributors || []))
    )
  ) {
    conflicts.add("fields.contributors");
  }

  if (
    hasDistinctValues(
      candidateRecords.map((record) => String(record.fields.isInternational ?? ""))
    )
  ) {
    conflicts.add("fields.isInternational");
  }
}

function hasDistinctValues(values: string[]): boolean {
  return new Set(values).size > 1;
}

function markUsedTargetIds(
  usedTargetIds: Set<string>,
  candidateRecords: PublicationMasterRecord[]
): void {
  candidateRecords.forEach((candidateRecord) => {
    usedTargetIds.add(candidateRecord.id);
  });
}

function hasLocalizedTextConflict(
  existingValue: LocalizedText | undefined,
  importedValue: LocalizedText | undefined
): boolean {
  return (
    hasLocalizedTextConflictForLocale(existingValue, importedValue, "ja") ||
    hasLocalizedTextConflictForLocale(existingValue, importedValue, "en")
  );
}

function hasLocalizedTextConflictForLocale(
  existingValue: LocalizedText | undefined,
  importedValue: LocalizedText | undefined,
  locale: "ja" | "en"
): boolean {
  const existingText = normalizePublicationTitle(existingValue?.[locale] || "");
  const importedText = normalizePublicationTitle(importedValue?.[locale] || "");

  return Boolean(existingText && importedText && existingText !== importedText);
}

function hasCanonicalTitle(fields: PublicationMasterFields): boolean {
  return Boolean(
    normalizePublicationTitle(fields.title?.ja || "") ||
      normalizePublicationTitle(fields.title?.en || "")
  );
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

function appendDuplicateTitleIssues(
  invalidRecords: ResearchmapImportIssue[],
  records: PublicationMasterRecord[]
): void {
  findDuplicatePublicationTitleGroups(records).forEach((group) => {
    invalidRecords.push({
      lineNumber: 0,
      reason: `タイトル重複があります: "${group.title}" (${group.recordIds.join(", ")})`,
      sourceRecord: {
        type: "duplicate_title",
        title: group.title,
        date: "",
      },
    });
  });
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

function buildRecordId(fields: PublicationMasterFields, fallbackId: string): string {
  const year = (getPublicationDate(fields) || "undated").slice(0, 4);
  const title = getPublicationTitleText(fields);
  const venue = getPublicationVenue(fields);
  const slugBase = slugify(title || venue?.ja || venue?.en || fallbackId);
  return `pub-${year}-${slugBase || fallbackId}`;
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

function buildReviewItem(
  lineNumber: number,
  importedRecord: PublicationMasterRecord,
  reason: string,
  matchStrategy: MatchStrategy,
  candidateRecords: PublicationMasterRecord[],
  conflictingFields: string[]
): ResearchmapImportReviewItem {
  return {
    lineNumber,
    reason,
    sourceRecord: summarizeSourceRecord(importedRecord),
    matchStrategy,
    candidateRecords: candidateRecords.map((record) => ({
      ...describePublicationRecord(record),
    })),
    conflictingFields,
  };
}

function buildImportErrorIssue(
  lineNumber: number,
  error: unknown
): ResearchmapImportIssue {
  return {
    lineNumber,
    reason: error instanceof Error ? error.message : "不明なエラー",
    sourceRecord: {
      type: "invalid_jsonl",
      title: "",
      date: "",
    },
  };
}

function summarizeSourceRecord(record: PublicationMasterRecord): SourceRecordSummary {
  return {
    type: record.fields.type,
    title: getPublicationTitleText(record.fields),
    date: getPublicationDate(record.fields),
    recordId: record.sync?.researchmap?.recordId,
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
    `${sourceBaseName}-${timestamp}-${fileHash.slice(0, 8)}${sourceExt}`
  );

  try {
    fs.renameSync(sourcePath, archivedPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EXDEV") {
      throw error;
    }

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

  const parsed = JSON.parse(fs.readFileSync(historyFilePath, "utf8")) as ImportHistoryFile;
  return {
    version: 1,
    entries: Array.isArray(parsed.entries) ? parsed.entries : [],
  };
}

function writeImportHistory(historyFilePath: string, history: ImportHistoryFile): void {
  fs.mkdirSync(path.dirname(historyFilePath), { recursive: true });
  fs.writeFileSync(historyFilePath, `${JSON.stringify(history, null, 2)}\n`, "utf8");
}

function getPayload(record: ResearchmapJsonlRecord): Record<string, unknown> {
  const payload = record.merge || record.force;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("merge または force payload が必要です");
  }

  return payload;
}

function normalizePublicationType(type: string | undefined): PublicationType | undefined {
  if (type === "published_papers" || type === "presentations" || type === "misc") {
    return type;
  }
  return undefined;
}

function optionalLocalizedText(value: unknown): LocalizedText | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const localized = value as Record<string, unknown>;
  return compactObject({
    ja: optionalString(localized.ja),
    en: optionalString(localized.en),
  }) as LocalizedText;
}

function optionalLocalizedPeople(value: unknown): LocalizedPeople | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const localized = value as Record<string, unknown>;
  return compactObject({
    ja: optionalPeopleArray(localized.ja),
    en: optionalPeopleArray(localized.en),
  }) as LocalizedPeople;
}

function optionalPeopleArray(value: unknown): LocalizedPeople["ja"] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const people = value
    .map((person) => {
      if (!person || typeof person !== "object" || Array.isArray(person)) {
        return undefined;
      }
      const name = optionalString((person as Record<string, unknown>).name);
      return name ? { name } : undefined;
    })
    .filter((person): person is { name: string } => Boolean(person));

  return people.length > 0 ? people : undefined;
}

function optionalIdentifiers(
  value: unknown
): LegacyPublicationMasterResearchmapFields["identifiers"] | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const identifiers = value as Record<string, unknown>;
  const doi = optionalStringArray(identifiers.doi);

  return doi?.length ? { doi } : undefined;
}

function optionalSeeAlso(
  value: unknown
): LegacyPublicationMasterResearchmapFields["see_also"] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const links = value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return undefined;
      }
      const link = entry as Record<string, unknown>;
      const id = optionalString(link["@id"]);
      if (!id) {
        return undefined;
      }

      return compactObject({
        "@id": id,
        label: optionalString(link.label) || "url",
        is_downloadable: optionalBoolean(link.is_downloadable),
      });
    })
    .filter(Boolean);

  return links.length > 0
    ? (links as LegacyPublicationMasterResearchmapFields["see_also"])
    : undefined;
}

function optionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const strings = value
    .map((item) => optionalString(item))
    .filter((item): item is string => Boolean(item));

  return strings.length > 0 ? strings : undefined;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function hashJsonlLine(line: string): string {
  return crypto.createHash("sha256").update(line).digest("hex");
}

function isEmptyFingerprint(value: string): boolean {
  return value
    .split("|")
    .slice(2)
    .every((part) => !part);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function cloneRecord(record: PublicationMasterRecord): PublicationMasterRecord {
  return JSON.parse(JSON.stringify(record)) as PublicationMasterRecord;
}
