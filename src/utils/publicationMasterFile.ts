import * as fs from "fs";
import * as path from "path";

import { Publication } from "../types";
import {
  LegacyPublicationMasterResearchmapFields,
  LocalizedLanguage,
  LocalizedPeople,
  LocalizedText,
  PublicationContributor,
  PublicationLink,
  PublicationMasterFields,
  PublicationMasterRecord,
} from "../types/publicationMaster";
import {
  csvRowsToPublicationMaster,
  parseCsvContent,
  publicationMasterToWebPublications,
} from "./publicationMaster";
import {
  compactObject,
  fromLegacyResearchmapFields,
  getLocalizedTextValue,
  getPublicationTitle,
  stringifyContributors,
} from "./publicationMasterSchema";
import { findDuplicatePublicationTitleGroups } from "./publicationTitle";

export interface PublicationArtifactPaths {
  masterJsonFilePath: string;
  webJsonFilePath: string;
}

export function csvToPublicationMaster(csvFilePath: string): PublicationMasterRecord[] {
  const csvData = fs.readFileSync(csvFilePath, "utf8");
  return csvRowsToPublicationMaster(parseCsvContent(csvData));
}

export function publicationMasterToJson(publications: PublicationMasterRecord[]): string {
  return `${JSON.stringify(publications, null, 2)}\n`;
}

export function publicationWebDataToJson(publications: Publication[]): string {
  return `${JSON.stringify(publications, null, 2)}\n`;
}

export function parsePublicationMasterJson(
  jsonText: string,
  sourceLabel = "publication master JSON"
): PublicationMasterRecord[] {
  const parsed = JSON.parse(jsonText) as unknown;
  return validatePublicationMasterRecords(parsed, sourceLabel);
}

export function readPublicationMasterFile(masterJsonFilePath: string): PublicationMasterRecord[] {
  const jsonText = fs.readFileSync(masterJsonFilePath, "utf8");
  return parsePublicationMasterJson(jsonText, masterJsonFilePath);
}

export function publicationMasterFileToWebPublications(masterJsonFilePath: string): Publication[] {
  return publicationMasterToWebPublications(readPublicationMasterFile(masterJsonFilePath));
}

export function writePublicationArtifacts(
  records: unknown,
  paths: PublicationArtifactPaths
): Publication[] {
  const validatedRecords = validatePublicationMasterRecords(records, "publication master payload");
  const webPublications = publicationMasterToWebPublications(validatedRecords);

  atomicWriteFiles([
    {
      filePath: paths.masterJsonFilePath,
      contents: publicationMasterToJson(validatedRecords),
    },
    {
      filePath: paths.webJsonFilePath,
      contents: publicationWebDataToJson(webPublications),
    },
  ]);

  return webPublications;
}

function atomicWriteFiles(
  writes: Array<{ filePath: string; contents: string }>
): void {
  const stagedWrites = writes.map(({ filePath, contents }, index) => {
    const directory = path.dirname(filePath);
    const tempFilePath = path.join(
      directory,
      `${path.basename(filePath)}.${process.pid}.${Date.now()}.${index}.tmp`
    );
    const backupFilePath = path.join(
      directory,
      `${path.basename(filePath)}.${process.pid}.${Date.now()}.${index}.bak`
    );

    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(tempFilePath, contents, "utf8");

    return {
      filePath,
      tempFilePath,
      backupFilePath,
      existed: fs.existsSync(filePath),
    };
  });

  try {
    stagedWrites.forEach((item) => {
      if (item.existed) {
        fs.renameSync(item.filePath, item.backupFilePath);
      }
    });

    stagedWrites.forEach((item) => {
      fs.renameSync(item.tempFilePath, item.filePath);
    });

    stagedWrites.forEach((item) => {
      if (fs.existsSync(item.backupFilePath)) {
        fs.unlinkSync(item.backupFilePath);
      }
    });
  } catch (error) {
    stagedWrites.forEach((item) => {
      if (fs.existsSync(item.tempFilePath)) {
        fs.unlinkSync(item.tempFilePath);
      }
      if (fs.existsSync(item.filePath)) {
        fs.unlinkSync(item.filePath);
      }
      if (item.existed && fs.existsSync(item.backupFilePath)) {
        fs.renameSync(item.backupFilePath, item.filePath);
      }
    });

    throw error;
  }
}

