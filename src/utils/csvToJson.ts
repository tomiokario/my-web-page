import * as fs from "fs";

import { Publication } from "../types";
import { PublicationMasterRecord } from "../types/publicationMaster";
import {
  csvToPublicationMaster,
  parsePublicationMasterJson,
  publicationMasterToJson,
  writePublicationArtifacts,
} from "./publicationMasterFile";
import { publicationMasterToWebPublications } from "./publicationMaster";

/**
 * CSVファイルをJSONに変換する関数
 * @param {string} csvFilePath - CSVファイルのパス
 * @returns {Publication[]} - 変換されたJSONデータ
 */
export function csvToJson(csvFilePath: string): Publication[] {
  return publicationMasterToWebPublications(csvToMasterData(csvFilePath));
}

export function csvToMasterData(csvFilePath: string): PublicationMasterRecord[] {
  return csvToPublicationMaster(csvFilePath);
}

/**
 * CSVをJSONに変換してファイルに保存する関数
 * @param {string} csvFilePath - CSVファイルのパス
 * @param {string} jsonFilePath - 出力するJSONファイルのパス
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
