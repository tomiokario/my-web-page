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
