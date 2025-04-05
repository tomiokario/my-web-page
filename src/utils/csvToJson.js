/**
 * CSVファイルをJSONに変換するユーティリティ
 */

const fs = require('fs');
const path = require('path');

/**
 * CSVファイルをJSONに変換する関数
 * @param {string} csvFilePath - CSVファイルのパス
 * @returns {Array} - 変換されたJSONデータ
 */
function csvToJson(csvFilePath) {
  // CSVファイルを読み込む
  const csvData = fs.readFileSync(csvFilePath, 'utf8')
    // BOMを削除（CSVファイルの先頭に存在する可能性がある）
    .replace(/^\uFEFF/, '');
  
  // CSVデータを行に分割
  const lines = csvData.split('\n');
  
  // ヘッダー行を取得し、余分な空白を削除
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(header => header.trim());
  
  // 結果を格納する配列
  const result = [];
  
  // 各行を処理（ヘッダー行をスキップ）
  for (let i = 1; i < lines.length; i++) {
    // 空行をスキップ
    if (!lines[i].trim()) continue;
    
    try {
      // 行をCSVとして正しく解析（引用符内のカンマを考慮）
      const values = parseCSVLine(lines[i]);
      
      // 値の数がヘッダーの数より少ない場合や、必要な列（名前など）がない場合はスキップ
      if (values.length < headers.length || !values[1] || values[1].trim() === '') continue;
      
      // 各値をヘッダーと対応させてオブジェクトを作成
      const obj = {};
      
      // カンマで区切られた値を配列に変換する関数
      const processCommaSeparatedValue = (value) => {
        const trimmedValue = (value || '').trim();
        if (trimmedValue.includes(',')) {
          return trimmedValue.split(',').map(item => item.trim());
        }
        return trimmedValue;
      };
      
      // 各列の値をマッピング（値が存在する場合のみtrim()を適用）
      obj.hasEmptyFields = (values[0] || '').trim() === 'Yes';
      obj.name = (values[1] || '').trim();
      obj.japanese = (values[2] || '').trim();
      obj.type = (values[3] || '').trim();
      obj.review = (values[4] || '').trim();
      
      // カンマで区切られる可能性のあるフィールドは配列に変換
      obj.authorship = processCommaSeparatedValue(values[5]);
      obj.presentationType = processCommaSeparatedValue(values[6]);
      obj.doi = (values[7] || '').trim();
      obj.webLink = (values[8] || '').trim();
      obj.date = (values[9] || '').trim();
      obj.others = (values[10] || '').trim();
      obj.site = (values[11] || '').trim();
      obj.journalConference = (values[12] || '').trim();
      
      // 結果配列に追加
      result.push(obj);
    } catch (error) {
      // 行の解析中にエラーが発生した場合はその行をスキップ
      console.warn(`警告: 行 ${i + 1} の解析中にエラーが発生しました。この行はスキップされます。`, error);
    }
  }
  
  return result;
}

/**
 * CSV行を正しく解析する関数（引用符内のカンマを考慮）
 * @param {string} line - CSV行
 * @returns {Array} - 解析された値の配列
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // 連続する引用符の場合はエスケープされた引用符として扱う
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // 次の引用符をスキップ
      } else {
        // 引用符の開始または終了
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 引用符の外側のカンマは区切り文字
      result.push(current);
      current = '';
    } else {
      // それ以外の文字は現在の値に追加
      current += char;
    }
  }
  
  // 最後の値を追加
  result.push(current);
  
  return result;
}

/**
 * CSVをJSONに変換してファイルに保存する関数
 * @param {string} csvFilePath - CSVファイルのパス
 * @param {string} jsonFilePath - 出力するJSONファイルのパス
 * @returns {boolean} - 変換が成功したかどうか
 */
function convertAndSave(csvFilePath, jsonFilePath) {
  try {
    const jsonData = csvToJson(csvFilePath);
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`変換が完了し、${jsonFilePath}に保存されました。`);
    return true;
  } catch (error) {
    console.error('変換中にエラーが発生しました:', error);
    return false;
  }
}

// モジュールとしてエクスポート
module.exports = {
  csvToJson,
  convertAndSave
};