import * as fs from "fs";
import * as path from "path";

import {
  PublicationArtifactPaths,
  readPublicationMasterFile,
  writePublicationArtifacts,
} from "./publicationMasterFile";
import {
  archiveImportedFile,
  hashContent,
  hashJsonlLine,
  splitJsonlContent,
  writeImportHistory,
  readImportHistory,
} from "./researchmapImportFile";
import {
  buildImportedRecordId,
  buildMasterRecordFromResearchmapRecord,
  cloneRecord,
  parseJsonlLine,
  uniquifyRecordId,
} from "./researchmapImportMapper";
import {
  collectAmbiguousConflictingFields,
  collectConflictingFields,
  findPotentialReviewMatch,
  findStrictMatch,
  hasCanonicalTitle,
  markUsedTargetIds,
} from "./researchmapImportMatching";
import { mergeMatchedRecord } from "./researchmapImportMerge";
import {
  appendDuplicateTitleIssues,
  buildImportErrorIssue,
  buildReviewItem,
} from "./researchmapImportReport";
import {
  HISTORY_FILE_NAME,
  PUBLICATION_TYPES,
  ResearchmapImportIssue,
  ResearchmapImportOptions,
  ResearchmapImportReport,
  ResearchmapImportReviewItem,
} from "./researchmapImportTypes";

export type {
  ResearchmapImportIssue,
  ResearchmapImportOptions,
  ResearchmapImportReport,
  ResearchmapImportReviewItem,
} from "./researchmapImportTypes";

export function importPublicationMasterFromResearchmap(
  inputFilePath: string,
  artifactPaths: PublicationArtifactPaths,
  options: ResearchmapImportOptions = {}
): ResearchmapImportReport {
  const dryRun = options.dryRun ?? false;
  const importedAt = (options.importedAt || new Date()).toISOString();
  const archiveDirPath =
    options.archiveDirPath || path.join(path.dirname(inputFilePath), "archive");
  const historyFilePath = path.join(archiveDirPath, HISTORY_FILE_NAME);
  const inputContent = fs.readFileSync(inputFilePath, "utf8");
  const fileHash = hashContent(inputContent);
  const history = readImportHistory(historyFilePath);

  if (history.entries.some((entry) => entry.sha256 === fileHash)) {
    throw new Error(`この JSONL は既に取り込み済みです: ${inputFilePath}`);
  }

  const existingRecords = readPublicationMasterFile(artifactPaths.masterJsonFilePath);
  const nextRecords = existingRecords.map((record) => cloneRecord(record));
  const usedTargetIds = new Set<string>();
  const reviewItems: ResearchmapImportReviewItem[] = [];
  const invalidRecords: ResearchmapImportIssue[] = [];
  let publicationRecords = 0;
  let matched = 0;
  let added = 0;
  let skippedNonPublication = 0;

  const lines = splitJsonlContent(inputContent);

  lines.forEach((entry, lineIndex) => {
    const { line, lineNumber } = entry;

    try {
      const record = parseJsonlLine(line, lineNumber);
      const type = record.insert?.type || "";

      if (!PUBLICATION_TYPES.has(type)) {
        skippedNonPublication += 1;
        return;
      }

      publicationRecords += 1;

      const importedRecord = buildMasterRecordFromResearchmapRecord(
        record,
        buildImportedRecordId(existingRecords, nextRecords, lineIndex),
        importedAt,
        hashJsonlLine(line)
      );

      if (!hasCanonicalTitle(importedRecord.fields)) {
        reviewItems.push(
          buildReviewItem(
            lineNumber,
            importedRecord,
            "title が不足しているため自動追加できません",
            "title",
            [],
            ["fields.title"]
          )
        );
        return;
      }

      const strictMatch = findStrictMatch(nextRecords, importedRecord);

      if (strictMatch.candidates.length > 1) {
        markUsedTargetIds(usedTargetIds, strictMatch.candidates);
        reviewItems.push(
          buildReviewItem(
            lineNumber,
            importedRecord,
            `strict match (${strictMatch.strategy}) が一意に定まりません`,
            strictMatch.strategy,
            strictMatch.candidates,
            collectAmbiguousConflictingFields(strictMatch.candidates, importedRecord)
          )
        );
        return;
      }

      if (strictMatch.candidates.length === 1) {
        const candidate = strictMatch.candidates[0];
        const conflictingFields = collectConflictingFields(candidate, importedRecord);

        if (usedTargetIds.has(candidate.id)) {
          reviewItems.push(
            buildReviewItem(
              lineNumber,
              importedRecord,
              "同一 import 内で同じ対象 record に複数行が対応しています",
              strictMatch.strategy,
              [candidate],
              conflictingFields.length > 0 ? conflictingFields : ["id"]
            )
          );
          return;
        }

        if (conflictingFields.length > 0) {
          markUsedTargetIds(usedTargetIds, [candidate]);
          reviewItems.push(
            buildReviewItem(
              lineNumber,
              importedRecord,
              "strict match は見つかりましたが保護対象 field に差分があります",
              strictMatch.strategy,
              [candidate],
              conflictingFields
            )
          );
          return;
        }

        usedTargetIds.add(candidate.id);
        const targetIndex = nextRecords.findIndex((recordItem) => recordItem.id === candidate.id);
        nextRecords[targetIndex] = mergeMatchedRecord(candidate, importedRecord);
        matched += 1;
        return;
      }

      const potentialReview = findPotentialReviewMatch(nextRecords, importedRecord);
      if (potentialReview.candidates.length > 0) {
        markUsedTargetIds(usedTargetIds, potentialReview.candidates);
        const conflictingFields =
          potentialReview.candidates.length === 1
            ? collectConflictingFields(potentialReview.candidates[0], importedRecord)
            : collectAmbiguousConflictingFields(potentialReview.candidates, importedRecord);

        reviewItems.push(
          buildReviewItem(
            lineNumber,
            importedRecord,
            "strict match に該当しない近接候補があるため review が必要です",
            potentialReview.strategy,
            potentialReview.candidates,
            conflictingFields
          )
        );
        return;
      }

      const nextRecord = {
        ...importedRecord,
        id: uniquifyRecordId(nextRecords, importedRecord.id),
      };
      nextRecords.push(nextRecord);
      usedTargetIds.add(nextRecord.id);
      added += 1;
    } catch (error: unknown) {
      invalidRecords.push(buildImportErrorIssue(lineNumber, error));
    }
  });

  appendDuplicateTitleIssues(invalidRecords, nextRecords);

  const report: ResearchmapImportReport = {
    sourcePath: inputFilePath,
    dryRun,
    importedAt,
    summary: {
      totalLines: lines.length,
      publicationRecords,
      matched,
      added,
      skippedNonPublication,
      review: reviewItems.length,
      invalid: invalidRecords.length,
    },
    reviewItems,
    invalidRecords,
  };

  if (dryRun || reviewItems.length > 0 || invalidRecords.length > 0) {
    return report;
  }

  writePublicationArtifacts(nextRecords, artifactPaths);
  const archivedTo = archiveImportedFile(inputFilePath, archiveDirPath, fileHash, importedAt);
  writeImportHistory(historyFilePath, {
    version: 1,
    entries: [
      ...history.entries,
      {
        sha256: fileHash,
        importedAt,
        sourcePath: inputFilePath,
        archivedPath: archivedTo,
      },
    ],
  });

  return {
    ...report,
    archivedTo,
  };
}
