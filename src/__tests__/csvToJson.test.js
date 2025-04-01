/**
 * CSVからJSONへの変換機能のテスト
 *
 * このテストファイルでは、CSVファイルをJSONデータに変換する機能をテストします。
 * csvToJson関数は、出版物データを含むCSVファイルを読み込み、
 * Webサイトで表示するためのJSON形式に変換します。
 *
 * テスト内容：
 * 1. 変換関数の存在確認
 * 2. CSVファイルの存在確認
 * 3. CSVからJSONへの正確な変換
 * 4. 空行や不正な形式の行の適切な処理
 */

const fs = require('fs');
const path = require('path');
const { csvToJson } = require('../utils/csvToJson');

// テストデータのパス
const CSV_FILE_PATH = path.join(__dirname, '../../data/publication_data.csv');

describe('CSV to JSON conversion', () => {
  // 各テストの前に実行される処理
  beforeAll(() => {
    // テスト内容: CSVファイルが存在することを確認
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`テストに必要なCSVファイル ${CSV_FILE_PATH} が見つかりません`);
    }
  });

  test('csvToJson function exists', () => {
    // テスト内容: 変換関数が存在するかテスト
    expect(typeof csvToJson).toBe('function');
  });

  test('CSV file exists', () => {
    // テスト内容: CSVファイルが存在するかテスト
    expect(fs.existsSync(CSV_FILE_PATH)).toBe(true);
  });

  test('converts CSV to JSON correctly', () => {
    // テスト内容: CSVデータが正しくJSON形式に変換されることを確認
    const jsonData = csvToJson(CSV_FILE_PATH);
    
    // 変換結果が配列であることを確認
    expect(Array.isArray(jsonData)).toBe(true);
    
    // 変換結果が空でないことを確認
    expect(jsonData.length).toBeGreaterThan(0);
    
    // 最初の要素に必要なプロパティが含まれていることを確認
    const firstItem = jsonData[0];
    const requiredProps = [
      'hasEmptyFields', 'name', 'japanese', 'type', 'review',
      'authorship', 'presentationType', 'doi', 'webLink',
      'date', 'others', 'site', 'journalConference'
    ];
    
    requiredProps.forEach(prop => {
      expect(firstItem).toHaveProperty(prop);
    });
    
    // 特定のデータが正しく変換されていることを確認
    expect(firstItem.name).toContain('Rio Tomioka');
    expect(firstItem.type).toContain('Research paper');
  });

  test('handles empty or malformed lines correctly', () => {
    // テスト内容: 空行や不正な形式の行が適切に処理されることを確認
    const testCsvData = `未入力項目有り,名前,Japanese（日本語）,type,Review,Authorship,Presentation type,DOI,web link,Date,Others,site,journal / conference
No,"Test Author, ""Test Title""",テスト,Test Type,Reviewed,Lead author,Oral,,https://example.com,2023-01-01,,Test Site,Test Journal

Invalid Line with no commas
No,,,,,,,,,,,,
`;
    
    // 一時ファイルに書き込み
    const tempFilePath = path.join(__dirname, '../../data/temp_test.csv');
    fs.writeFileSync(tempFilePath, testCsvData, 'utf8');
    
    try {
      // 変換処理を実行
      const jsonData = csvToJson(tempFilePath);
      
      // 空行や不正な行がスキップされ、有効なデータのみが変換されることを確認
      expect(jsonData.length).toBe(1);
      expect(jsonData[0].name).toBe('Test Author, "Test Title"');
    } finally {
      // テスト後に一時ファイルを削除
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });
});