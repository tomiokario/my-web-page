import * as fs from "fs";

import { Publication } from "../types";
import { PublicationMasterRecord } from "../types/publicationMaster";
import {
  csvToPublicationMaster,
  publicationMasterToJson,
  publicationMasterFileToWebPublications,
  publicationWebDataToJson,
} from "./publicationMasterFile";

/**
 * CSVファイルをJSONに変換する関数
 * @param {string} csvFilePath - CSVファイルのパス
 * @returns {Publication[]} - 変換されたJSONデータ
 */
export function csvToJson(csvFilePath: string): Publication[] {
  return publicationMasterFileToWebPublications(csvFilePath);
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
export function convertAndSave(
  csvFilePath: string,
  jsonFilePath: string,
  options?: { masterJsonFilePath?: string }
): boolean {
  try {
    const masterData = csvToMasterData(csvFilePath);
    const jsonData: Publication[] = csvToJson(csvFilePath);

    if (options?.masterJsonFilePath) {
      fs.writeFileSync(options.masterJsonFilePath, publicationMasterToJson(masterData), "utf8");
    }

    fs.writeFileSync(jsonFilePath, publicationWebDataToJson(jsonData), "utf8");
    console.log(`変換が完了し、${jsonFilePath}に保存されました。`);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("変換中にエラーが発生しました:", error.message);
    }
    return false;
  }
}
