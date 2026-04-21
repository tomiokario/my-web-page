import { Publication } from "../types";
import { PUBLICATION_TYPE_ORDER } from "./publicationLabels";

export type PublicationSortOrder = "type" | "chronological";

export type PublicationFilterCategory =
  | "year"
  | "authorship"
  | "type"
  | "review"
  | "presentationType";

export type PublicationFilterSelections = Record<PublicationFilterCategory, string[]>;
export type PublicationFilterOptions = Record<PublicationFilterCategory, string[]>;
export type PublicationFilterLabels = Record<PublicationFilterCategory, string>;

export interface PublicationGroup {
  name: string;
  items: Publication[];
}

const FILTER_CATEGORIES: PublicationFilterCategory[] = [
  "year",
  "authorship",
  "type",
  "review",
  "presentationType",
];

export const PUBLICATION_FILTER_CATEGORIES = FILTER_CATEGORIES;

const EMPTY_FILTERS: PublicationFilterSelections = {
  year: [],
  authorship: [],
  type: [],
  review: [],
  presentationType: [],
};

const EMPTY_FILTER_OPTIONS: PublicationFilterOptions = {
  year: [],
  authorship: [],
  type: [],
  review: [],
  presentationType: [],
};

export function createEmptyPublicationFilters(): PublicationFilterSelections {
  return cloneFilterState(EMPTY_FILTERS);
}

export function createEmptyPublicationFilterOptions(): PublicationFilterOptions {
  return cloneFilterOptions(EMPTY_FILTER_OPTIONS);
}

export function extractPublicationYear(dateString: string | undefined | null): number | null {
  if (!dateString) {
    return null;
  }

  const match = dateString.match(/(\d{4})/);
  return match ? Number.parseInt(match[1], 10) : null;
}

export function normalizePublicationRecord(
  rawPublication: Record<string, unknown>,
  index: number
): Publication {
  const date = readString(rawPublication, ["date"]);
  const year = extractPublicationYear(date);

  return {
    id: readNumericId(rawPublication, index),
    recordId: readOptionalString(rawPublication, ["recordId"]),
    name: readString(rawPublication, ["name"]),
    japanese: readString(rawPublication, ["japanese"]),
    abstract: readOptionalString(rawPublication, ["abstract"]),
    year: year || undefined,
    journalConference:
      readString(rawPublication, ["journalConference"]) ||
      readString(rawPublication, ["journal / conference"]),
    journal: readOptionalString(rawPublication, ["journal"]),
    date,
    webLink: readString(rawPublication, ["webLink"]) || readString(rawPublication, ["web link"]),
    doi: readString(rawPublication, ["doi"]) || readString(rawPublication, ["DOI"]),
    type: readString(rawPublication, ["type"]),
    category: readOptionalString(rawPublication, ["category"]),
    subtype: readOptionalString(rawPublication, ["subtype"]),
    review:
      readString(rawPublication, ["review"]) || readString(rawPublication, ["Review"]),
    authorship:
      normalizeStringOrArray(readField(rawPublication, ["authorship", "Authorship"])) ||
      "",
    presentationType:
      normalizeStringOrArray(
        readField(rawPublication, ["presentationType", "Presentation type"])
      ) || "",
    others: readString(rawPublication, ["others"]) || readString(rawPublication, ["Others"]),
    site: readString(rawPublication, ["site"]),
    startDate: readOptionalString(rawPublication, ["startDate"]),
    endDate: readOptionalString(rawPublication, ["endDate"]),
    sortableDate: readOptionalString(rawPublication, ["sortableDate"]),
  };
}

export function collectPublicationFilterOptions(
  publications: Publication[]
): PublicationFilterOptions {
  const options = createEmptyPublicationFilterOptions();

  publications.forEach((publication) => {
    if (publication.year) {
      addUniqueValue(options.year, publication.year.toString());
    }

    addPublicationValue(options.authorship, publication.authorship);
    addPublicationValue(options.type, publication.type);
    addPublicationValue(options.review, publication.review);
    addPublicationValue(options.presentationType, publication.presentationType);
  });

  options.year.sort((a, b) => Number.parseInt(b, 10) - Number.parseInt(a, 10));
  options.authorship.sort();
  options.type.sort();
  options.review.sort();
  options.presentationType.sort();

  return options;
}

export function filterPublications(
  publications: Publication[],
  selectedFilters: PublicationFilterSelections
): Publication[] {
  return publications.filter((publication) => {
    if (
      selectedFilters.year.length > 0 &&
      (!publication.year || !selectedFilters.year.includes(publication.year.toString()))
    ) {
      return false;
    }

    if (
      selectedFilters.authorship.length > 0 &&
      !matchesSelectedValues(publication.authorship, selectedFilters.authorship)
    ) {
      return false;
    }

    if (selectedFilters.type.length > 0 && !selectedFilters.type.includes(publication.type)) {
      return false;
    }

    if (selectedFilters.review.length > 0 && !selectedFilters.review.includes(publication.review)) {
      return false;
    }

    if (
      selectedFilters.presentationType.length > 0 &&
      !matchesSelectedValues(publication.presentationType, selectedFilters.presentationType)
    ) {
      return false;
    }

    return true;
  });
}