function validatePublicationMasterRecords(
  value: unknown,
  sourceLabel: string
): PublicationMasterRecord[] {
  if (!Array.isArray(value)) {
    throw new Error(`${sourceLabel} は配列である必要があります`);
  }

  const validatedRecords = value.map((record, index) =>
    validatePublicationMasterRecord(record, `${sourceLabel}[${index}]`)
  );

  const duplicateTitleGroups = findDuplicatePublicationTitleGroups(validatedRecords);
  if (duplicateTitleGroups.length > 0) {
    const duplicateSummary = duplicateTitleGroups
      .map((group) => `"${group.title}" (${group.recordIds.join(", ")})`)
      .join("; ");
    throw new Error(`${sourceLabel} に重複タイトルがあります: ${duplicateSummary}`);
  }

  return validatedRecords;
}

function validatePublicationMasterRecord(
  value: unknown,
  sourceLabel: string
): PublicationMasterRecord {
  const record = asObject(value, sourceLabel);

  if (typeof record.id !== "string" || !record.id.trim()) {
    throw new Error(`${sourceLabel}.id は空でない文字列である必要があります`);
  }

  const fields = record.fields
    ? validateCanonicalFields(record.fields, `${sourceLabel}.fields`)
    : fromLegacyResearchmapFields(
        validateLegacyResearchmapFields(
          record.researchmapFields,
          `${sourceLabel}.researchmapFields`
        )
      );
  const localMeta = validateLocalMeta(record.localMeta, `${sourceLabel}.localMeta`);
  const sync = optionalSync(record.sync, `${sourceLabel}.sync`);

  assertHasCanonicalTitle(fields, `${sourceLabel}.fields.title`);
  assertCanonicalSemantics(fields, `${sourceLabel}.fields`);

  return compactObject({
    id: record.id.trim(),
    fields,
    localMeta,
    sync,
  }) as PublicationMasterRecord;
}

function validateCanonicalFields(
  value: unknown,
  sourceLabel: string
): PublicationMasterFields {
  const fields = asObject(value, sourceLabel);
  const type = validateType(fields.type, `${sourceLabel}.type`);

  return compactObject({
    type,
    subtype: optionalString(fields.subtype, `${sourceLabel}.subtype`),
    title: optionalLocalizedText(fields.title, `${sourceLabel}.title`),
    contributors: optionalContributors(fields.contributors, `${sourceLabel}.contributors`),
    venue: optionalVenue(fields.venue, `${sourceLabel}.venue`),
    dates: optionalDates(fields.dates, `${sourceLabel}.dates`),
    identifiers: optionalIdentifiers(fields.identifiers, `${sourceLabel}.identifiers`),
    links: optionalLinks(fields.links, `${sourceLabel}.links`),
    bibliographic: optionalBibliographic(fields.bibliographic, `${sourceLabel}.bibliographic`),
    location: optionalLocalizedText(fields.location, `${sourceLabel}.location`),
    description: optionalLocalizedText(fields.description, `${sourceLabel}.description`),
    review: optionalBoolean(fields.review, `${sourceLabel}.review`),
    invited: optionalBoolean(fields.invited, `${sourceLabel}.invited`),
    ownerRoles: optionalStringArray(fields.ownerRoles, `${sourceLabel}.ownerRoles`),
    isInternational: optionalBoolean(fields.isInternational, `${sourceLabel}.isInternational`),
  }) as PublicationMasterFields;
}

function assertHasCanonicalTitle(
  fields: PublicationMasterFields,
  sourceLabel: string
): void {
  const hasTitle = Boolean(fields.title?.ja?.trim() || fields.title?.en?.trim());
  if (!hasTitle) {
    throw new Error(`${sourceLabel} は少なくとも ja または en のタイトルが必要です`);
  }
}

function assertCanonicalSemantics(
  fields: PublicationMasterFields,
  sourceLabel: string
): void {
  if (!fields.contributors?.length && !fields.venue) {
    return;
  }

  const expectedContributorRole = fields.type === "presentations" ? "presenter" : "author";
  const invalidContributor = fields.contributors?.find(
    (contributor) => contributor.role !== expectedContributorRole
  );
  if (invalidContributor) {
    throw new Error(
      `${sourceLabel}.contributors は ${fields.type} の場合 ${expectedContributorRole} role で統一する必要があります`
    );
  }

  if (fields.venue) {
    const expectedVenueKind = fields.type === "presentations" ? "event" : "publication";
    if (fields.venue.kind !== expectedVenueKind) {
      throw new Error(
        `${sourceLabel}.venue.kind は ${fields.type} の場合 ${expectedVenueKind} である必要があります`
      );
    }
  }
}

