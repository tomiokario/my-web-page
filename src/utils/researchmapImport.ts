import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

import {
  LocalizedText,
  PublicationLink,
  PublicationContributor,
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
  getPublicationDate,
  getPublicationDoi,
  getPublicationTitleText,
  getPublicationVenue,
  getPublicationVenueText,
  normalizeDoi,
} from "./publicationMasterSchema";
import { slugify, uniquifyWithNumericSuffix } from "./stringIds";

const PUBLICATION_TYPES = new Set(["published_papers", "presentations", "misc"]);
const HISTORY_FILE_NAME = ".researchmap-import-history.json";

type PublicationType = PublicationMasterFields["type"];
type MatchStrategy = "record_id" | "doi" | "fingerprint" | "title";
type FieldPresence = Set<string>;
type LocalizedLanguage = keyof LocalizedText;
type ContributorSlot = PublicationContributor | undefined;

const LOCALIZED_LANGUAGES: LocalizedLanguage[] = ["ja", "en"];

const importedFieldPresence = new WeakMap<PublicationMasterFields, FieldPresence>();
const importedContributorSlots = new WeakMap<PublicationMasterFields, ContributorSlot[]>();

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
  const fields = buildCanonicalFieldsFromResearchmapPayload(type, payload);
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

function buildCanonicalFieldsFromResearchmapPayload(
  type: PublicationType,
  payload: Record<string, unknown>
): PublicationMasterFields {
  const subtype = resolveSubtype(type, payload);
  const presence = collectFieldPresence(type, payload);
  const contributorResult = optionalContributors(type, payload);

  const fields = compactObject({
    type,
    subtype,
    title: resolveResearchmapTitle(type, payload),
    contributors: contributorResult.contributors,
    venue: optionalVenue(type, payload),
    dates: optionalDates(type, payload),
    identifiers: optionalIdentifiers(payload.identifiers),
    links: optionalSeeAlso(payload.see_also),
    bibliographic: optionalBibliographic(payload),
    location: optionalLocalizedText(payload.location),
    description: optionalLocalizedText(payload.description),
    review: optionalBoolean(payload.referee),
    invited: optionalBoolean(payload.invited) ?? deriveInvitedFromSubtype(type, subtype),
    ownerRoles: optionalStringArray(payload.published_paper_owner_roles),
    isInternational:
      type === "presentations"
        ? optionalBoolean(payload.is_international_presentation)
        : optionalBoolean(payload.is_international_journal),
  }) as PublicationMasterFields;

  importedFieldPresence.set(fields, presence);
  if (contributorResult.slots) {
    importedContributorSlots.set(fields, contributorResult.slots);
  }

  return fields;
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

  const existingRecordId = existingRecord.sync?.researchmap?.recordId;
  const importedRecordId = importedRecord.sync?.researchmap?.recordId;
  if (existingRecordId && importedRecordId && existingRecordId !== importedRecordId) {
    conflicts.push("sync.researchmap.recordId");
  }

  const existingDoi = normalizeDoi(getPublicationDoi(existingFields));
  const importedDoi = normalizeDoi(getPublicationDoi(importedFields));
  if (existingDoi && importedDoi && existingDoi !== importedDoi) {
    conflicts.push("fields.identifiers.doi");
  }

  if (existingFields.type !== importedFields.type && !importedFields.subtype) {
    conflicts.push("fields.subtype");
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
  const presence = importedFieldPresence.get(importedFields) || new Set<string>();
  const type = importedFields.type;
  const existingContributors = normalizeContributorRoles(existingFields.contributors, type);
  const existingVenue = normalizeVenueKind(existingFields.venue, type);

  return compactObject({
    type,
    subtype: fieldValue(presence, "subtype", importedFields.subtype, existingFields.subtype),
    title: mergeLocalizedText(
      presence,
      "title",
      existingFields.title,
      importedFields.title
    ),
    contributors: mergeContributors(
      presence,
      existingContributors,
      importedContributorSlots.get(importedFields) || importedFields.contributors,
      type
    ),
    venue: mergeVenue(existingVenue, importedFields.venue, presence),
    dates: compactObject({
      published: fieldValue(
        presence,
        "dates.published",
        importedFields.dates?.published,
        existingFields.dates?.published
      ),
      eventStart: fieldValue(
        presence,
        "dates.eventStart",
        importedFields.dates?.eventStart,
        existingFields.dates?.eventStart
      ),
      eventEnd: fieldValue(
        presence,
        "dates.eventEnd",
        importedFields.dates?.eventEnd,
        existingFields.dates?.eventEnd
      ),
    }),
    identifiers: compactObject({
      doi: fieldValue(
        presence,
        "identifiers.doi",
        importedFields.identifiers?.doi,
        existingFields.identifiers?.doi
      ),
    }),
    links: fieldValue(presence, "links", importedFields.links, existingFields.links),
    bibliographic: compactObject({
      volume: fieldValue(
        presence,
        "bibliographic.volume",
        importedFields.bibliographic?.volume,
        existingFields.bibliographic?.volume
      ),
      number: fieldValue(
        presence,
        "bibliographic.number",
        importedFields.bibliographic?.number,
        existingFields.bibliographic?.number
      ),
      startPage:
        fieldValue(
          presence,
          "bibliographic.startPage",
          importedFields.bibliographic?.startPage,
          existingFields.bibliographic?.startPage
        ),
      endPage: fieldValue(
        presence,
        "bibliographic.endPage",
        importedFields.bibliographic?.endPage,
        existingFields.bibliographic?.endPage
      ),
    }),
    location: mergeLocalizedText(
      presence,
      "location",
      existingFields.location,
      importedFields.location
    ),
    description: mergeLocalizedText(
      presence,
      "description",
      existingFields.description,
      importedFields.description
    ),
    review: fieldValue(presence, "review", importedFields.review, existingFields.review),
    invited: fieldValue(presence, "invited", importedFields.invited, existingFields.invited),
    ownerRoles: fieldValue(
      presence,
      "ownerRoles",
      importedFields.ownerRoles,
      existingFields.ownerRoles
    ),
    isInternational: fieldValue(
      presence,
      "isInternational",
      importedFields.isInternational,
      existingFields.isInternational
    ),
  }) as PublicationMasterFields;
}

function mergeVenue(
  existingVenue: PublicationMasterFields["venue"],
  importedVenue: PublicationMasterFields["venue"],
  presence: FieldPresence
): PublicationMasterFields["venue"] {
  if (!existingVenue) {
    return importedVenue;
  }

  if (!importedVenue && !hasVenuePresence(presence)) {
    return existingVenue;
  }

  return {
    kind: importedVenue?.kind || existingVenue.kind,
    name: mergeLocalizedText(
      presence,
      "venue.name",
      existingVenue.name,
      importedVenue?.name
    ),
    promoter: mergeLocalizedText(
      presence,
      "venue.promoter",
      existingVenue.promoter,
      importedVenue?.promoter
    ),
    addressCountry: fieldValue(
      presence,
      "venue.addressCountry",
      importedVenue?.addressCountry,
      existingVenue.addressCountry
    ),
  };
}

function hasVenuePresence(presence: FieldPresence): boolean {
  return (
    presence.has("venue.name") ||
    presence.has("venue.promoter") ||
    presence.has("venue.addressCountry")
  );
}

function fieldValue<T>(
  presence: FieldPresence,
  fieldPath: string,
  importedValue: T | undefined,
  existingValue: T | undefined
): T | undefined {
  return presence.has(fieldPath) ? importedValue : existingValue;
}

function normalizeContributorRoles(
  contributors: PublicationMasterFields["contributors"],
  type: PublicationType
): PublicationMasterFields["contributors"] {
  if (!contributors) {
    return undefined;
  }

  const role = type === "presentations" ? "presenter" : "author";
  return contributors.map((contributor) => ({
    ...contributor,
    role,
  }));
}

function normalizeVenueKind(
  venue: PublicationMasterFields["venue"],
  type: PublicationType
): PublicationMasterFields["venue"] {
  if (!venue) {
    return undefined;
  }

  return {
    ...venue,
    kind: type === "presentations" ? "event" : "publication",
  };
}

function mergeLocalizedText(
  presence: FieldPresence,
  fieldPath: string,
  existingValue: LocalizedText | undefined,
  importedValue: LocalizedText | undefined
): LocalizedText | undefined {
  if (presence.has(fieldPath) && !hasNestedFieldPresence(presence, fieldPath)) {
    return undefined;
  }

  const merged = compactObject(
    Object.fromEntries(
      LOCALIZED_LANGUAGES.map((language) => [
        language,
        fieldValue(
          presence,
          `${fieldPath}.${language}`,
          importedValue?.[language],
          existingValue?.[language]
        ),
      ])
    )
  ) as LocalizedText;

  return Object.keys(merged).length > 0 ? (merged as LocalizedText) : undefined;
}

function mergeContributors(
  presence: FieldPresence,
  existingContributors: PublicationMasterFields["contributors"],
  importedContributors: ContributorSlot[] | undefined,
  type: PublicationType
): PublicationMasterFields["contributors"] {
  if (!presence.has("contributors")) {
    return existingContributors;
  }

  if (!hasNestedFieldPresence(presence, "contributors")) {
    return undefined;
  }

  const role = type === "presentations" ? "presenter" : "author";
  const count = Math.max(existingContributors?.length || 0, importedContributors?.length || 0);
  const contributors = Array.from({ length: count }, (_, index) => {
    const name = mergeLocalizedText(
      presence,
      `contributors.${index}.name`,
      existingContributors?.[index]?.name,
      importedContributors?.[index]?.name
    );

    return name ? { role, name } : undefined;
  }).filter((contributor): contributor is PublicationContributor => Boolean(contributor));

  return contributors.length > 0 ? contributors : undefined;
}

function hasNestedFieldPresence(presence: FieldPresence, fieldPath: string): boolean {
  const nestedPrefix = `${fieldPath}.`;
  return Array.from(presence).some((path) => path.startsWith(nestedPrefix));
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

function collectFieldPresence(
  type: PublicationType,
  payload: Record<string, unknown>
): FieldPresence {
  const presence: FieldPresence = new Set();

  addPresence(presence, "subtype", getSubtypePayloadKey(type), payload);
  addPresence(
    presence,
    "title",
    type === "presentations" ? "presentation_title" : "paper_title",
    payload
  );
  addLocalizedPresence(
    presence,
    "title",
    type === "presentations" ? "presentation_title" : "paper_title",
    payload
  );
  addPresence(
    presence,
    "contributors",
    type === "presentations" ? "presenters" : "authors",
    payload
  );
  addIndexedLocalizedPeoplePresence(
    presence,
    "contributors",
    type === "presentations" ? "presenters" : "authors",
    payload
  );
  addPresence(
    presence,
    "venue.name",
    type === "presentations" ? "event" : "publication_name",
    payload
  );
  addLocalizedPresence(
    presence,
    "venue.name",
    type === "presentations" ? "event" : "publication_name",
    payload
  );
  addPresence(presence, "venue.promoter", "promoter", payload);
  addLocalizedPresence(presence, "venue.promoter", "promoter", payload);
  addPresence(presence, "venue.addressCountry", "address_country", payload);
  addPresence(presence, "dates.published", "publication_date", payload);
  addPresence(presence, "dates.published", "from_event_date", payload);
  addPresence(presence, "dates.eventStart", "from_event_date", payload);
  addPresence(presence, "dates.eventEnd", "to_event_date", payload);
  addPresence(presence, "identifiers.doi", "identifiers", payload, "doi");
  addPresence(presence, "links", "see_also", payload);
  addPresence(presence, "bibliographic.volume", "volume", payload);
  addPresence(presence, "bibliographic.number", "number", payload);
  addPresence(presence, "bibliographic.startPage", "starting_page", payload);
  addPresence(presence, "bibliographic.endPage", "ending_page", payload);
  addPresence(presence, "location", "location", payload);
  addLocalizedPresence(presence, "location", "location", payload);
  addPresence(presence, "description", "description", payload);
  addLocalizedPresence(presence, "description", "description", payload);
  addPresence(presence, "review", "referee", payload);
  addPresence(presence, "ownerRoles", "published_paper_owner_roles", payload);
  addPresence(
    presence,
    "isInternational",
    type === "presentations" ? "is_international_presentation" : "is_international_journal",
    payload
  );

  if (hasOwn(payload, "invited") || (type === "presentations" && presence.has("subtype"))) {
    presence.add("invited");
  }

  return presence;
}

function getSubtypePayloadKey(type: PublicationType): string {
  if (type === "published_papers") {
    return "published_paper_type";
  }
  if (type === "presentations") {
    return "presentation_type";
  }
  return "misc_type";
}

function addPresence(
  presence: FieldPresence,
  fieldPath: string,
  payloadKey: string,
  payload: Record<string, unknown>,
  nestedKey?: string
): void {
  if (!hasOwn(payload, payloadKey)) {
    return;
  }

  if (!nestedKey) {
    presence.add(fieldPath);
    return;
  }

  const nestedValue = payload[payloadKey];
  if (
    nestedValue &&
    typeof nestedValue === "object" &&
    !Array.isArray(nestedValue) &&
    hasOwn(nestedValue as Record<string, unknown>, nestedKey)
  ) {
    presence.add(fieldPath);
  }
}

function addLocalizedPresence(
  presence: FieldPresence,
  fieldPath: string,
  payloadKey: string,
  payload: Record<string, unknown>
): void {
  if (!hasOwn(payload, payloadKey)) {
    return;
  }

  const localizedValue = payload[payloadKey];
  if (!localizedValue || typeof localizedValue !== "object" || Array.isArray(localizedValue)) {
    return;
  }

  const localized = localizedValue as Record<string, unknown>;
  LOCALIZED_LANGUAGES.forEach((language) => {
    if (hasOwn(localized, language)) {
      presence.add(`${fieldPath}.${language}`);
    }
  });
}

function addIndexedLocalizedPeoplePresence(
  presence: FieldPresence,
  fieldPath: string,
  payloadKey: string,
  payload: Record<string, unknown>
): void {
  if (!hasOwn(payload, payloadKey)) {
    return;
  }

  const localizedValue = payload[payloadKey];
  if (!localizedValue || typeof localizedValue !== "object" || Array.isArray(localizedValue)) {
    return;
  }

  const localized = localizedValue as Record<string, unknown>;
  LOCALIZED_LANGUAGES.forEach((language) => {
    const people = localized[language];
    if (!Array.isArray(people)) {
      return;
    }

    people.forEach((person, index) => {
      if (
        person &&
        typeof person === "object" &&
        !Array.isArray(person) &&
        hasOwn(person as Record<string, unknown>, "name")
      ) {
        presence.add(`${fieldPath}.${index}.name.${language}`);
      }
    });
  });
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function resolveSubtype(
  type: PublicationType,
  payload: Record<string, unknown>
): string | undefined {
  if (type === "published_papers") {
    return optionalString(payload.published_paper_type);
  }
  if (type === "presentations") {
    return optionalString(payload.presentation_type);
  }
  return optionalString(payload.misc_type);
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
  return uniquifyWithNumericSuffix(baseId, (candidateId) => existingIds.has(candidateId));
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
  return uniquifyWithNumericSuffix(baseId, (candidateId) => existingIds.has(candidateId));
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
  const text = compactObject({
    ja: optionalString(localized.ja),
    en: optionalString(localized.en),
  }) as LocalizedText;

  return Object.keys(text).length > 0 ? text : undefined;
}

function optionalIdentifiers(
  value: unknown
): PublicationMasterFields["identifiers"] | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const identifiers = value as Record<string, unknown>;
  const doi = optionalStringArray(identifiers.doi);

  return doi?.length ? { doi: doi[0] } : undefined;
}

function optionalSeeAlso(
  value: unknown
): PublicationMasterFields["links"] | undefined {
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
        url: id,
        label: optionalString(link.label) || "url",
        isDownloadable: optionalBoolean(link.is_downloadable),
      });
    })
    .filter(Boolean);

  return links.length > 0 ? (links as PublicationMasterFields["links"]) : undefined;
}

