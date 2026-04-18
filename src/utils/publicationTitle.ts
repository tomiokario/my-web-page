import { PublicationMasterFields, PublicationMasterRecord } from "../types/publicationMaster";

export interface DuplicatePublicationTitleGroup {
  normalizedTitle: string;
  title: string;
  recordIds: string[];
}

export function extractPublicationTitles(
  fields: PublicationMasterFields
): string[] {
  return uniqueStrings([
    fields.title?.ja,
    fields.title?.en,
  ]);
}

export function extractPrimaryPublicationTitle(
  fields: PublicationMasterFields
): string {
  return (
    fields.title?.ja ||
    fields.title?.en ||
    ""
  );
}

export function normalizePublicationTitle(value: string | undefined): string {
  return (value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[“”„‟]/g, '"')
    .replace(/[‘’‛]/g, "'")
    .replace(/[‐‑‒–—―ーｰ−]/g, "-")
    .replace(/\s*-\s*/g, "-")
    .replace(/[.,;:!?()[\]{}"'`]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findDuplicatePublicationTitleGroups(
  records: PublicationMasterRecord[]
): DuplicatePublicationTitleGroup[] {
  const groups = new Map<string, DuplicatePublicationTitleGroup>();

  records.forEach((record) => {
    const titles = extractPublicationTitles(record.fields);

    titles.forEach((title) => {
      const normalizedTitle = normalizePublicationTitle(title);
      if (!normalizedTitle) {
        return;
      }

      const current = groups.get(normalizedTitle);
      if (current) {
        current.recordIds.push(record.id);
        return;
      }

      groups.set(normalizedTitle, {
        normalizedTitle,
        title,
        recordIds: [record.id],
      });
    });
  });

  return [...groups.values()].filter((group) => uniqueStrings(group.recordIds).length > 1);
}

export function hasMatchingPublicationTitle(
  left: PublicationMasterFields,
  right: PublicationMasterFields
): boolean {
  const rightTitles = new Set(
    extractPublicationTitles(right).map((title) => normalizePublicationTitle(title)).filter(Boolean)
  );

  return extractPublicationTitles(left)
    .map((title) => normalizePublicationTitle(title))
    .filter(Boolean)
    .some((normalizedTitle) => rightTitles.has(normalizedTitle));
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim() || "").filter(Boolean))];
}
