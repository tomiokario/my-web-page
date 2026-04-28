/**
 * publication_master.json から web 表示用の publications.json を再生成するスクリプト
 *
 * 使用方法:
 * npm run convert-publications
 *
 * 入力: src/data/publication_master.json
 * 出力: src/data/publications.json
 */

import * as fs from "fs";
import * as path from "path";

import {
  publicationMasterFileToWebPublications,
  readPublicationMasterFile,
  publicationWebDataToJson,
} from "../src/utils/publicationMasterFile";

export interface ConvertPublicationsPaths {
  masterJsonFilePath: string;
  webJsonFilePath: string;
}

export function getDefaultConvertPublicationsPaths(): ConvertPublicationsPaths {
  return {
    masterJsonFilePath: path.join(__dirname, "../src/data/publication_master.json"),
    webJsonFilePath: path.join(__dirname, "../src/data/publications.json"),
  };
}

export function convertPublications(
  paths: ConvertPublicationsPaths = getDefaultConvertPublicationsPaths()
): {
  masterRecordCount: number;
  webRecordCount: number;
  webJsonFilePath: string;
} {
  const { masterJsonFilePath, webJsonFilePath } = paths;

  if (!fs.existsSync(masterJsonFilePath)) {
    throw new Error(`master JSON ファイル ${masterJsonFilePath} が見つかりません`);
  }

  const masterRecords = readPublicationMasterFile(masterJsonFilePath);
  const webRecords = publicationMasterFileToWebPublications(masterJsonFilePath);

  fs.writeFileSync(webJsonFilePath, publicationWebDataToJson(webRecords), "utf8");

  return {
    masterRecordCount: masterRecords.length,
    webRecordCount: webRecords.length,
    webJsonFilePath,
  };
}

function main() {
  try {
    const result = convertPublications();

    console.log(
      `変換が完了しました。${result.masterRecordCount}件の master data から ${result.webRecordCount}件の web 表示用データを ${result.webJsonFilePath} に保存しました。`
    );
    process.exit(0);
  } catch (error) {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
