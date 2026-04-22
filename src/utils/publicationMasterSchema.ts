import {
  LocalizedLanguage,
  LocalizedText,
  PublicationContributor,
  PublicationLink,
  PublicationMasterFields,
  PublicationMasterRecord,
} from "../types/publicationMaster";

export function getPublicationTitle(fields: PublicationMasterFields): LocalizedText | undefined {
  return fields.title;
}

export function getPublicationTitleValue(
  fields: PublicationMasterFields,
  language: LocalizedLanguage
): string {
  return getLocalizedTextValue(fields.title, language);
}

export function getPublicationVenue(fields: PublicationMasterFields): LocalizedText | undefined {
  return fields.venue?.name;
}

export function getPublicationVenueText(
  fields: PublicationMasterFields,
  language: LocalizedLanguage
): string {
  return getLocalizedTextValue(fields.venue?.name, language);
}

export function getPublicationDate(fields: PublicationMasterFields): string {
  return fields.dates?.published || fields.dates?.eventStart || "";
}

export function getPublicationEventStart(fields: PublicationMasterFields): string {
  return fields.dates?.eventStart || getPublicationDate(fields);
}

export function getPublicationEventEnd(fields: PublicationMasterFields): string {
  return fields.dates?.eventEnd || getPublicationEventStart(fields);
}

export function getPublicationLinks(fields: PublicationMasterFields): PublicationLink[] {
  return fields.links || [];
}

export function getPublicationDoi(fields: PublicationMasterFields): string {
  return fields.identifiers?.doi || "";
}

export function getPublicationContributorNames(
  fields: PublicationMasterFields,
  role: PublicationContributor["role"],
  language: LocalizedLanguage
): string[] {
  return (fields.contributors || [])
    .filter((contributor) => contributor.role === role)
    .map((contributor) => getLocalizedTextValue(contributor.name, language))
    .filter(Boolean);
}

export function getPublicationTitleText(fields: PublicationMasterFields): string {
  return getLocalizedTextValue(fields.title, "ja") || getLocalizedTextValue(fields.title, "en") || "";
}

export function buildCanonicalFingerprint(fields: PublicationMasterFields): string {
  const date = normalizeText(getPublicationDate(fields));
  const subtype = normalizeText(fields.subtype || "");
  const titleJa = normalizeText(fields.title?.ja || "");
  const titleEn = normalizeText(fields.title?.en || "");
  const venueJa = normalizeText(fields.venue?.name?.ja || "");
  const venueEn = normalizeText(fields.venue?.name?.en || "");
  const promoterJa = normalizeText(fields.venue?.promoter?.ja || "");
  const promoterEn = normalizeText(fields.venue?.promoter?.en || "");
  const addressCountry = normalizeText(fields.venue?.addressCountry || "");

  return [
    fields.type,
    subtype,
    titleJa,
    titleEn,
    venueJa,
    venueEn,
    promoterJa,
    promoterEn,
    addressCountry,
    date,
  ].join("|");
}

export function describePublicationRecord(record: PublicationMasterRecord): {
  id: string;
  type: PublicationMasterFields["type"];
  subtype?: string;
  title: string;
  date: string;
  recordId?: string;
} {
  return {
    id: record.id,
    type: record.fields.type,
    subtype: record.fields.subtype,
    title: getPublicationTitleText(record.fields),
    date: getPublicationDate(record.fields),
    recordId: record.sync?.researchmap?.recordId,
  };
}

export function getLocalizedTextValue(
  value: LocalizedText | undefined,
  language: LocalizedLanguage
): string {
  if (!value) {
    return "";
  }

  return value[language] || value[language === "ja" ? "en" : "ja"] || "";
}

export function stringifyContributors(
  contributors: PublicationContributor[] | undefined,
  role: PublicationContributor["role"],
  language: LocalizedLanguage
): string {
  return getContributorsByRole(contributors, role)
    .map((contributor) => getLocalizedTextValue(contributor.name, language))
    .filter(Boolean)
    .join("\n");
}

export function normalizeDoi(value: string | undefined | null): string {
  return (value || "")
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .toLowerCase();
}

export function compactObject<T extends Record<string, unknown>>(value: T): Partial<T> {
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

function getContributorsByRole(
  contributors: PublicationContributor[] | undefined,
  role: PublicationContributor["role"]
): PublicationContributor[] {
  return (contributors || []).filter((contributor) => contributor.role === role);
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[‐‑‒–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