function validateLegacyResearchmapFields(
  value: unknown,
  sourceLabel: string
): LegacyPublicationMasterResearchmapFields {
  const fields = asObject(value, sourceLabel);
  const type = validateType(fields.type, `${sourceLabel}.type`);

  return compactObject({
    type,
    subtype: optionalString(fields.subtype, `${sourceLabel}.subtype`),
    paper_title: optionalLocalizedText(fields.paper_title, `${sourceLabel}.paper_title`),
    presentation_title: optionalLocalizedText(
      fields.presentation_title,
      `${sourceLabel}.presentation_title`
    ),
    authors: optionalLocalizedPeople(fields.authors, `${sourceLabel}.authors`),
    presenters: optionalLocalizedPeople(fields.presenters, `${sourceLabel}.presenters`),
    publication_name: optionalLocalizedText(
      fields.publication_name,
      `${sourceLabel}.publication_name`
    ),
    event: optionalLocalizedText(fields.event, `${sourceLabel}.event`),
    promoter: optionalLocalizedText(fields.promoter, `${sourceLabel}.promoter`),
    address_country: optionalString(fields.address_country, `${sourceLabel}.address_country`),
    publication_date: optionalString(fields.publication_date, `${sourceLabel}.publication_date`),
    from_event_date: optionalString(fields.from_event_date, `${sourceLabel}.from_event_date`),
    to_event_date: optionalString(fields.to_event_date, `${sourceLabel}.to_event_date`),
    identifiers: optionalLegacyIdentifiers(fields.identifiers, `${sourceLabel}.identifiers`),
    see_also: optionalLegacySeeAlso(fields.see_also, `${sourceLabel}.see_also`),
    volume: optionalString(fields.volume, `${sourceLabel}.volume`),
    number: optionalString(fields.number, `${sourceLabel}.number`),
    starting_page: optionalString(fields.starting_page, `${sourceLabel}.starting_page`),
    ending_page: optionalString(fields.ending_page, `${sourceLabel}.ending_page`),
    location: optionalLocalizedText(fields.location, `${sourceLabel}.location`),
    description: optionalLocalizedText(fields.description, `${sourceLabel}.description`),
    referee: optionalBoolean(fields.referee, `${sourceLabel}.referee`),
    invited: optionalBoolean(fields.invited, `${sourceLabel}.invited`),
    published_paper_owner_roles: optionalStringArray(
      fields.published_paper_owner_roles,
      `${sourceLabel}.published_paper_owner_roles`
    ),
    presentation_type: optionalString(fields.presentation_type, `${sourceLabel}.presentation_type`),
    published_paper_type: optionalString(
      fields.published_paper_type,
      `${sourceLabel}.published_paper_type`
    ),
    misc_type: optionalString(fields.misc_type, `${sourceLabel}.misc_type`),
    is_international_presentation: optionalBoolean(
      fields.is_international_presentation,
      `${sourceLabel}.is_international_presentation`
    ),
    is_international_journal: optionalBoolean(
      fields.is_international_journal,
      `${sourceLabel}.is_international_journal`
    ),
  }) as LegacyPublicationMasterResearchmapFields;
}

function validateLocalMeta(
  value: unknown,
  sourceLabel: string
): PublicationMasterRecord["localMeta"] {
  const localMeta = asObject(value, sourceLabel);

  if (typeof localMeta.hasEmptyFields !== "boolean") {
    throw new Error(`${sourceLabel}.hasEmptyFields は boolean である必要があります`);
  }

  return compactObject({
    hasEmptyFields: localMeta.hasEmptyFields,
    notes: optionalString(localMeta.notes, `${sourceLabel}.notes`) || "",
    legacyHints: optionalLegacyHints(localMeta.legacyHints, `${sourceLabel}.legacyHints`),
  }) as PublicationMasterRecord["localMeta"];
}

function optionalLegacyHints(
  value: unknown,
  sourceLabel: string
): PublicationMasterRecord["localMeta"]["legacyHints"] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const legacyHints = asObject(value, sourceLabel);
  return compactObject({
    authorship: optionalStringArray(legacyHints.authorship, `${sourceLabel}.authorship`),
    presentationType: optionalStringArray(
      legacyHints.presentationType,
      `${sourceLabel}.presentationType`
    ),
  });
}

