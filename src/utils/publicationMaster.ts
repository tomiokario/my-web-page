import { Publication } from "../types";
import { PublicationLink, PublicationMasterFields, PublicationMasterRecord } from "../types/publicationMaster";
import {
  getLocalizedTextValue,
  getPublicationDate,
  getPublicationDoi,
  getPublicationTitle,
  getPublicationVenueText,
  normalizeDoi,
} from "./publicationMasterSchema";

export function publicationMasterToWebPublications(records: PublicationMasterRecord[]): Publication[] {
  return records.map((record, index) => mapMasterRecordToPublication(record, index));
}

function mapMasterRecordToPublication(record: PublicationMasterRecord, index: number): Publication {
  const fields = record.fields;
  const title = getPublicationTitle(fields);
  const doi = getPublicationDoi(fields);
  const primaryWebLink = selectPrimaryWebLink(fields.links, doi);
  const authorshipValues = normalizeArrayOutput(deriveAuthorshipCodes(fields));
  const presentationTypes = normalizeArrayOutput(derivePresentationTypeCodes(fields));
  const startDate = fields.dates?.eventStart || fields.dates?.published || "";
  const endDate = fields.dates?.eventEnd || fields.dates?.eventStart || fields.dates?.published || "";
  const journalConference =
    getPublicationVenueText(fields, "en") || getPublicationVenueText(fields, "ja");
  const site = getLocalizedTextValue(fields.location, "en") || getLocalizedTextValue(fields.location, "ja");

  return {
    id: index + 1,
    recordId: record.id,
    name: title?.en || title?.ja || "",
    japanese: title?.ja || "",
    abstract:
      getLocalizedTextValue(fields.description, "en") ||
      getLocalizedTextValue(fields.description, "ja"),
    type: buildResearchmapClassificationKey(fields),
    category: fields.type,
    subtype: fields.subtype,
    review: deriveReviewCode(fields.review),
    authorship: authorshipValues,
    presentationType: presentationTypes,
    doi,
    webLink: primaryWebLink?.url || "",
    date: buildWebDateText(fields),
    startDate,
    endDate,
    sortableDate: startDate,
    others: formatAdditionalSeeAlsoEntries(fields.links, primaryWebLink?.url, doi),
    site,
    journalConference,
  };
}

function selectPrimaryWebLink(
  entries: PublicationLink[] | undefined,
  doi: string
): PublicationLink | undefined {
  if (!entries?.length) {
    return undefined;
  }

  const doiUrls = buildKnownDoiUrls(doi);
  return entries.find((entry) => !doiUrls.has(entry.url)) || entries[0];
}

function formatAdditionalSeeAlsoEntries(
  entries: PublicationLink[] | undefined,
  primaryLinkId: string | undefined,
  doi: string
): string {
  if (!entries?.length) {
    return "";
  }

  const doiUrls = buildKnownDoiUrls(doi);

  return entries
    .filter((entry) => entry.url !== primaryLinkId && !doiUrls.has(entry.url))
    .map((entry) => {
      const label = entry.label.trim();
      return label && label.toLowerCase() !== "url" ? `${label}: ${entry.url}` : entry.url;
    })
    .join("\n");
}

function buildKnownDoiUrls(doi: string): Set<string> {
  const normalizedDoi = normalizeDoi(doi);
  if (!normalizedDoi) {
    return new Set<string>();
  }

  return new Set([
    `https://doi.org/${normalizedDoi}`,
    `http://doi.org/${normalizedDoi}`,
    `https://dx.doi.org/${normalizedDoi}`,
    `http://dx.doi.org/${normalizedDoi}`,
  ]);
}

function deriveReviewCode(referee: boolean | undefined): string {
  if (referee === true) {
    return "peer_reviewed";
  }

  if (referee === false) {
    return "not_peer_reviewed";
  }

  return "";
}

function deriveAuthorshipCodes(fields: PublicationMasterFields): string[] {
  const ownerRoles = fields.ownerRoles || [];
  if (ownerRoles.length > 0) {
    return ownerRoles;
  }

  const peopleCount = fields.contributors?.length || 0;

  return peopleCount > 1 ? ["coauthor"] : [];
}

function derivePresentationTypeCodes(fields: PublicationMasterFields): string[] {
  if (fields.type !== "presentations" || !fields.subtype) {
    return [];
  }

  return [fields.subtype];
}

function buildResearchmapClassificationKey(fields: PublicationMasterFields): string {
  return `${fields.type}/${resolveResearchmapSubtype(fields)}`;
}

function resolveResearchmapSubtype(fields: PublicationMasterFields): string {
  return fields.subtype || "others";
}

function buildWebDateText(fields: PublicationMasterFields): string {
  const published = getPublicationDate(fields);
  const eventStart = fields.dates?.eventStart || published;
  const eventEnd = fields.dates?.eventEnd || "";

  if (fields.type === "presentations") {
    if (!eventStart) {
      return "";
    }
    return eventEnd && eventEnd !== eventStart ? `${eventStart} → ${eventEnd}` : eventStart;
  }

  return published;
}

function normalizeArrayOutput(values: string[]): string | string[] {
  if (values.length <= 1) {
    return values[0] || "";
  }

  return values;
}
