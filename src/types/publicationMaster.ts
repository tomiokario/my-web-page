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

export interface PublicationSeeAlso {
  "@id": string;
  label: string;
}

export interface PublicationIdentifiers {
  doi?: string[];
}

export interface PublicationMasterResearchmapFields {
  type: "published_papers" | "presentations" | "misc";
  subtype?: string;
  paper_title?: LocalizedText;
  presentation_title?: LocalizedText;
  authors?: LocalizedPeople;
  presenters?: LocalizedPeople;
  publication_name?: LocalizedText;
  event?: LocalizedText;
  publication_date?: string;
  from_event_date?: string;
  to_event_date?: string;
  identifiers?: PublicationIdentifiers;
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

export interface PublicationMasterLocalMeta {
  hasEmptyFields: boolean;
  notes: string;
}

export interface PublicationMasterRecord {
  id: string;
  researchmapFields: PublicationMasterResearchmapFields;
  localMeta: PublicationMasterLocalMeta;
}
