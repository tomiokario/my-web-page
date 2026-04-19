import {
  LegacyPublicationMasterResearchmapFields,
  LocalizedLanguage,
  LocalizedPeople,
  LocalizedText,
  PublicationContributor,
  PublicationLink,
  PublicationMasterFields,
  PublicationMasterRecord,
  PublicationSeeAlso,
} from "../types/publicationMaster";

export function toLegacyResearchmapFields(
  fields: PublicationMasterFields
): LegacyPublicationMasterResearchmapFields {
  const contributorRole = fields.type === "presentations" ? "presenter" : "author";
  const localizedContributors = contributorsToLocalizedPeople(fields.contributors, contributorRole);
  const venueName = fields.venue?.name;
  const publishedDate = fields.dates?.published || fields.dates?.eventStart;

  return compactObject({
    type: fields.type,
    subtype: fields.subtype,
    paper_title: fields.type === "presentations" ? undefined : fields.title,
    presentation_title: fields.type === "presentations" ? fields.title : undefined,
    authors: fields.type === "presentations" ? undefined : localizedContributors,
    presenters: fields.type === "presentations" ? localizedContributors : undefined,
    publication_name: fields.type === "presentations" ? undefined : venueName,
    event: fields.type === "presentations" ? venueName : undefined,
    promoter: fields.type === "presentations" ? fields.venue?.promoter : undefined,
    address_country: fields.type === "presentations" ? fields.venue?.addressCountry : undefined,
    publication_date: publishedDate,
    from_event_date: fields.dates?.eventStart,
    to_event_date: fields.dates?.eventEnd,
    identifiers: fields.identifiers?.doi ? { doi: [fields.identifiers.doi] } : undefined,
    see_also: fields.links?.map(toLegacySeeAlso),
    volume: fields.bibliographic?.volume,
    number: fields.bibliographic?.number,
    starting_page: fields.bibliographic?.startPage,
    ending_page: fields.bibliographic?.endPage,
    location: fields.location,
    description: fields.description,
    referee: fields.review,
    invited: fields.invited,
    published_paper_owner_roles: fields.ownerRoles,
    presentation_type: fields.type === "presentations" ? fields.subtype : undefined,
    published_paper_type: fields.type === "published_papers" ? fields.subtype : undefined,
    misc_type: fields.type === "misc" ? fields.subtype : undefined,
    is_international_presentation:
      fields.type === "presentations" ? fields.isInternational : undefined,
    is_international_journal: fields.type === "presentations" ? undefined : fields.isInternational,
  }) as LegacyPublicationMasterResearchmapFields;
}

export function fromLegacyResearchmapFields(
  fields: LegacyPublicationMasterResearchmapFields
): PublicationMasterFields {
  const type = fields.type;
  const title =
    type === "presentations"
      ? fields.presentation_title || fields.paper_title
      : fields.paper_title || fields.presentation_title;
  const contributors = localizedPeopleToContributors(
    type === "presentations" ? fields.presenters || fields.authors : fields.authors || fields.presenters,
    type === "presentations" ? "presenter" : "author"
  );
  const venueName =
    type === "presentations"
      ? fields.event || fields.publication_name
      : fields.publication_name || fields.event;
  const published = fields.publication_date || fields.from_event_date;
  const eventStart = fields.from_event_date;
  const eventEnd = fields.to_event_date || fields.from_event_date;

  return compactObject({
    type,
    subtype: resolveLegacySubtype(fields),
    title,
    contributors,
    venue: venueName
      ? compactObject({
          kind: type === "presentations" ? "event" : "publication",
          name: venueName,
          promoter: fields.promoter,
          addressCountry: fields.address_country,
        })
      : undefined,
    dates:
      published || eventStart || eventEnd
        ? compactObject({
            published,
            eventStart,
            eventEnd,
          })
        : undefined,
    identifiers: fields.identifiers?.doi?.[0]
      ? {
          doi: fields.identifiers.doi[0],
        }
      : undefined,
    links: fields.see_also?.map(fromLegacySeeAlso),
    bibliographic:
      fields.volume || fields.number || fields.starting_page || fields.ending_page
        ? compactObject({
            volume: fields.volume,
            number: fields.number,
            startPage: fields.starting_page,
            endPage: fields.ending_page,
          })
        : undefined,
    location: fields.location,
    description: fields.description,
    review: fields.referee,
    invited: fields.invited,
    ownerRoles: fields.published_paper_owner_roles,
    isInternational:
      type === "presentations"
        ? fields.is_international_presentation
        : fields.is_international_journal,
  }) as PublicationMasterFields;
}

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
  return (
    getLocalizedTextValue(fields.title, "ja") ||
    getLocalizedTextValue(fields.title, "en") ||
    ""
  );
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
    .replace(/^https?:\/\/doi\.org\//i, "")
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

function resolveLegacySubtype(fields: LegacyPublicationMasterResearchmapFields): string | undefined {
  if (fields.type === "published_papers") {
    return fields.published_paper_type || fields.subtype;
  }
  if (fields.type === "presentations") {
    return fields.presentation_type || fields.subtype;
  }
  return fields.misc_type || fields.subtype;
}

function localizedPeopleToContributors(
  people: LocalizedPeople | undefined,
  role: PublicationContributor["role"]
): PublicationContributor[] | undefined {
  if (!people) {
    return undefined;
  }

  const count = Math.max(people.ja?.length || 0, people.en?.length || 0);
  const contributors: PublicationContributor[] = [];

  for (let index = 0; index < count; index += 1) {
    const name = compactObject({
      ja: people.ja?.[index]?.name,
      en: people.en?.[index]?.name,
    }) as LocalizedText;

    if (Object.keys(name).length === 0) {
      continue;
    }

    contributors.push({
      role,
      name,
    });
  }

  return contributors.length > 0 ? contributors : undefined;
}

function contributorsToLocalizedPeople(
  contributors: PublicationContributor[] | undefined,
  role: PublicationContributor["role"]
): LocalizedPeople | undefined {
  const scoped = getContributorsByRole(contributors, role);

  if (scoped.length === 0) {
    return undefined;
  }

  const ja = scoped
    .map((contributor) => contributor.name.ja)
    .filter((value): value is string => Boolean(value))
    .map((name) => ({ name }));
  const en = scoped
    .map((contributor) => contributor.name.en)
    .filter((value): value is string => Boolean(value))
    .map((name) => ({ name }));

  return compactObject({
    ja,
    en,
  }) as LocalizedPeople;
}

function getContributorsByRole(
  contributors: PublicationContributor[] | undefined,
  role: PublicationContributor["role"]
): PublicationContributor[] {
  return (contributors || []).filter((contributor) => contributor.role === role);
}

function toLegacySeeAlso(link: PublicationLink): PublicationSeeAlso {
  return compactObject({
    "@id": link.url,
    label: link.label,
    is_downloadable: link.isDownloadable,
  }) as PublicationSeeAlso;
}

function fromLegacySeeAlso(link: PublicationSeeAlso): PublicationLink {
  return compactObject({
    url: link["@id"],
    label: link.label,
    isDownloadable: link.is_downloadable,
  }) as PublicationLink;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}
