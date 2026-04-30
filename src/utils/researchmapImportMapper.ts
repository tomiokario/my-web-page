import {
  LocalizedText,
  PublicationContributor,
  PublicationMasterFields,
  PublicationMasterRecord,
} from "../types/publicationMaster";
import {
  compactObject,
  getPublicationDate,
  getPublicationTitleText,
  getPublicationVenue,
} from "./publicationMasterSchema";
import { slugify, uniquifyWithNumericSuffix } from "./stringIds";
import { rememberImportedFieldMetadata } from "./researchmapImportFieldPresence";
import {
  ContributorSlot,
  FieldPresence,
  LOCALIZED_LANGUAGES,
  PublicationType,
  ResearchmapJsonlRecord,
} from "./researchmapImportTypes";

export function parseJsonlLine(line: string, lineNumber: number): ResearchmapJsonlRecord {
  try {
    return JSON.parse(line) as ResearchmapJsonlRecord;
  } catch (error: unknown) {
    throw new Error(`line ${lineNumber} の JSON 解析に失敗しました`);
  }
}

export function buildMasterRecordFromResearchmapRecord(
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

export function buildCanonicalFieldsFromResearchmapPayload(
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
    dates: optionalDates(payload),
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

  rememberImportedFieldMetadata(fields, presence, contributorResult.slots);

  return fields;
}

export function buildImportedRecordId(
  existingRecords: PublicationMasterRecord[],
  nextRecords: PublicationMasterRecord[],
  lineIndex: number
): string {
  const existingIds = new Set([...existingRecords, ...nextRecords].map((record) => record.id));
  const baseId = `researchmap-import-${lineIndex + 1}`;
  return uniquifyWithNumericSuffix(baseId, (candidateId) => existingIds.has(candidateId));
}

export function uniquifyRecordId(
  records: PublicationMasterRecord[],
  baseId: string
): string {
  const existingIds = new Set(records.map((record) => record.id));
  return uniquifyWithNumericSuffix(baseId, (candidateId) => existingIds.has(candidateId));
}

export function cloneRecord(record: PublicationMasterRecord): PublicationMasterRecord {
  return JSON.parse(JSON.stringify(record)) as PublicationMasterRecord;
}

function buildRecordId(fields: PublicationMasterFields, fallbackId: string): string {
  const year = (getPublicationDate(fields) || "undated").slice(0, 4);
  const title = getPublicationTitleText(fields);
  const venue = getPublicationVenue(fields);
  const slugBase = slugify(title || venue?.ja || venue?.en || fallbackId);
  return `pub-${year}-${slugBase || fallbackId}`;
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
  if (type === "presentations") {
    addPresence(presence, "venue.promoter", "promoter", payload);
    addLocalizedPresence(presence, "venue.promoter", "promoter", payload);
    addPresence(presence, "venue.addressCountry", "address_country", payload);
  }
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
  const name =
    type === "presentations"
      ? optionalLocalizedText(payload.event)
      : optionalLocalizedText(payload.publication_name);
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
