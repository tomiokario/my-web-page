import { LocalizedText, PublicationMasterFields, PublicationMasterRecord } from "../types/publicationMaster";
import {
  buildCanonicalFingerprint,
  getPublicationDoi,
  getPublicationTitleText,
  getPublicationVenueText,
  normalizeDoi,
} from "./publicationMasterSchema";
import { normalizePublicationTitle } from "./publicationTitle";
import { PotentialReviewResult, StrictMatchResult } from "./researchmapImportTypes";

export function findStrictMatch(
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

export function findPotentialReviewMatch(
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

export function collectConflictingFields(
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

  const existingVenue = normalizePublicationTitle(
    getPublicationVenueText(existingFields, "ja") ||
      getPublicationVenueText(existingFields, "en")
  );
  const importedVenue = normalizePublicationTitle(
    getPublicationVenueText(importedFields, "ja") ||
      getPublicationVenueText(importedFields, "en")
  );
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

export function collectAmbiguousConflictingFields(
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

export function markUsedTargetIds(
  usedTargetIds: Set<string>,
  candidateRecords: PublicationMasterRecord[]
): void {
  candidateRecords.forEach((candidateRecord) => {
    usedTargetIds.add(candidateRecord.id);
  });
}

export function hasCanonicalTitle(fields: PublicationMasterFields): boolean {
  return Boolean(
    normalizePublicationTitle(fields.title?.ja || "") ||
      normalizePublicationTitle(fields.title?.en || "")
  );
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

function isEmptyFingerprint(value: string): boolean {
  return value
    .split("|")
    .slice(2)
    .every((part) => !part);
}
