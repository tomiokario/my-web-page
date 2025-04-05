/**
 * CSVからJSONへの変換機能のテスト
 *
 * このテストファイルでは、出版物データのCSVファイルをJSON形式に変換する機能をテストします。
 * csvToJsonユーティリティは、カンマ区切りのCSVデータを解析し、Webアプリケーションで
 * 使用可能な構造化されたJSONオブジェクトの配列に変換します。
 * このテストでは、変換の正確性、エラー処理、特殊ケース（引用符内のカンマ、空行など）の
 * 適切な処理を検証します。
 *
 * テスト内容：
 * 1. csvToJson関数が存在し、正しく動作することの確認
 * 2. 実際のCSVファイルが存在し、アクセス可能であることの確認
 * 3. CSVデータが正確にJSON形式に変換され、必要なプロパティを含むことの確認
 * 4. 空行や不正な形式の行が適切に処理され、有効なデータのみが変換されることの確認
 * 5. 日本語などの多言語データが正しく処理されることの確認
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
    
    // テスト用ディレクトリの準備
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
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
    
    // 日付から年が正しく抽出できることを確認（Publications.jsxで使用される機能）
    const dateRegex = /(\d{4})/;
    const match = firstItem.date.match(dateRegex);
    expect(match).not.toBeNull();
    expect(parseInt(match[1], 10)).toBeGreaterThan(2000); // 2000年以降の日付であることを確認
  });

  test('handles empty or malformed lines correctly', () => {
    // テスト内容: 空行や不正な形式の行が適切に処理されることを確認
    
    // テスト用のCSVデータを準備
    const testCsvData = `未入力項目有り,名前,Japanese（日本語）,type,Review,Authorship,Presentation type,DOI,web link,Date,Others,site,journal / conference
No,"Test Author, ""Test Title""",テスト,Test Type,Reviewed,Lead author,Oral,,https://example.com,2023-01-01,,Test Site,Test Journal

Invalid Line with no commas
No,,,,,,,,,,,,
`;
    
    // 一時ファイルのパスを設定（テスト専用ディレクトリを使用）
    const tempDir = path.join(__dirname, '../../temp');
    // テスト用ディレクトリが存在しない場合は作成
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, 'temp_test.csv');
    
    // テスト前に一時ファイルが存在する場合は削除
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    // 一時ファイルに書き込み
    fs.writeFileSync(tempFilePath, testCsvData, 'utf8');
    
    try {
      // 変換処理を実行
      const jsonData = csvToJson(tempFilePath);
      
      // 空行や不正な行がスキップされ、有効なデータのみが変換されることを確認
      expect(jsonData.length).toBe(1);
      expect(jsonData[0].name).toBe('Test Author, "Test Title"');
      
      // 日本語の内容が正しく変換されていることを確認
      expect(jsonData[0].japanese).toBe('テスト');
      
      // 空の値が適切に処理されていることを確認
      expect(jsonData[0].doi).toBe('');
    } finally {
      // テスト後に一時ファイルを削除
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });
  
  test('handles comma-separated authorship correctly', () => {
    // テスト内容: カンマで区切られた著者の役割が配列として処理されることを確認
    
    // テスト用のCSVデータを準備（カンマで区切られた著者の役割を含む）
    const testCsvData = `未入力項目有り,名前,Japanese（日本語）,type,Review,Authorship,Presentation type,DOI,web link,Date,Others,site,journal / conference
No,"Test Author, ""Multiple Roles""",テスト,Test Type,Reviewed,"Corresponding author, Lead author",Oral,,https://example.com,2023-01-01,,Test Site,Test Journal
No,"Test Author, ""Single Role""",テスト,Test Type,Reviewed,Lead author,Oral,,https://example.com,2023-01-01,,Test Site,Test Journal
`;
    
    // 一時ファイルのパスを設定
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, 'temp_authorship.csv');
    
    // テスト前に一時ファイルが存在する場合は削除
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    // 一時ファイルに書き込み
    fs.writeFileSync(tempFilePath, testCsvData, 'utf8');
    
    try {
      // 変換処理を実行
      const jsonData = csvToJson(tempFilePath);
      
      // 2つのデータが正しく変換されていることを確認
      expect(jsonData.length).toBe(2);
      
      // カンマで区切られた著者の役割が配列として処理されていることを確認
      expect(Array.isArray(jsonData[0].authorship)).toBe(true);
      expect(jsonData[0].authorship).toEqual(['Corresponding author', 'Lead author']);
      
      // 単一の著者の役割は文字列として処理されていることを確認
      expect(Array.isArray(jsonData[1].authorship)).toBe(false);
      expect(jsonData[1].authorship).toBe('Lead author');
    } finally {
      // テスト後に一時ファイルを削除
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });

  test('handles comma-separated presentation types correctly', () => {
    // テスト内容: カンマで区切られた発表タイプが配列として処理されることを確認
    
    // テスト用のCSVデータを準備（カンマで区切られた発表タイプを含む）
    const testCsvData = `未入力項目有り,名前,Japanese（日本語）,type,Review,Authorship,Presentation type,DOI,web link,Date,Others,site,journal / conference
No,"Test Author, ""Multiple Types""",テスト,Test Type,Reviewed,Lead author,"Oral, Poster",,https://example.com,2023-01-01,,Test Site,Test Journal
No,"Test Author, ""Single Type""",テスト,Test Type,Reviewed,Lead author,Oral,,https://example.com,2023-01-01,,Test Site,Test Journal
`;
    
    // 一時ファイルのパスを設定
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, 'temp_presentation_types.csv');
    
    // テスト前に一時ファイルが存在する場合は削除
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    // 一時ファイルに書き込み
    fs.writeFileSync(tempFilePath, testCsvData, 'utf8');
    
    try {
      // 変換処理を実行
      const jsonData = csvToJson(tempFilePath);
      
      // 2つのデータが正しく変換されていることを確認
      expect(jsonData.length).toBe(2);
      
      // カンマで区切られた発表タイプが配列として処理されていることを確認
      expect(Array.isArray(jsonData[0].presentationType)).toBe(true);
      expect(jsonData[0].presentationType).toEqual(['Oral', 'Poster']);
      
      // 単一の発表タイプは文字列として処理されていることを確認
      expect(Array.isArray(jsonData[1].presentationType)).toBe(false);
      expect(jsonData[1].presentationType).toBe('Oral');
    } finally {
      // テスト後に一時ファイルを削除
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });
});