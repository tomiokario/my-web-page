/**
 * 出版物データをCSVからJSONに変換するスクリプト
 *
 * 使用方法:
 * node scripts/convertPublications.js
 *
 * 入力: data/publication_proper_data.csv
 * 出力: src/data/publications.json
 */

const fs = require('fs');
const path = require('path');
const { csvToJson, convertAndSave } = require('../src/utils/csvToJson');

/**
 * メイン処理：CSVをJSONに変換してファイルに保存する
 */
function main() {
  try {
    // ファイルパスを設定
    const csvFilePath = path.join(__dirname, '../data/publication_data.csv');
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