function optionalSync(
  value: unknown,
  sourceLabel: string
): PublicationMasterRecord["sync"] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const sync = asObject(value, sourceLabel);
  const researchmap = sync.researchmap
    ? compactObject({
        recordId: optionalString(sync.researchmap && asObject(sync.researchmap, `${sourceLabel}.researchmap`).recordId, `${sourceLabel}.researchmap.recordId`),
        userId: optionalString(sync.researchmap && asObject(sync.researchmap, `${sourceLabel}.researchmap`).userId, `${sourceLabel}.researchmap.userId`),
        lastImportedAt: optionalString(sync.researchmap && asObject(sync.researchmap, `${sourceLabel}.researchmap`).lastImportedAt, `${sourceLabel}.researchmap.lastImportedAt`),
        lastPayloadHash: optionalString(sync.researchmap && asObject(sync.researchmap, `${sourceLabel}.researchmap`).lastPayloadHash, `${sourceLabel}.researchmap.lastPayloadHash`),
      })
    : undefined;

  return compactObject({
    researchmap,
  }) as PublicationMasterRecord["sync"];
}

function validateType(
  value: unknown,
  sourceLabel: string
): PublicationMasterFields["type"] {
  if (value === "published_papers" || value === "presentations" || value === "misc") {
    return value;
  }

  throw new Error(`${sourceLabel} は有効な researchmap type である必要があります`);
}

function optionalContributors(
  value: unknown,
  sourceLabel: string
): PublicationContributor[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error(`${sourceLabel} は配列である必要があります`);
  }

  const contributors = value.map((entry, index) => {
    const contributor = asObject(entry, `${sourceLabel}[${index}]`);
    const role = optionalString(contributor.role, `${sourceLabel}[${index}].role`);

    if (role !== "author" && role !== "presenter") {
      throw new Error(`${sourceLabel}[${index}].role は author か presenter である必要があります`);
    }

    const name = optionalLocalizedText(contributor.name, `${sourceLabel}[${index}].name`);
    if (!name) {
      throw new Error(`${sourceLabel}[${index}].name は少なくとも1言語必要です`);
    }

    return {
      role,
      name,
    } as PublicationContributor;
  });

  return contributors.length > 0 ? contributors : undefined;
}

function optionalVenue(
  value: unknown,
  sourceLabel: string
): PublicationMasterFields["venue"] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const venue = asObject(value, sourceLabel);
  const kind = optionalString(venue.kind, `${sourceLabel}.kind`);

  if (kind !== "publication" && kind !== "event") {
    throw new Error(`${sourceLabel}.kind は publication か event である必要があります`);
  }

  return compactObject({
    kind,
    name: optionalLocalizedText(venue.name, `${sourceLabel}.name`),
    promoter: optionalLocalizedText(venue.promoter, `${sourceLabel}.promoter`),
    addressCountry: optionalString(venue.addressCountry, `${sourceLabel}.addressCountry`),
  }) as PublicationMasterFields["venue"];
}

function optionalDates(
  value: unknown,
  sourceLabel: string
): PublicationMasterFields["dates"] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const dates = asObject(value, sourceLabel);
  return compactObject({
    published: optionalString(dates.published, `${sourceLabel}.published`),
    eventStart: optionalString(dates.eventStart, `${sourceLabel}.eventStart`),
    eventEnd: optionalString(dates.eventEnd, `${sourceLabel}.eventEnd`),
  });
}

function optionalIdentifiers(
  value: unknown,
  sourceLabel: string
): PublicationMasterFields["identifiers"] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const identifiers = asObject(value, sourceLabel);
  return compactObject({
    doi: optionalString(identifiers.doi, `${sourceLabel}.doi`),
  });
}

function optionalLegacyIdentifiers(
  value: unknown,
  sourceLabel: string
): LegacyPublicationMasterResearchmapFields["identifiers"] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const identifiers = asObject(value, sourceLabel);
  return compactObject({
    doi: optionalStringArray(identifiers.doi, `${sourceLabel}.doi`),
  });
}

function optionalLinks(value: unknown, sourceLabel: string): PublicationLink[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error(`${sourceLabel} は配列である必要があります`);
  }

  const links = value.map((entry, index) => {
    const link = asObject(entry, `${sourceLabel}[${index}]`);
    const url = optionalString(link.url, `${sourceLabel}[${index}].url`);

    if (!url) {
      throw new Error(`${sourceLabel}[${index}].url は空でない文字列である必要があります`);
    }

    return compactObject({
      url,
      label: optionalString(link.label, `${sourceLabel}[${index}].label`) || "url",
      isDownloadable: optionalBoolean(
        link.isDownloadable,
        `${sourceLabel}[${index}].isDownloadable`
      ),
    }) as PublicationLink;
  });

  return links.length > 0 ? links : undefined;
}

