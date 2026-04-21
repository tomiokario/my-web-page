import { Publication } from "../types";
import {
  LegacyPublicationMasterResearchmapFields,
  LocalizedLanguage,
  LocalizedPeople,
  LocalizedText,
  PublicationMasterFields,
  PublicationMasterRecord,
  PublicationSeeAlso,
} from "../types/publicationMaster";
import { uniquifyWithNumericSuffix, slugify } from "./stringIds";
import {
  compactObject,
  fromLegacyResearchmapFields,
  toLegacyResearchmapFields,
} from "./publicationMasterSchema";

export interface ProcessedDate {
  startDate: string;
  endDate: string;
  sortableDate: string;
}

interface CsvPublicationRow {
  lineNumber: number;
  hasEmptyFields: boolean;
  name: string;
  japanese: string;
  abstract: string;
  type: string;
  review: string;
  authorship: string[];
  presentationType: string[];
  doi: string;
  webLink: string;
  date: string;
  others: string;
  site: string;
  journalConference: string;
  processedDate: ProcessedDate;
}

interface TitleAndAuthors {
  title?: string;
  authors: string[];
}

interface PublicationClassification {
  type: PublicationMasterFields["type"];
  subtype?: string;
  isInternational?: boolean;
}

const TITLE_FALLBACK = "Untitled publication";

const AUTHORSHIP_LABEL_TO_OWNER_ROLE: Record<string, string> = {
  "Lead author": "lead",
  "First author": "lead",
  "筆頭著者": "lead",
  "Corresponding author": "corresponding",
  "責任著者": "corresponding",
  "Last author": "last",
  "Senior author": "last",
};

