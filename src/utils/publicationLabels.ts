import { Language } from "../types";

export const PUBLICATION_TYPE_ORDER: string[] = [
  "published_papers/scientific_journal",
  "published_papers/international_conference_proceedings",
  "misc/introduction_scientific_journal",
  "misc/technical_report",
  "misc/summary_national_conference",
  "misc/others",
  "presentations/oral_presentation",
  "presentations/poster_presentation",
  "presentations/invited_oral_presentation",
  "presentations/keynote_oral_presentation",
  "presentations/public_symposium",
  "presentations/others",
  "Journal paper：原著論文",
  "Research paper (international conference)：国際会議",
  "Invited paper：招待論文",
  "Research paper (domestic conference)：国内会議",
];

export const TYPE_LABELS: Record<string, Record<Language, string>> = {
  "published_papers/scientific_journal": {
    ja: "研究論文 / 学術誌",
    en: "Published Papers / Scientific Journal",
  },
  "published_papers/international_conference_proceedings": {
    ja: "研究論文 / 国際会議プロシーディングス",
    en: "Published Papers / International Conference Proceedings",
  },
  "misc/introduction_scientific_journal": {
    ja: "Misc / 学術誌紹介",
    en: "Misc / Scientific Journal Introduction",
  },
  "misc/summary_national_conference": {
    ja: "Misc / 国内会議要旨",
    en: "Misc / National Conference Summary",
  },
  "misc/technical_report": {
    ja: "Misc / 技術報告",
    en: "Misc / Technical Report",
  },
  "misc/others": {
    ja: "Misc / その他",
    en: "Misc / Others",
  },
  "presentations/oral_presentation": {
    ja: '講演・口頭発表等 / 口頭発表',
    en: "Presentations / Oral Presentation",
  },
  "presentations/poster_presentation": {
    ja: '講演・口頭発表等 / ポスター',
    en: "Presentations / Poster Presentation",
  },
  "presentations/invited_oral_presentation": {
    ja: '講演・口頭発表等 / 招待講演',
    en: "Presentations / Invited Oral Presentation",
  },
  "presentations/keynote_oral_presentation": {
    ja: '講演・口頭発表等 / 基調講演',
    en: "Presentations / Keynote Oral Presentation",
  },
  "presentations/public_symposium": {
    ja: '講演・口頭発表等 / 公開シンポジウム',
    en: "Presentations / Public Symposium",
  },
  "presentations/others": {
    ja: '講演・口頭発表等 / その他',
    en: "Presentations / Others",
  },
};

const REVIEW_LABELS: Record<string, Record<Language, string>> = {
  peer_reviewed: {
    ja: "査読あり",
    en: "Peer Reviewed",
  },
  not_peer_reviewed: {
    ja: "査読なし",
    en: "Not Peer Reviewed",
  },
};

const AUTHORSHIP_LABELS: Record<string, Record<Language, string>> = {
  lead: {
    ja: "筆頭著者",
    en: "Lead Author",
  },
  corresponding: {
    ja: "責任著者",
    en: "Corresponding Author",
  },
  last: {
    ja: "最終著者",
    en: "Last Author",
  },
  coauthor: {
    ja: "共著",
    en: "Co-author",
  },
};

export function getPublicationTypeLabel(type: string, language: Language): string {
  return TYPE_LABELS[type]?.[language] || type;
}

export function getPublicationReviewLabel(review: string, language: Language): string {
  return REVIEW_LABELS[review]?.[language] || review;
}

export function getPublicationAuthorshipLabel(authorship: string, language: Language): string {
  return AUTHORSHIP_LABELS[authorship]?.[language] || authorship;
}