function optionalLegacySeeAlso(
  value: unknown,
  sourceLabel: string
): LegacyPublicationMasterResearchmapFields["see_also"] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error(`${sourceLabel} は配列である必要があります`);
  }

  return value.map((entry, index) => {
    const normalized = asObject(entry, `${sourceLabel}[${index}]`);
    const id = optionalString(normalized["@id"], `${sourceLabel}[${index}].@id`);
    const label = optionalString(normalized.label, `${sourceLabel}[${index}].label`);

    if (!id) {
      throw new Error(`${sourceLabel}[${index}].@id は空でない文字列である必要があります`);
    }

    return compactObject({
      "@id": id,
      label: label || "url",
      is_downloadable: optionalBoolean(
        normalized.is_downloadable,
        `${sourceLabel}[${index}].is_downloadable`
      ),
    }) as NonNullable<LegacyPublicationMasterResearchmapFields["see_also"]>[number];
  });
}

function optionalBibliographic(
  value: unknown,
  sourceLabel: string
): PublicationMasterFields["bibliographic"] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const bibliographic = asObject(value, sourceLabel);
  return compactObject({
    volume: optionalString(bibliographic.volume, `${sourceLabel}.volume`),
    number: optionalString(bibliographic.number, `${sourceLabel}.number`),
    startPage: optionalString(bibliographic.startPage, `${sourceLabel}.startPage`),
    endPage: optionalString(bibliographic.endPage, `${sourceLabel}.endPage`),
  });
}

function optionalLocalizedText(
  value: unknown,
  sourceLabel: string
): LocalizedText | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const localized = asObject(value, sourceLabel);
  const ja = optionalString(localized.ja, `${sourceLabel}.ja`);
  const en = optionalString(localized.en, `${sourceLabel}.en`);

  return compactObject({ ja, en }) as LocalizedText;
}

function optionalLocalizedPeople(
  value: unknown,
  sourceLabel: string
): LocalizedPeople | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const localized = asObject(value, sourceLabel);

  return compactObject({
    ja: optionalPeopleArray(localized.ja, `${sourceLabel}.ja`),
    en: optionalPeopleArray(localized.en, `${sourceLabel}.en`),
  }) as LocalizedPeople;
}

function optionalPeopleArray(
  value: unknown,
  sourceLabel: string
): LocalizedPeople[LocalizedLanguage] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error(`${sourceLabel} は配列である必要があります`);
  }

  return value.map((person, index) => {
    const normalized = asObject(person, `${sourceLabel}[${index}]`);
    const name = optionalString(normalized.name, `${sourceLabel}[${index}].name`);

    if (!name) {
      throw new Error(`${sourceLabel}[${index}].name は空でない文字列である必要があります`);
    }

    return { name };
  });
}

function optionalStringArray(value: unknown, sourceLabel: string): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error(`${sourceLabel} は配列である必要があります`);
  }

  const normalized = value.map((item, index) => {
    const stringValue = optionalString(item, `${sourceLabel}[${index}]`);

    if (!stringValue) {
      throw new Error(`${sourceLabel}[${index}] は空でない文字列である必要があります`);
    }

    return stringValue;
  });

  return normalized.length > 0 ? normalized : undefined;
}

function optionalString(value: unknown, sourceLabel: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error(`${sourceLabel} は文字列である必要があります`);
  }

  const normalized = value.trim();
  return normalized || undefined;
}

function optionalBoolean(value: unknown, sourceLabel: string): boolean | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "boolean") {
    throw new Error(`${sourceLabel} は boolean である必要があります`);
  }
  return value;
}

function asObject(value: unknown, sourceLabel: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${sourceLabel} はオブジェクトである必要があります`);
  }

  return value as Record<string, unknown>;
}

export function summarizePublicationRecord(record: PublicationMasterRecord): string {
  const title = getLocalizedTextValue(getPublicationTitle(record.fields), "ja") ||
    getLocalizedTextValue(getPublicationTitle(record.fields), "en") ||
    record.id;
  const defaultRole = record.fields.type === "presentations" ? "presenter" : "author";
  const people = stringifyContributors(record.fields.contributors, defaultRole, "ja") ||
    stringifyContributors(record.fields.contributors, defaultRole, "en");

  return [title, people].filter(Boolean).join(" / ");
}