function optionalContributors(
  type: PublicationType,
  payload: Record<string, unknown>
): {
  contributors: PublicationMasterFields["contributors"] | undefined;
  slots: ContributorSlot[] | undefined;
} {
  const role = type === "presentations" ? "presenter" : "author";
  const source = type === "presentations" ? payload.presenters : payload.authors;
  return localizedPeopleToContributors(source, role);
}

function optionalVenue(
  type: PublicationType,
  payload: Record<string, unknown>
): PublicationMasterFields["venue"] | undefined {
  const name = type === "presentations" ? optionalLocalizedText(payload.event) : optionalLocalizedText(payload.publication_name);
  const kind = type === "presentations" ? "event" : "publication";
  const promoter = type === "presentations" ? optionalLocalizedText(payload.promoter) : undefined;
  const addressCountry =
    type === "presentations" ? optionalString(payload.address_country) : undefined;

  if (!name && !promoter && !addressCountry) {
    return undefined;
  }

  return compactObject({
    kind,
    name,
    promoter,
    addressCountry,
  }) as PublicationMasterFields["venue"];
}

function resolveResearchmapTitle(
  type: PublicationType,
  payload: Record<string, unknown>
): LocalizedText | undefined {
  if (type === "presentations") {
    return optionalLocalizedText(payload.presentation_title);
  }

  return optionalLocalizedText(payload.paper_title);
}