export function sortPublications(
  publications: Publication[],
  sortOrder: PublicationSortOrder
): Publication[] {
  if (sortOrder === "chronological") {
    return [...publications].sort(compareByChronologicalOrder);
  }

  return [...publications].sort(compareByTypeOrder);
}

export function groupPublications(
  publications: Publication[],
  sortOrder: PublicationSortOrder
): PublicationGroup[] {
  const grouped = new Map<string, Publication[]>();

  publications.forEach((publication) => {
    const groupKey =
      sortOrder === "chronological"
        ? publication.year?.toString() || "Unknown"
        : publication.type || "Unknown";
    const existingItems = grouped.get(groupKey) || [];
    grouped.set(groupKey, [...existingItems, publication]);
  });

  if (sortOrder === "chronological") {
    return [...grouped.entries()]
      .sort(([leftKey], [rightKey]) => compareGroupKeysByYear(leftKey, rightKey))
      .map(([name, items]) => ({ name, items }));
  }

  const orderedGroups = PUBLICATION_TYPE_ORDER.filter((type) => grouped.has(type)).map((type) => ({
    name: type,
    items: grouped.get(type) || [],
  }));

  [...grouped.keys()]
    .filter((key) => !PUBLICATION_TYPE_ORDER.includes(key) && key !== "Unknown")
    .sort()
    .forEach((name) => {
      orderedGroups.push({
        name,
        items: grouped.get(name) || [],
      });
    });

  if (grouped.has("Unknown")) {
    orderedGroups.push({
      name: "Unknown",
      items: grouped.get("Unknown") || [],
    });
  }

  return orderedGroups;
}

function compareByChronologicalOrder(left: Publication, right: Publication): number {
  if (left.sortableDate && right.sortableDate) {
    if (left.sortableDate === right.sortableDate) {
      return 0;
    }
    return left.sortableDate > right.sortableDate ? -1 : 1;
  }

  const leftYear = left.year || 0;
  const rightYear = right.year || 0;
  return rightYear - leftYear;
}

function compareByTypeOrder(left: Publication, right: Publication): number {
  const typeIndexLeft = PUBLICATION_TYPE_ORDER.indexOf(left.type);
  const typeIndexRight = PUBLICATION_TYPE_ORDER.indexOf(right.type);

  if (typeIndexLeft !== typeIndexRight) {
    if (typeIndexLeft === -1) return 1;
    if (typeIndexRight === -1) return -1;
    return typeIndexLeft - typeIndexRight;
  }

  return compareByChronologicalOrder(left, right);
}

function compareGroupKeysByYear(leftKey: string, rightKey: string): number {
  if (leftKey === "Unknown") return 1;
  if (rightKey === "Unknown") return -1;
  return Number.parseInt(rightKey, 10) - Number.parseInt(leftKey, 10);
}

function matchesSelectedValues(
  publicationValue: string | string[],
  selectedValues: string[]
): boolean {
  if (Array.isArray(publicationValue)) {
    return publicationValue.some((value) => selectedValues.includes(value));
  }

  return selectedValues.includes(publicationValue);
}

function addPublicationValue(target: string[], value: string | string[]): void {
  if (Array.isArray(value)) {
    value.forEach((entry) => addUniqueValue(target, entry));
    return;
  }

  addUniqueValue(target, value);
}

function addUniqueValue(target: string[], value: string): void {
  if (!value || target.includes(value)) {
    return;
  }

  target.push(value);
}

function normalizeStringOrArray(value: unknown): string | string[] | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const entries = value.filter((entry): entry is string => typeof entry === "string" && entry);
    return entries.length > 0 ? entries : undefined;
  }

  return undefined;
}

function readField(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      return source[key];
    }
  }

  return undefined;
}

function readString(source: Record<string, unknown>, keys: string[]): string {
  return readOptionalString(source, keys) || "";
}

function readOptionalString(source: Record<string, unknown>, keys: string[]): string | undefined {
  const value = readField(source, keys);
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function readNumericId(source: Record<string, unknown>, fallbackIndex: number): number {
  const value = readField(source, ["id"]);

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallbackIndex;
}

function cloneFilterState(filters: PublicationFilterSelections): PublicationFilterSelections {
  return FILTER_CATEGORIES.reduce<PublicationFilterSelections>((accumulator, category) => {
    accumulator[category] = [...filters[category]];
    return accumulator;
  }, {
    year: [],
    authorship: [],
    type: [],
    review: [],
    presentationType: [],
  });
}

function cloneFilterOptions(options: PublicationFilterOptions): PublicationFilterOptions {
  return FILTER_CATEGORIES.reduce<PublicationFilterOptions>((accumulator, category) => {
    accumulator[category] = [...options[category]];
    return accumulator;
  }, {
    year: [],
    authorship: [],
    type: [],
    review: [],
    presentationType: [],
  });
}
