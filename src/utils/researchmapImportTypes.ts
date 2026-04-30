import {
  LocalizedText,
  PublicationContributor,
  PublicationMasterFields,
  PublicationMasterRecord,
} from "../types/publicationMaster";

export const PUBLICATION_TYPES = new Set(["published_papers", "presentations", "misc"]);
export const HISTORY_FILE_NAME = ".researchmap-import-history.json";
export const LOCALIZED_LANGUAGES: Array<keyof LocalizedText> = ["ja", "en"];

export type PublicationType = PublicationMasterFields["type"];
export type MatchStrategy = "record_id" | "doi" | "fingerprint" | "title";
export type FieldPresence = Set<string>;
export type LocalizedLanguage = keyof LocalizedText;
export type ContributorSlot = PublicationContributor | undefined;

export interface ResearchmapJsonlRecord {
  insert?: {
    id?: string;
    type?: string;
    user_id?: string;
  };
  merge?: Record<string, unknown>;
  force?: Record<string, unknown>;
}

export interface ImportHistoryEntry {
  sha256: string;
  importedAt: string;
  sourcePath: string;
  archivedPath: string;
}

export interface ImportHistoryFile {
  version: 1;
  entries: ImportHistoryEntry[];
}

export interface SourceRecordSummary {
  type: string;
  title: string;
  date: string;
  recordId?: string;
}

export interface CandidateRecordSummary extends SourceRecordSummary {
  id: string;
  subtype?: string;
}

export interface StrictMatchResult {
  strategy: Exclude<MatchStrategy, "title">;
  candidates: PublicationMasterRecord[];
}

export interface PotentialReviewResult {
  strategy: MatchStrategy;
  candidates: PublicationMasterRecord[];
}

export interface ResearchmapImportIssue {
  lineNumber: number;
  reason: string;
  sourceRecord: SourceRecordSummary;
}

export interface ResearchmapImportReviewItem extends ResearchmapImportIssue {
  matchStrategy?: MatchStrategy;
  candidateRecords: CandidateRecordSummary[];
  conflictingFields: string[];
}

export interface ResearchmapImportReport {
  sourcePath: string;
  dryRun: boolean;
  importedAt: string;
  summary: {
    totalLines: number;
    publicationRecords: number;
    matched: number;
    added: number;
    skippedNonPublication: number;
    review: number;
    invalid: number;
  };
  reviewItems: ResearchmapImportReviewItem[];
  invalidRecords: ResearchmapImportIssue[];
  archivedTo?: string;
}

export interface ResearchmapImportOptions {
  dryRun?: boolean;
  archiveDirPath?: string;
  importedAt?: Date;
}
