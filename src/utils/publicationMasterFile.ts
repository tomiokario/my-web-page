import * as fs from "fs";
import * as path from "path";

import { Publication } from "../types";
import {
  LocalizedLanguage,
  LocalizedPeople,
  LocalizedText,
  PublicationMasterRecord,
  PublicationMasterResearchmapFields,
} from "../types/publicationMaster";
import {
  csvRowsToPublicationMaster,
  getLocalizedTextValue,
  parseCsvContent,
  publicationMasterToWebPublications,
  stringifyPeople,
} from "./publicationMaster";

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

  atomicWriteFile(paths.masterJsonFilePath, publicationMasterToJson(validatedRecords));
  atomicWriteFile(paths.webJsonFilePath, publicationWebDataToJson(webPublications));

  return webPublications;
}

function atomicWriteFile(filePath: string, contents: string): void {
  const directory = path.dirname(filePath);
  const tempFilePath = path.join(
    directory,
    `${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`
  );

  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(tempFilePath, contents, "utf8");
  fs.renameSync(tempFilePath, filePath);
}

function validatePublicationMasterRecords(
  value: unknown,
  sourceLabel: string
): PublicationMasterRecord[] {
  if (!Array.isArray(value)) {
    throw new Error(`${sourceLabel} は配列である必要があります`);
  }

  return value.map((record, index) =>
    validatePublicationMasterRecord(record, `${sourceLabel}[${index}]`)
  );
}

function validatePublicationMasterRecord(
  value: unknown,
  sourceLabel: string
): PublicationMasterRecord {
  const record = asObject(value, sourceLabel);
  const researchmapFields = validateResearchmapFields(
    record.researchmapFields,
    `${sourceLabel}.researchmapFields`
  );
  const localMeta = validateLocalMeta(record.localMeta, `${sourceLabel}.localMeta`);

  if (typeof record.id !== "string" || !record.id.trim()) {
    throw new Error(`${sourceLabel}.id は空でない文字列である必要があります`);
  }

  return {
    id: record.id,
    researchmapFields,
    localMeta,
  };
}

function validateResearchmapFields(
  value: unknown,
  sourceLabel: string
): PublicationMasterResearchmapFields {
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
    publication_date: optionalString(fields.publication_date, `${sourceLabel}.publication_date`),
    from_event_date: optionalString(fields.from_event_date, `${sourceLabel}.from_event_date`),
    to_event_date: optionalString(fields.to_event_date, `${sourceLabel}.to_event_date`),
    identifiers: optionalIdentifiers(fields.identifiers, `${sourceLabel}.identifiers`),
    see_also: optionalSeeAlso(fields.see_also, `${sourceLabel}.see_also`),
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
  });
}

function validateLocalMeta(
  value: unknown,
  sourceLabel: string
): PublicationMasterRecord["localMeta"] {
  const localMeta = asObject(value, sourceLabel);

  if (typeof localMeta.hasEmptyFields !== "boolean") {
    throw new Error(`${sourceLabel}.hasEmptyFields は boolean である必要があります`);
  }

  return {
    hasEmptyFields: localMeta.hasEmptyFields,
    notes: optionalString(localMeta.notes, `${sourceLabel}.notes`) || "",
  };
}

function validateType(
  value: unknown,
  sourceLabel: string
): PublicationMasterResearchmapFields["type"] {
  if (value === "published_papers" || value === "presentations" || value === "misc") {
    return value;
  }

  throw new Error(`${sourceLabel} は有効な researchmap type である必要があります`);
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

  return compactObject({ ja, en });
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
  });
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

function optionalIdentifiers(
  value: unknown,
  sourceLabel: string
): PublicationMasterResearchmapFields["identifiers"] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const identifiers = asObject(value, sourceLabel);
  return compactObject({
    doi: optionalStringArray(identifiers.doi, `${sourceLabel}.doi`),
  });
}

function optionalSeeAlso(
  value: unknown,
  sourceLabel: string
): PublicationMasterResearchmapFields["see_also"] | undefined {
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

    return {
      "@id": id,
      label: label || "url",
    };
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

function compactObject<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => {
      if (entryValue === undefined || entryValue === null) {
        return false;
      }
      if (Array.isArray(entryValue)) {
        return entryValue.length > 0;
      }
      if (typeof entryValue === "object") {
        return Object.keys(entryValue).length > 0;
      }
      return true;
    })
  ) as T;
}

export function summarizePublicationRecord(record: PublicationMasterRecord): string {
  const fields = record.researchmapFields;
  const title = getLocalizedTextValue(fields.paper_title || fields.presentation_title, "ja") ||
    getLocalizedTextValue(fields.paper_title || fields.presentation_title, "en") ||
    record.id;
  const people = stringifyPeople(fields.authors || fields.presenters, "ja") ||
    stringifyPeople(fields.authors || fields.presenters, "en");

  return [title, people].filter(Boolean).join(" / ");
}
