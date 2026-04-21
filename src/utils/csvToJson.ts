import * as fs from "fs";

import { PublicationMasterRecord } from "../types/publicationMaster";
import {
  csvToPublicationMaster,
  parsePublicationMasterJson,
  publicationMasterToJson,
  writePublicationArtifacts,
} from "./publicationMasterFile";

/**
 * CSVファイルを canonical な publication master に変換する関数
 * @param {string} csvFilePath - CSVファイルのパス
 * @returns {PublicationMasterRecord[]} - 変換された master データ
 */
export function csvToMasterData(csvFilePath: string): PublicationMasterRecord[] {
  return csvToPublicationMaster(csvFilePath);
}

/**
 * CSV を canonical master に変換してファイルに保存する移行用関数
 * @param {string} csvFilePath - CSVファイルのパス
 * @param {string} jsonFilePath - 出力する master JSON のパス
 * @returns {boolean} - 変換が成功したかどうか
 */
export function importMasterFromCsvAndSave(
  csvFilePath: string,
  paths: { masterJsonFilePath: string; webJsonFilePath?: string }
): boolean {
  try {
    const masterData = csvToMasterData(csvFilePath);
    const validatedMasterData = parsePublicationMasterJson(
      publicationMasterToJson(masterData),
      "CSV generated master data"
    );

    if (paths.webJsonFilePath) {
      writePublicationArtifacts(validatedMasterData, {
        masterJsonFilePath: paths.masterJsonFilePath,
        webJsonFilePath: paths.webJsonFilePath,
      });
    } else {
      fs.writeFileSync(paths.masterJsonFilePath, publicationMasterToJson(validatedMasterData), "utf8");
    }

    console.log(`CSV から master data を生成し、${paths.masterJsonFilePath} に保存しました。`);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("変換中にエラーが発生しました:", error.message);
    }
    return false;
  }
}
