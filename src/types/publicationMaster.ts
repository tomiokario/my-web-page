export type LocalizedLanguage = "ja" | "en";

export interface LocalizedText {
  ja?: string;
  en?: string;
}

export interface LocalizedPerson {
  name: string;
}

export interface LocalizedPeople {
  ja?: LocalizedPerson[];
  en?: LocalizedPerson[];
}

export interface PublicationContributor {
  role: "author" | "presenter";
  name: LocalizedText;
}

export interface PublicationSeeAlso {
  "@id": string;
  label: string;
  is_downloadable?: boolean;
}

export interface PublicationLink {
  url: string;
  label: string;
  isDownloadable?: boolean;
}

export interface PublicationIdentifiers {
  doi?: string;
}

export interface PublicationVenue {
  kind: "publication" | "event";
  name?: LocalizedText;
  promoter?: LocalizedText;
  addressCountry?: string;
}

export interface PublicationDates {
  published?: string;
  eventStart?: string;
  eventEnd?: string;
}

export interface PublicationBibliographic {
  volume?: string;
  number?: string;
  startPage?: string;
  endPage?: string;
}

export interface PublicationMasterFields {
  type: "published_papers" | "presentations" | "misc";
  subtype?: string;
  title?: LocalizedText;
  contributors?: PublicationContributor[];
  venue?: PublicationVenue;
  dates?: PublicationDates;
  identifiers?: PublicationIdentifiers;
  links?: PublicationLink[];
  bibliographic?: PublicationBibliographic;
  location?: LocalizedText;
  description?: LocalizedText;
  review?: boolean;
  invited?: boolean;
  ownerRoles?: string[];
  isInternational?: boolean;
}

export interface PublicationMasterLocalMeta {
  hasEmptyFields: boolean;
  notes: string;
  legacyHints?: {
    authorship?: string[];
    presentationType?: string[];
  };
}

export interface PublicationMasterSyncResearchmap {
  recordId?: string;
  userId?: string;
  lastImportedAt?: string;
  lastPayloadHash?: string;
}

export interface PublicationMasterSync {
  researchmap?: PublicationMasterSyncResearchmap;
}

export interface PublicationMasterRecord {
  id: string;
  fields: PublicationMasterFields;
  localMeta: PublicationMasterLocalMeta;
  sync?: PublicationMasterSync;
}

// Legacy researchmap-shaped fields remain as an internal adapter type while the
// canonical repo schema is stored in `PublicationMasterFields`.
export interface LegacyPublicationMasterResearchmapFields {
  type: PublicationMasterFields["type"];
  subtype?: string;
  paper_title?: LocalizedText;
  presentation_title?: LocalizedText;
  authors?: LocalizedPeople;
  presenters?: LocalizedPeople;
  publication_name?: LocalizedText;
  event?: LocalizedText;
  promoter?: LocalizedText;
  address_country?: string;
  publication_date?: string;
  from_event_date?: string;
  to_event_date?: string;
  identifiers?: {
    doi?: string[];
  };
  see_also?: PublicationSeeAlso[];
  volume?: string;
  number?: string;
  starting_page?: string;
  ending_page?: string;
  location?: LocalizedText;
  description?: LocalizedText;
  referee?: boolean;
  invited?: boolean;
  published_paper_owner_roles?: string[];
  presentation_type?: string;
  published_paper_type?: string;
  misc_type?: string;
  is_international_presentation?: boolean;
  is_international_journal?: boolean;
}