const PRESENTATION_TYPE_LABEL_TO_CODE: Record<string, string> = {
  Oral: "oral_presentation",
  Poster: "poster_presentation",
  Invited: "invited_oral_presentation",
  Keynote: "keynote_oral_presentation",
};

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (index + 1 < line.length && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

export function processDate(dateString: string | undefined | null): ProcessedDate {
  if (!dateString) {
    return { startDate: "", endDate: "", sortableDate: "" };
  }

  const dateRangeMatch = dateString.match(
    /(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*→\s*(\d{4})年(\d{1,2})月(\d{1,2})日)?/
  );

  if (dateRangeMatch) {
    const startDate = `${dateRangeMatch[1]}-${dateRangeMatch[2].padStart(2, "0")}-${dateRangeMatch[3].padStart(2, "0")}`;
    const endDate = dateRangeMatch[4]
      ? `${dateRangeMatch[4]}-${dateRangeMatch[5].padStart(2, "0")}-${dateRangeMatch[6].padStart(2, "0")}`
      : startDate;

    return {
      startDate,
      endDate,
      sortableDate: startDate,
    };
  }

  const yearMonthMatch = dateString.match(/(\d{4})年(\d{1,2})月/);
  if (yearMonthMatch) {
    const date = `${yearMonthMatch[1]}-${yearMonthMatch[2].padStart(2, "0")}-01`;
    return {
      startDate: date,
      endDate: date,
      sortableDate: date,
    };
  }

  return {
    startDate: dateString,
    endDate: dateString,
    sortableDate: dateString,
  };
}

export function parseCsvContent(csvData: string): CsvPublicationRow[] {
  const normalizedCsvData = csvData.replace(/^\uFEFF/, "");
  const lines = normalizedCsvData.split(/\r?\n/);
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((header) => header.trim());
  const abstractHeaderIndex = headers.findIndex((header) =>
    ["abstract", "Abstract", "要旨", "概要"].includes(header)
  );

  const rows: CsvPublicationRow[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex].trim();

    if (!line) {
      continue;
    }

    try {
      const values = parseCSVLine(line);
      const rawValueCount = values.length;

      while (values.length < headers.length) {
        values.push("");
      }

      if (rawValueCount < headers.length - 1 || !values[1] || values[1].trim() === "") {
        continue;
      }

      rows.push({
        lineNumber: lineIndex + 1,
        hasEmptyFields: (values[0] || "").trim() === "Yes",
        name: (values[1] || "").trim(),
        japanese: (values[2] || "").trim(),
        abstract: abstractHeaderIndex >= 0 ? (values[abstractHeaderIndex] || "").trim() : "",
        type: (values[3] || "").trim(),
        review: (values[4] || "").trim(),
        authorship: normalizeCommaSeparatedValues(values[5]),
        presentationType: normalizeCommaSeparatedValues(values[6]),
        doi: (values[7] || "").trim(),
        webLink: (values[8] || "").trim(),
        date: (values[9] || "").trim(),
        others: (values[10] || "").trim(),
        site: (values[11] || "").trim(),
        journalConference: (values[12] || "").trim(),
        processedDate: processDate((values[9] || "").trim()),
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.warn(
          `警告: 行 ${lineIndex + 1} の解析中にエラーが発生しました。この行はスキップされます。`,
          error.message
        );
      }
    }
  }

  return rows;
}

export function csvRowsToPublicationMaster(rows: CsvPublicationRow[]): PublicationMasterRecord[] {
  const seenIds = new Set<string>();

  return rows.map((row) => {
    const classification = classifyPublication(row);
    const englishDetails = extractTitleAndAuthors(row.name, "en");
    const japaneseDetails = extractTitleAndAuthors(row.japanese, "ja");
    const localizedTitle = buildLocalizedTitle(japaneseDetails.title, englishDetails.title);
    const localizedAuthors = buildLocalizedAuthors(englishDetails.authors, japaneseDetails.authors);
    const identifier = buildIdentifiers(row.doi);
    const supplementalLinks = extractSupplementarySeeAlso(row.others);
    const links = mergeSeeAlsoEntries(
      buildSeeAlso(row.webLink),
      supplementalLinks.seeAlso
    );
    const description = buildDescription(row.abstract);
    const location = buildLocalizedValue(row.site);
    const venue = buildLocalizedValue(row.journalConference);
    const bibliographicInfo = extractBibliographicInfo(row);
    const ownerRoles = mapOwnerRoles(row.authorship);
    const normalizedPresentationType = mapPresentationType(row.presentationType);
    const invited = resolveInvited(row.presentationType, row.type);

    const researchmapFields = compactObject({
      type: classification.type,
      subtype: classification.subtype,
      paper_title: classification.type === "presentations" ? undefined : localizedTitle,
      presentation_title: classification.type === "presentations" ? localizedTitle : undefined,
      authors: classification.type === "presentations" ? undefined : localizedAuthors,
      presenters: classification.type === "presentations" ? localizedAuthors : undefined,
      publication_name: classification.type === "presentations" ? undefined : venue,
      event: classification.type === "presentations" ? venue : undefined,
      publication_date: row.processedDate.startDate || normalizePublicationDate(row.date),
      from_event_date: row.processedDate.startDate || undefined,
      to_event_date: row.processedDate.endDate || undefined,
      identifiers: identifier,
      see_also: links,
      location,
      description,
      referee: mapReview(row.review),
      invited,
      published_paper_owner_roles: ownerRoles,
      presentation_type: normalizedPresentationType,
      published_paper_type: classification.type === "published_papers" ? classification.subtype : undefined,
      misc_type: classification.type === "misc" ? classification.subtype : undefined,
      is_international_presentation:
        classification.type === "presentations" ? classification.isInternational : undefined,
      is_international_journal:
        classification.type !== "presentations" ? classification.isInternational : undefined,
      ...bibliographicInfo,
    }) as LegacyPublicationMasterResearchmapFields;

    const baseId = buildPublicationId({
      year: row.processedDate.startDate || normalizePublicationDate(row.date),
      title:
        localizedTitle?.en ||
        localizedTitle?.ja ||
        row.name ||
        row.japanese ||
        TITLE_FALLBACK,
      lineNumber: row.lineNumber,
    });
    const id = uniquifyId(baseId, seenIds);

    return {
      id,
      fields: fromLegacyResearchmapFields(researchmapFields),
      localMeta: {
        hasEmptyFields: row.hasEmptyFields,
        notes: supplementalLinks.remainingNotes || "",
        legacyHints: normalizedPresentationType
          ? {
              presentationType: [normalizedPresentationType],
            }
          : undefined,
      },
    };
  });
}

export function publicationMasterToWebPublications(records: PublicationMasterRecord[]): Publication[] {
  return records.map((record, index) => {
      const legacyFields = toLegacyResearchmapFields(record.fields);
      const title = getPublicationTitle(legacyFields);
      const doi = legacyFields.identifiers?.doi?.[0] || "";
      const primaryWebLink = selectPrimaryWebLink(legacyFields.see_also, doi);
      const authorshipValues = normalizeArrayOutput(deriveAuthorshipCodes(legacyFields));
      const derivedPresentationTypes = normalizeArrayOutput(
        derivePresentationTypeCodes(legacyFields)
      );
      const presentationTypes = derivedPresentationTypes.length
        ? derivedPresentationTypes
        : normalizeArrayOutput(record.localMeta.legacyHints?.presentationType || []);
      const startDate =
        legacyFields.from_event_date ||
        legacyFields.publication_date ||
        "";
      const endDate =
        legacyFields.to_event_date ||
        legacyFields.from_event_date ||
        legacyFields.publication_date ||
        "";
      const journalConference = getPublicationVenueText(legacyFields);
      const site = getLocalizedTextValue(legacyFields.location, "en") ||
        getLocalizedTextValue(legacyFields.location, "ja");

      return {
        id: index + 1,
        recordId: record.id,
        name: title?.en || title?.ja || TITLE_FALLBACK,
        japanese: title?.ja || "",
        abstract:
          getLocalizedTextValue(legacyFields.description, "en") ||
          getLocalizedTextValue(legacyFields.description, "ja"),
        type: buildResearchmapClassificationKey(legacyFields),
        category: legacyFields.type,
        subtype: resolveResearchmapSubtype(legacyFields),
        review: deriveReviewCode(legacyFields.referee),
        authorship: authorshipValues,
        presentationType: presentationTypes,
        doi,
        webLink: primaryWebLink?.["@id"] || "",
        date: buildWebDateText(legacyFields),
        startDate,
        endDate,
        sortableDate: startDate,
        others: formatAdditionalSeeAlsoEntries(
          legacyFields.see_also,
          primaryWebLink?.["@id"],
          doi
        ),
        site,
        journalConference,
      };
    });
}

export function getPublicationTitle(
  fields: LegacyPublicationMasterResearchmapFields
): LocalizedText | undefined {
  if (fields.type === "presentations") {
    return fields.presentation_title || fields.paper_title;
  }
  return fields.paper_title || fields.presentation_title;
}

export function getPublicationVenueText(fields: LegacyPublicationMasterResearchmapFields): string {
  if (fields.type === "presentations") {
    return (
      getLocalizedTextValue(fields.event, "en") ||
      getLocalizedTextValue(fields.event, "ja") ||
      getLocalizedTextValue(fields.publication_name, "en") ||
      getLocalizedTextValue(fields.publication_name, "ja") ||
      ""
    );
  }

  return (
    getLocalizedTextValue(fields.publication_name, "en") ||
    getLocalizedTextValue(fields.publication_name, "ja") ||
    getLocalizedTextValue(fields.event, "en") ||
    getLocalizedTextValue(fields.event, "ja") ||
    ""
  );
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

export function stringifyPeople(
  people: LocalizedPeople | undefined,
  language: LocalizedLanguage
): string {
  if (!people) {
    return "";
  }

  const target = people[language] || people[language === "ja" ? "en" : "ja"] || [];
  return target.map((person) => person.name).join("\n");
}

function normalizeCommaSeparatedValues(value: string | undefined): string[] {
  const trimmedValue = (value || "").trim();
  if (!trimmedValue) {
    return [];
  }
  if (trimmedValue.includes(",")) {
    return trimmedValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [trimmedValue];
}

function classifyPublication(row: CsvPublicationRow): PublicationClassification {
  const sourceType = row.type.toLowerCase();
  const journalConference = row.journalConference.toLowerCase();
  const name = row.name.toLowerCase();

  if (journalConference.includes("optical review")) {
    return {
      type: "published_papers",
      subtype: "scientific_journal",
      isInternational: true,
    };
  }

  if (sourceType.includes("journal paper")) {
    return {
      type: "published_papers",
      subtype: "scientific_journal",
      isInternational: inferInternationalFlag(row),
    };
  }

  if (sourceType.includes("invited paper")) {
    return {
      type: "misc",
      subtype: "introduction_scientific_journal",
      isInternational: inferInternationalFlag(row),
    };
  }

  if (sourceType.includes("international conference")) {
    return {
      type: "published_papers",
      subtype: "international_conference_proceedings",
      isInternational: true,
    };
  }

  if (sourceType.includes("domestic conference")) {
    return {
      type: "misc",
      subtype: "summary_national_conference",
      isInternational: false,
    };
  }

  if (
    journalConference.includes("光ニューロワークショップ") ||
    journalConference.includes("materials meet robots") ||
    journalConference.includes("photonics for computing") ||
    journalConference.includes("応用物理学会秋季学術講演会")
  ) {
    return {
      type: "presentations",
      subtype: mapPresentationType(row.presentationType) || "oral_presentation",
      isInternational: inferInternationalFlag(row),
    };
  }

  if (name.includes("technical digest") || name.includes("program and abstracts")) {
    return {
      type: "published_papers",
      subtype: "international_conference_proceedings",
      isInternational: true,
    };
  }

  return {
    type: "misc",
    subtype: "others",
    isInternational: inferInternationalFlag(row),
  };
}

function buildLocalizedTitle(jaTitle?: string, enTitle?: string): LocalizedText | undefined {
  const localized: LocalizedText = {};

  if (jaTitle) {
    localized.ja = cleanTitle(jaTitle);
  }

  if (enTitle) {
    if (containsJapanese(enTitle) && !localized.ja) {
      localized.ja = cleanTitle(enTitle);
    } else if (!containsJapanese(enTitle)) {
      localized.en = cleanTitle(enTitle);
    }
  }

  if (localized.ja && !localized.en) {
    localized.en = localized.ja;
  }

  return Object.keys(localized).length > 0 ? localized : undefined;
}

function buildLocalizedAuthors(enAuthors: string[], jaAuthors: string[]): LocalizedPeople | undefined {
  const localized: LocalizedPeople = {};
  const japanese = jaAuthors.length > 0 ? jaAuthors : enAuthors.filter((name) => containsJapanese(name));
  const english = enAuthors.filter((name) => !containsJapanese(name));

  if (japanese.length > 0) {
    localized.ja = japanese.map((name) => ({ name }));
  }

  if (english.length > 0) {
    localized.en = english.map((name) => ({ name }));
  }

  return Object.keys(localized).length > 0 ? localized : undefined;
}

function extractTitleAndAuthors(value: string, language: LocalizedLanguage): TitleAndAuthors {
  const trimmed = normalizeQuotes(value.trim());

  if (!trimmed) {
    return { title: undefined, authors: [] };
  }

  const match = extractQuotedTitle(trimmed, language);
  if (!match) {
    return {
      title: inferPlainTitle(trimmed),
      authors: [],
    };
  }

  const authorSegment = match ? trimmed.slice(0, match.index).trim() : "";

  return {
    title: match?.title,
    authors: parseAuthors(authorSegment, language),
  };
}

function extractQuotedTitle(value: string, language: LocalizedLanguage) {
  const patterns =
    language === "ja"
      ? [/「([^」]+)」/, /"([^"]+)"/]
      : [/"([^"]+)"/, /“([^”]+)”/, /「([^」]+)」/];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match && match.index !== undefined) {
      return {
        title: match[1],
        index: match.index,
      };
    }
  }

  return undefined;
}

