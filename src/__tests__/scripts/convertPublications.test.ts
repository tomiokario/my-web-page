import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// テスト用の一時ディレクトリパス
const TEMP_DIR = path.join(__dirname, 'temp_convert_test');
// テスト用の入力CSVファイルパス
const INPUT_CSV_PATH = path.join(TEMP_DIR, 'input.csv');
// スクリプトによって生成されるJSONファイルの期待されるパス
const EXPECTED_OUTPUT_JSON_PATH = path.join(__dirname, '../../../src/data/publications.json'); // パス修正

// テスト用のCSVデータ (13列に合わせる)
const sampleCsvData = `未入力項目有り,名前（著者名と論文タイトル）,Japanese（日本語）,type,Review,Authorship,Presentation type,DOI,web link,Date,Others,site,journal / conference
No,"Test Paper 1","テスト論文1","Journal paper：原著論文","Peer-reviewed","First author","Oral","10.1234/test.1","https://example.com/1","2023年1月1日","Other info 1","Site 1","Journal A"
No,"Test Paper 2","テスト論文2","Research paper (international conference)：国際会議","Non-peer-reviewed","Co-author","Poster","10.1234/test.2","https://example.com/2","2022年12月15日","Other info 2","Site 2","Conference B"`;

// 期待されるJSONデータ (csvToJson.tsの変換ロジックとsampleCsvDataを正確に反映)
const expectedJsonData = [
  {
    id: 1,
    hasEmptyFields: false,
    name: 'Test Paper 1',
    japanese: 'テスト論文1',
    type: 'Journal paper：原著論文',
    review: 'Peer-reviewed',
    authorship: 'First author', // 文字列として処理される
    presentationType: 'Oral', // 文字列として処理される
    doi: '10.1234/test.1',
    webLink: 'https://example.com/1',
    date: '2023年1月1日',
    startDate: '2023-01-01',
    endDate: '2023-01-01',
    sortableDate: '2023-01-01',
    others: 'Other info 1',
    site: 'Site 1',
    journalConference: 'Journal A',
  },
  {
    id: 2,
    hasEmptyFields: false,
    name: 'Test Paper 2',
    japanese: 'テスト論文2',
    type: 'Research paper (international conference)：国際会議',
    review: 'Non-peer-reviewed',
    authorship: 'Co-author', // 文字列として処理される
    presentationType: 'Poster', // 文字列として処理される
    doi: '10.1234/test.2',
    webLink: 'https://example.com/2',
    date: '2022年12月15日',
    startDate: '2022-12-15',
    endDate: '2022-12-15',
    sortableDate: '2022-12-15',
    others: 'Other info 2',
    site: 'Site 2',
    journalConference: 'Conference B',
  },
];