function optionalDates(
  _type: PublicationType,
  payload: Record<string, unknown>
): PublicationMasterFields["dates"] | undefined {
  const published = optionalString(payload.publication_date) || optionalString(payload.from_event_date);
  const eventStart = optionalString(payload.from_event_date);
  const eventEnd = optionalString(payload.to_event_date);

  if (!published && !eventStart && !eventEnd) {
    return undefined;
  }

  return compactObject({
    published,
    eventStart,
    eventEnd,
  }) as PublicationMasterFields["dates"];
}

function optionalBibliographic(
  payload: Record<string, unknown>
): PublicationMasterFields["bibliographic"] | undefined {
  const volume = optionalString(payload.volume);
  const number = optionalString(payload.number);
  const startPage = optionalString(payload.starting_page);
  const endPage = optionalString(payload.ending_page);

  if (!volume && !number && !startPage && !endPage) {
    return undefined;
  }

  return compactObject({
    volume,
    number,
    startPage,
    endPage,
  }) as PublicationMasterFields["bibliographic"];
}

function localizedPeopleToContributors(
  value: unknown,
  role: PublicationContributor["role"]
): {
  contributors: PublicationMasterFields["contributors"] | undefined;
  slots: ContributorSlot[] | undefined;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { contributors: undefined, slots: undefined };
  }

  const localized = value as Record<string, unknown>;
  const ja = optionalPeopleArray(localized.ja);
  const en = optionalPeopleArray(localized.en);
  const count = Math.max(ja.length, en.length);

  if (count === 0) {
    return { contributors: undefined, slots: undefined };
  }

  const slots = Array.from({ length: count }, (_, index) => {
    const name = compactObject({
      ja: ja[index],
      en: en[index],
    }) as LocalizedText;

    return Object.keys(name).length > 0 ? { role, name } : undefined;
  });
  const contributors = slots.filter(
    (item): item is PublicationContributor => Boolean(item)
  );

  return {
    contributors: contributors.length > 0 ? contributors : undefined,
    slots,
  };
}

function deriveInvitedFromSubtype(
  type: PublicationType,
  subtype: string | undefined
): boolean | undefined {
  if (type !== "presentations" || !subtype) {
    return undefined;
  }

  return subtype.startsWith("invited_") ? true : undefined;
}

function optionalPeopleArray(value: unknown): Array<string | undefined> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((person) => {
    if (!person || typeof person !== "object" || Array.isArray(person)) {
      return undefined;
    }

    return optionalString((person as Record<string, unknown>).name) || undefined;
  });
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

function cloneRecord(record: PublicationMasterRecord): PublicationMasterRecord {
  return JSON.parse(JSON.stringify(record)) as PublicationMasterRecord;
}