function inferPlainTitle(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/[,"，]/u.test(trimmed)) {
    return undefined;
  }

  if (/\b(vol|pp|no)\b/i.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

function parseAuthors(authorSegment: string, language: LocalizedLanguage): string[] {
  const cleaned = authorSegment
    .replace(/[，,]\s*$/, "")
    .replace(/et al\./gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return [];
  }

  const normalized =
    language === "en"
      ? cleaned.replace(/\s+and\s+/gi, ",").replace(/，/g, ",").replace(/、/g, ",")
      : cleaned.replace(/、/g, ",").replace(/・/g, ",").replace(/，/g, ",");

  return unique(
    normalized
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
  );
}

function buildIdentifiers(doi: string): LegacyPublicationMasterResearchmapFields["identifiers"] | undefined {
  const normalized = normalizeDoi(doi);
  if (!normalized) {
    return undefined;
  }

  return { doi: [normalized] };
}

function buildSeeAlso(webLink: string): PublicationSeeAlso[] | undefined {
  const trimmed = webLink.trim();
  if (!trimmed) {
    return undefined;
  }

  return [{ "@id": trimmed, label: "url" }];
}

function extractSupplementarySeeAlso(value: string): {
  seeAlso?: PublicationSeeAlso[];
  remainingNotes?: string;
} {
  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }

  const labeledUrlMatch = trimmed.match(/^(.*?):\s*(https?:\/\/\S+)$/i);
  if (labeledUrlMatch?.[2]) {
    const label = labeledUrlMatch[1]?.trim() || "supplementary link";
    return {
      seeAlso: [{
        "@id": sanitizeUrl(labeledUrlMatch[2]),
        label,
      }],
    };
  }

  const urlOnlyMatch = trimmed.match(/^(https?:\/\/\S+)$/i);
  if (urlOnlyMatch?.[1]) {
    return {
      seeAlso: [{
        "@id": sanitizeUrl(urlOnlyMatch[1]),
        label: "supplementary link",
      }],
    };
  }

  return { remainingNotes: trimmed };
}

function mergeSeeAlsoEntries(
  ...collections: Array<PublicationSeeAlso[] | undefined>
): PublicationSeeAlso[] | undefined {
  const merged: PublicationSeeAlso[] = [];
  const seenIds = new Set<string>();

  collections.forEach((entries) => {
    entries?.forEach((entry) => {
      if (!entry["@id"] || seenIds.has(entry["@id"])) {
        return;
      }

      seenIds.add(entry["@id"]);
      merged.push(entry);
    });
  });

  return merged.length > 0 ? merged : undefined;
}

function selectPrimaryWebLink(
  entries: PublicationSeeAlso[] | undefined,
  doi: string
): PublicationSeeAlso | undefined {
  if (!entries?.length) {
    return undefined;
  }

  const doiUrls = buildKnownDoiUrls(doi);
  return entries.find((entry) => !doiUrls.has(entry["@id"])) || entries[0];
}

function formatAdditionalSeeAlsoEntries(
  entries: PublicationSeeAlso[] | undefined,
  primaryLinkId: string | undefined,
  doi: string
): string {
  if (!entries?.length) {
    return "";
  }

  const doiUrls = buildKnownDoiUrls(doi);

  return entries
    .filter((entry) => entry["@id"] !== primaryLinkId && !doiUrls.has(entry["@id"]))
    .map((entry) => {
      const label = entry.label.trim();
      return label && label.toLowerCase() !== "url"
        ? `${label}: ${entry["@id"]}`
        : entry["@id"];
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

function sanitizeUrl(value: string): string {
  return value.trim().replace(/[.,;)]*$/u, "");
}

function buildDescription(value: string): LocalizedText | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return containsJapanese(trimmed) ? { ja: trimmed } : { en: trimmed };
}

function buildLocalizedValue(value: string): LocalizedText | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return containsJapanese(trimmed) ? { ja: trimmed } : { en: trimmed };
}

function mapReview(review: string): boolean | undefined {
  const normalized = review.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (normalized.includes("not") || normalized.includes("non")) {
    return false;
  }

  if (normalized.includes("peer") || normalized.includes("reviewed")) {
    return true;
  }

  return undefined;
}

function resolveInvited(presentationType: string[], sourceType: string): boolean | undefined {
  if (presentationType.some((value) => value.toLowerCase().includes("invited"))) {
    return true;
  }

  if (sourceType.toLowerCase().includes("invited paper")) {
    return true;
  }

  return undefined;
}

function mapOwnerRoles(authorship: string[]): string[] | undefined {
  const mapped = authorship.flatMap((role) => {
    const ownerRole = AUTHORSHIP_LABEL_TO_OWNER_ROLE[role];
    return ownerRole ? [ownerRole] : [];
  });

  return mapped.length > 0 ? unique(mapped) : undefined;
}

function mapPresentationType(presentationType: string[]): string | undefined {
  const normalized = presentationType
    .map((value) => PRESENTATION_TYPE_LABEL_TO_CODE[value] || value.toLowerCase())
    .find(Boolean);

  return normalized || undefined;
}

function inferInternationalFlag(row: CsvPublicationRow): boolean {
  return [row.type, row.site, row.journalConference, row.name].some((field) =>
    /international|online|taiwan|hawaii|honolulu|usa/i.test(field)
  );
}

function normalizePublicationDate(date: string): string | undefined {
  const trimmed = date.trim();

  if (!trimmed) {
    return undefined;
  }

  const fullDate = trimmed.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (fullDate) {
    return `${fullDate[1]}-${fullDate[2].padStart(2, "0")}-${fullDate[3].padStart(2, "0")}`;
  }

  const yearMonth = trimmed.match(/(\d{4})年(\d{1,2})月/);
  if (yearMonth) {
    return `${yearMonth[1]}-${yearMonth[2].padStart(2, "0")}`;
  }

  const yearOnly = trimmed.match(/(\d{4})年/);
  if (yearOnly) {
    return yearOnly[1];
  }

  return trimmed;
}

function extractBibliographicInfo(row: CsvPublicationRow) {
  const candidates = [row.name, row.japanese, row.others].filter(Boolean);
  const compactCitation = firstMatchedGroups(candidates, [
    /\b(\d+)\s*,\s*([A-Za-z]?\d+)\s*[-–—]\s*([A-Za-z]?\d+)\s*\(\d{4}\)/,
  ]);
  const conferencePaperCode = extractConferencePaperCode(candidates);
  const volume =
    firstMatchedValue(candidates, [
      /\bvol\.?\s*([A-Za-z0-9.-]+)/i,
      /\b(\d+)\s*\(\s*[A-Za-z0-9.-]{1,10}\s*\)\s*,/,
    ]) || compactCitation?.[0];
  const number =
    firstMatchedValue(candidates, [
      /\b(?:no|number)\b\.?\s*([A-Za-z0-9.-]+)/i,
      /\b\d+\s*\(\s*([A-Za-z0-9.-]{1,10})\s*\)\s*,\s*(?:pp?\.?\s*)?[A-Za-z]?\d+/i,
    ]) || conferencePaperCode;
  const pageRange = firstMatchedGroups(candidates, [
    /\bpp?\.\s*([A-Za-z]?\d+)\s*[-–—]\s*([A-Za-z]?\d+)/i,
    /\bpp?\s+([A-Za-z]?\d+)\s*[-–—]\s*([A-Za-z]?\d+)/i,
    /\bpages?\s+([A-Za-z]?\d+)\s*[-–—]\s*([A-Za-z]?\d+)/i,
    /\b\d+\s*,\s*([A-Za-z]?\d+)\s*[-–—]\s*([A-Za-z]?\d+)\s*\(\d{4}\)/,
  ]);
  const singlePage = pageRange
    ? undefined
    : firstMatchedValue(candidates, [/\bp\.\s*([A-Za-z]?\d+)\b/i, /\bp\s+([A-Za-z]?\d+)\b/i]);

  return compactObject({
    volume: sanitizeBibliographicToken(volume),
    number: sanitizeBibliographicToken(number),
    starting_page: sanitizeBibliographicToken(pageRange?.[0] || singlePage),
    ending_page: sanitizeBibliographicToken(pageRange?.[1] || singlePage),
  });
}

function extractConferencePaperCode(candidates: string[]): string | undefined {
  return firstMatchedValue(candidates, [
    /\b([A-Z]{1,4}\d{2,4}-\d{1,3})\b/,
    /\b([A-Z]{1,4}\d{2,4}-[A-Z]\d{1,3})\b/,
  ]);
}

function firstMatchedValue(candidates: string[], patterns: RegExp[]): string | undefined {
  for (const candidate of candidates) {
    for (const pattern of patterns) {
      const match = candidate.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }
  }
  return undefined;
}

function firstMatchedGroups(candidates: string[], patterns: RegExp[]): string[] | undefined {
  for (const candidate of candidates) {
    for (const pattern of patterns) {
      const match = candidate.match(pattern);
      if (match && match.length > 2) {
        return match.slice(1);
      }
    }
  }
  return undefined;
}

function sanitizeBibliographicToken(value: string | undefined): string | undefined {
  return value?.trim().replace(/[.,)]*$/u, "") || undefined;
}

