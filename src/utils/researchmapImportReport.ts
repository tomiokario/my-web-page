import { PublicationMasterRecord } from "../types/publicationMaster";
import {
  describePublicationRecord,
  getPublicationDate,
  getPublicationTitleText,
} from "./publicationMasterSchema";
import { findDuplicatePublicationTitleGroups } from "./publicationTitle";
import {
  MatchStrategy,
  ResearchmapImportIssue,
  ResearchmapImportReviewItem,
  SourceRecordSummary,
} from "./researchmapImportTypes";

export function appendDuplicateTitleIssues(
  invalidRecords: ResearchmapImportIssue[],
  records: PublicationMasterRecord[]
): void {
  findDuplicatePublicationTitleGroups(records).forEach((group) => {
    invalidRecords.push({
      lineNumber: 0,
      reason: `タイトル重複があります: "${group.title}" (${group.recordIds.join(", ")})`,
      sourceRecord: {
        type: "duplicate_title",
        title: group.title,
        date: "",
      },
    });
  });
}

export function buildReviewItem(
  lineNumber: number,
  importedRecord: PublicationMasterRecord,
  reason: string,
  matchStrategy: MatchStrategy,
  candidateRecords: PublicationMasterRecord[],
  conflictingFields: string[]
): ResearchmapImportReviewItem {
  return {
    lineNumber,
    reason,
    sourceRecord: summarizeSourceRecord(importedRecord),
    matchStrategy,
    candidateRecords: candidateRecords.map((record) => ({
      ...describePublicationRecord(record),
    })),
    conflictingFields,
  };
}

export function buildImportErrorIssue(
  lineNumber: number,
  error: unknown
): ResearchmapImportIssue {
  return {
    lineNumber,
    reason: error instanceof Error ? error.message : "不明なエラー",
    sourceRecord: {
      type: "invalid_jsonl",
      title: "",
      date: "",
    },
  };
}

function summarizeSourceRecord(record: PublicationMasterRecord): SourceRecordSummary {
  return {
    type: record.fields.type,
    title: getPublicationTitleText(record.fields),
    date: getPublicationDate(record.fields),
    recordId: record.sync?.researchmap?.recordId,
  };
}
