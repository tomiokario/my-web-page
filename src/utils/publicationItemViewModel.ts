import { Language, Publication } from "../types";
import {
  getPublicationAuthorshipLabel,
  getPublicationReviewLabel,
  getPublicationTypeLabel,
} from "./publicationLabels";

interface PublicationItemLinkViewModel {
  href: string;
  label: string;
}

export interface PublicationItemViewModel {
  title: string;
  tags: string[];
  journal: string;
  dateLocation: {
    dateLabel: string;
    dateValue: string;
    locationLabel: string;
    location: string;
  };
  doi: PublicationItemLinkViewModel | null;
  webLink: PublicationItemLinkViewModel | null;
  others: string;
  abstractText: string;
}

export function buildPublicationItemViewModel(
  publication: Publication,
  language: Language
): PublicationItemViewModel {
  const normalizedDoi = normalizeDoi(publication.doi);

  return {
    title: language === "ja" && publication.japanese ? publication.japanese : publication.name,
    tags: buildPublicationTags(publication, language),
    journal: publication.journalConference || publication.journal || "",
    dateLocation: {
      dateLabel: language === "ja" ? "日付: " : "Date: ",
      dateValue: buildDateValue(publication),
      locationLabel: language === "ja" ? "場所: " : "Location: ",
      location: publication.site,
    },
    doi: normalizedDoi
      ? {
          href: `https://doi.org/${normalizedDoi}`,
          label: normalizedDoi,
        }
      : null,
    webLink: publication.webLink
      ? {
          href: publication.webLink,
          label: publication.webLink,
        }
      : null,
    others: publication.others,
    abstractText: publication.abstract?.trim() || "",
  };
}

function buildPublicationTags(publication: Publication, language: Language): string[] {
  const tags: string[] = [];

  if (publication.year) {
    tags.push(String(publication.year));
  }

  const authorshipRoles = Array.isArray(publication.authorship)
    ? publication.authorship
    : publication.authorship
      ? [publication.authorship]
      : [];

  authorshipRoles.forEach((role) => {
    tags.push(getPublicationAuthorshipLabel(role, language));
  });

  if (publication.type) {
    tags.push(getPublicationTypeLabel(publication.type, language));
  }

  if (publication.review) {
    tags.push(getPublicationReviewLabel(publication.review, language));
  }

  return tags;
}

function buildDateValue(publication: Publication): string {
  if (!publication.startDate) {
    return "";
  }

  return publication.startDate === publication.endDate
    ? publication.startDate
    : `${publication.startDate} → ${publication.endDate}`;
}

function normalizeDoi(doi: string): string {
  return doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
}
