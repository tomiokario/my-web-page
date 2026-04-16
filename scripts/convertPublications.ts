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

function main() {
  try {
    const masterJsonFilePath = path.join(__dirname, "../src/data/publication_master.json");
    const webJsonFilePath = path.join(__dirname, "../src/data/publications.json");

    if (!fs.existsSync(masterJsonFilePath)) {
      console.error(`エラー: master JSON ファイル ${masterJsonFilePath} が見つかりません`);
      process.exit(1);
    }

    const masterRecords = readPublicationMasterFile(masterJsonFilePath);
    const webRecords = publicationMasterFileToWebPublications(masterJsonFilePath);

    fs.writeFileSync(webJsonFilePath, publicationWebDataToJson(webRecords), "utf8");

    console.log(
      `変換が完了しました。${masterRecords.length}件の master data から ${webRecords.length}件の web 表示用データを ${webJsonFilePath} に保存しました。`
    );
    process.exit(0);
  } catch (error) {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  }
}

main();
