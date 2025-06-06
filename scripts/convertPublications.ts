/**
 * 出版物データをCSVからJSONに変換するスクリプト
 *
 * 使用方法:
 * npx ts-node scripts/convertPublications.ts
 *
 * 入力: data/publication_data.csv
 * 出力: src/data/publications.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { csvToJson, convertAndSave } from '../src/utils/csvToJson';

/**
 * メイン処理：CSVをJSONに変換してファイルに保存する
 */
function main() {
  try {
    // ファイルパスを設定 (dataディレクトリがsrc配下に移動したためパスを更新)
    const csvFilePath = path.join(__dirname, '../src/data/publication_data.csv');
    const jsonFilePath = path.join(__dirname, '../src/data/publications.json');

    // CSVファイルが存在するか確認
    if (!fs.existsSync(csvFilePath)) {
      console.error(`エラー: CSVファイル ${csvFilePath} が見つかりません`);
      process.exit(1);
    }
    
    // CSVをJSONに変換して保存
    const success = convertAndSave(csvFilePath, jsonFilePath);
    
    if (success) {
      // 変換されたJSONデータを読み込んで件数を表示
      const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
      console.log(`変換が完了しました。${jsonData.length}件のデータが ${jsonFilePath} に保存されました。`);
      process.exit(0);
    } else {
      console.error('変換に失敗しました。');
      process.exit(1);
    }
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトを実行
main();