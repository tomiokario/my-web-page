/**
 * publication_data.csv から publication_master.json を生成する移行用スクリプト
 *
 * 使用方法:
 * npm run import-publications-csv
 *
 * 入力: src/data/publication_data.csv
 * 出力: src/data/publication_master.json
 */

import * as fs from "fs";
import * as path from "path";

import { importMasterFromCsvAndSave } from "../src/utils/csvToJson";

function main() {
  try {
    const csvFilePath = path.join(__dirname, "../src/data/publication_data.csv");
    const masterJsonFilePath = path.join(__dirname, "../src/data/publication_master.json");

    if (!fs.existsSync(csvFilePath)) {
      console.error(`エラー: CSVファイル ${csvFilePath} が見つかりません`);
      process.exit(1);
    }

    const success = importMasterFromCsvAndSave(csvFilePath, { masterJsonFilePath });

    if (!success) {
      console.error("CSV から master data の生成に失敗しました。");
      process.exit(1);
    }

    const masterData = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    console.log(
      `生成が完了しました。${masterData.length}件の master data を ${masterJsonFilePath} に保存しました。`
    );
    process.exit(0);
  } catch (error) {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  }
}

main();
