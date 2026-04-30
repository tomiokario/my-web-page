import {
  LocalizedText,
  PublicationContributor,
  PublicationMasterFields,
  PublicationMasterRecord,
} from "../types/publicationMaster";
import { compactObject } from "./publicationMasterSchema";
import {
  getImportedContributorSlots,
  getImportedFieldPresence,
} from "./researchmapImportFieldPresence";
import {
  ContributorSlot,
  FieldPresence,
  LOCALIZED_LANGUAGES,
  PublicationType,
} from "./researchmapImportTypes";

export function mergeMatchedRecord(
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
  const presence = getImportedFieldPresence(importedFields);
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
      getImportedContributorSlots(importedFields) || importedFields.contributors,
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
      startPage: fieldValue(
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