function normalizeDoi(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
}

function normalizeQuotes(value: string): string {
  return value
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/‟/g, '"');
}

function cleanTitle(value: string): string {
  return value.trim().replace(/[,\uFF0C\u3001]+$/u, "").trim();
}

function containsJapanese(value: string): boolean {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/u.test(value);
}

function buildPublicationId({
  year,
  title,
  lineNumber,
}: {
  year?: string;
  title: string;
  lineNumber: number;
}): string {
  const yearPart = year?.slice(0, 4) || "unknown";
  const slug = slugify(title).slice(0, 48) || `row-${lineNumber}`;
  return `pub-${yearPart}-${slug}`;
}

function uniquifyId(baseId: string, seenIds: Set<string>): string {
  const candidate = uniquifyWithNumericSuffix(baseId, (currentValue) => seenIds.has(currentValue));
  seenIds.add(candidate);
  return candidate;
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

function deriveAuthorshipCodes(fields: LegacyPublicationMasterResearchmapFields): string[] {
  const ownerRoles = fields.published_paper_owner_roles || [];
  if (ownerRoles.length > 0) {
    return ownerRoles;
  }

  const peopleCount =
    fields.authors?.en?.length ||
    fields.authors?.ja?.length ||
    fields.presenters?.en?.length ||
    fields.presenters?.ja?.length ||
    0;

  return peopleCount > 1 ? ["coauthor"] : [];
}

function derivePresentationTypeCodes(fields: LegacyPublicationMasterResearchmapFields): string[] {
  if (!fields.presentation_type) {
    return [];
  }

  return [fields.presentation_type];
}

function resolveResearchmapSubtype(fields: LegacyPublicationMasterResearchmapFields): string {
  if (fields.type === "published_papers") {
    return fields.published_paper_type || fields.subtype || "others";
  }
  if (fields.type === "presentations") {
    return fields.presentation_type || fields.subtype || "others";
  }
  return fields.misc_type || fields.subtype || "others";
}

function buildResearchmapClassificationKey(fields: LegacyPublicationMasterResearchmapFields): string {
  return `${fields.type}/${resolveResearchmapSubtype(fields)}`;
}

function buildWebDateText(fields: LegacyPublicationMasterResearchmapFields): string {
  const start = fields.from_event_date || fields.publication_date || "";
  const end = fields.to_event_date || "";

  if (!start) {
    return "";
  }

  return end && end !== start ? `${start} → ${end}` : start;
}

function normalizeArrayOutput(values: string[]): string | string[] {
  if (values.length <= 1) {
    return values[0] || "";
  }
  return values;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