describe('convertPublications Script', () => {
  // 正常系テスト用の準備
  const setupValidTest = () => {
      if (!fs.existsSync(TEMP_DIR)) {
          fs.mkdirSync(TEMP_DIR);
      }
      fs.writeFileSync(INPUT_CSV_PATH, sampleCsvData);
      // 既存の出力ファイルを削除しておく (もしあれば)
      if (fs.existsSync(EXPECTED_OUTPUT_JSON_PATH)) {
          fs.unlinkSync(EXPECTED_OUTPUT_JSON_PATH);
      }
  };

  // 各テストの後に一時ディレクトリと関連ファイルを削除
  afterEach(() => {
      const originalDataPath = path.join(__dirname, '../../data/publication_data.csv');
      const tempDataPath = path.join(__dirname, '../../data/publication_data.csv.temp');

      if (fs.existsSync(TEMP_DIR)) {
          fs.rmSync(TEMP_DIR, { recursive: true, force: true });
      }
      // 生成された出力ファイルも削除
      if (fs.existsSync(EXPECTED_OUTPUT_JSON_PATH)) {
          fs.unlinkSync(EXPECTED_OUTPUT_JSON_PATH);
      }
      // テスト用CSVを削除 (コピーした場合)
      if (fs.existsSync(originalDataPath) && fs.readFileSync(originalDataPath, 'utf-8') === sampleCsvData) {
           fs.unlinkSync(originalDataPath);
      }
       // 元ファイルをリストア (存在する場合)
       if (fs.existsSync(tempDataPath)) {
           fs.renameSync(tempDataPath, originalDataPath);
       }
  });

  test('should convert CSV to JSON correctly', () => {
    setupValidTest(); // 正常系テストの準備を実行
    // スクリプトを実行 (ts-nodeのパスやオプションはpackage.jsonに合わせる)
    // 注意: スクリプトが入力パスを引数で受け取るか、固定パスを参照するかで実行コマンドが変わる
    // ここではスクリプトが固定パス data/publication_data.csv を参照すると仮定し、
    // テスト用のCSVをそのパスに一時的に配置するアプローチも考えられるが、
    // まずはスクリプトが引数を受け取れるか確認する。
    // もし固定パスなら、入力パスをモックするか、一時的にファイルを配置する必要がある。

    // 仮: スクリプトが入力パスを第一引数、出力パスを第二引数で受け取ると仮定
    // const command = `ts-node --compiler-options '{"module":"CommonJS"}' ${path.join(__dirname, '../convertPublications.ts')} ${INPUT_CSV_PATH} ${EXPECTED_OUTPUT_JSON_PATH}`;

    // スクリプトが固定パスを参照するため、入力ファイルを data/publication_data.csv にコピー
    const originalDataPath = path.join(__dirname, '../../../data/publication_data.csv'); // パス修正
    const tempDataPath = path.join(__dirname, '../../../data/publication_data.csv.temp'); // パス修正

    // 元ファイルをバックアップ (存在する場合)
    if (fs.existsSync(originalDataPath)) {
        fs.renameSync(originalDataPath, tempDataPath);
    }
    // テスト用CSVをコピー
    fs.copyFileSync(INPUT_CSV_PATH, originalDataPath);


    try {
      // package.jsonのスクリプトを実行 (stdio: 'pipe' で出力をキャプチャ)
      execSync('npm run convert-publications', { stdio: 'pipe' });

      // 出力されたJSONファイルが存在するか確認
      expect(fs.existsSync(EXPECTED_OUTPUT_JSON_PATH)).toBe(true);

      // 出力されたJSONファイルの内容を確認
      const outputJsonContent = fs.readFileSync(EXPECTED_OUTPUT_JSON_PATH, 'utf-8');
      const outputJson = JSON.parse(outputJsonContent);

      // 期待されるデータと完全一致するか確認
      expect(outputJson).toEqual(expectedJsonData);

    } finally {
       // テスト用CSVを削除
       if (fs.existsSync(originalDataPath)) {
           fs.unlinkSync(originalDataPath);
       }
       // 元ファイルをリストア (存在する場合)
       if (fs.existsSync(tempDataPath)) {
           fs.renameSync(tempDataPath, originalDataPath);
       }
    }
  });

  test('should exit with error if input CSV file does not exist', () => {
    // beforeEach でファイルを作成しないため、ここでは準備しない
    const originalDataPath = path.join(__dirname, '../../../data/publication_data.csv'); // パス修正
    const tempDataPath = path.join(__dirname, '../../../data/publication_data.csv.temp'); // パス修正

     // 元ファイルをバックアップ (存在する場合)
     if (fs.existsSync(originalDataPath)) {
        fs.renameSync(originalDataPath, tempDataPath);
    }
    // 入力ファイルが存在しない状態にする
    if (fs.existsSync(originalDataPath)) {
        fs.unlinkSync(originalDataPath);
    }

    try {
      // スクリプトを実行し、エラーが発生することを期待
      expect(() => {
        execSync('npm run convert-publications', { stdio: 'pipe' }); // stdio: 'pipe' で出力をキャプチャ
      }).toThrow();
    } catch (error: any) {
        // エラー出力に特定のメッセージが含まれることを確認 (オプション)
        expect(error.stderr.toString()).toContain(`エラー: CSVファイル ${originalDataPath} が見つかりません`);
    } finally {
         // 元ファイルをリストア (存在する場合)
         if (fs.existsSync(tempDataPath)) {
             fs.renameSync(tempDataPath, originalDataPath);
         }
    }
  });

  test('should handle invalid CSV format gracefully (skipping invalid rows)', () => {
    // 3行目に不正な形式（引用符の数が合わない）を含むCSVデータ (13列)
    const invalidCsvData = `未入力項目有り,名前（著者名と論文タイトル）,Japanese（日本語）,type,Review,Authorship,Presentation type,DOI,web link,Date,Others,site,journal / conference
No,"Valid Paper 1","有効論文1","Type A","Rev A","Auth A","Oral","DOI A","Link A","2023年1月1日","Other A","Site A","Journal A"
Yes,"Invalid" Paper 2","無効論文2","Type B","Rev B","Auth B","Poster","DOI B","Link B","2022年12月15日","Other B","Site B","Conference B"`; // "Invalid" の後に引用符がない

    // 不正なCSVデータで入力ファイルを作成
     if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR);
    }
    fs.writeFileSync(INPUT_CSV_PATH, invalidCsvData);

    const originalDataPath = path.join(__dirname, '../../../data/publication_data.csv'); // パス修正
    const tempDataPath = path.join(__dirname, '../../../data/publication_data.csv.temp'); // パス修正

    // 元ファイルをバックアップ (存在する場合)
    if (fs.existsSync(originalDataPath)) {
        fs.renameSync(originalDataPath, tempDataPath);
    }
    // テスト用CSVをコピー
    fs.copyFileSync(INPUT_CSV_PATH, originalDataPath);

    let consoleOutput = '';
    try {
      // スクリプトを実行 (stdio: 'pipe' で出力をキャプチャ)
       const outputBuffer = execSync('npm run convert-publications', { stdio: 'pipe' });
       consoleOutput = outputBuffer.toString();


      // 出力されたJSONファイルが存在するか確認
      expect(fs.existsSync(EXPECTED_OUTPUT_JSON_PATH)).toBe(true);

      // 出力されたJSONファイルの内容を確認 (有効な行のみ含まれる)
      const outputJsonContent = fs.readFileSync(EXPECTED_OUTPUT_JSON_PATH, 'utf-8');
      const outputJson = JSON.parse(outputJsonContent);

      // 不正な行はスキップされ、有効な行のみが変換されることを確認
      expect(outputJson).toHaveLength(1);
      // 有効な行のnameが正しいことを確認
      expect(outputJson[0].name).toBe('Valid Paper 1');
      // 不正な行が含まれていないことを確認 (name でチェック)
      expect(outputJson.find((item: any) => item.name.includes('Invalid'))).toBeUndefined();

      // 標準出力/エラーに警告が含まれることを確認 (csvToJson内のconsole.warn)
      // expect(consoleOutput).toContain('警告: 行 3 の解析中にエラーが発生しました');

    } finally {
       // テスト用CSVを削除
       if (fs.existsSync(originalDataPath)) {
           fs.unlinkSync(originalDataPath);
       }
       // 元ファイルをリストア (存在する場合)
       if (fs.existsSync(tempDataPath)) {
           fs.renameSync(tempDataPath, originalDataPath);
       }
    }
  });
});