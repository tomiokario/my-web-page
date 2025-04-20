import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// テスト用の一時ディレクトリパス
const TEMP_DIR = path.join(__dirname, 'temp_convert_test');
// テスト用の入力CSVファイルパス
const INPUT_CSV_PATH = path.join(TEMP_DIR, 'input.csv');
// スクリプトによって生成されるJSONファイルの期待されるパス
// 注意: convertPublications.ts 内の出力パスに合わせて調整が必要な場合があります
const EXPECTED_OUTPUT_JSON_PATH = path.join(__dirname, '../../src/data/publications.json'); // スクリプト内の出力パスに合わせる

// テスト用のCSVデータ
const sampleCsvData = `名前（著者名と論文タイトル）,Japanese（日本語）,type,Date,sortableDate
"Test Paper 1","テスト論文1","Journal paper：原著論文","2023年1月1日","20230101"
"Test Paper 2","テスト論文2","Research paper (international conference)：国際会議","2022年12月15日","20221215"`;

// 期待されるJSONデータ (csvToJson.tsの変換ロジックに合わせる)
const expectedJsonData = [
  {
    id: 1, // 行番号 (ヘッダー除く)
    hasEmptyFields: false, // CSVの1列目に基づく (サンプルでは省略したのでfalse)
    name: 'Test Paper 1',
    japanese: 'テスト論文1',
    type: 'Journal paper：原著論文',
    review: '', // CSVの5列目 (サンプルでは省略)
    authorship: '', // CSVの6列目 (サンプルでは省略)
    presentationType: '', // CSVの7列目 (サンプルでは省略)
    doi: '', // CSVの8列目 (サンプルでは省略)
    webLink: '', // CSVの9列目 (サンプルでは省略)
    date: '2023年1月1日',
    startDate: '2023-01-01',
    endDate: '2023-01-01',
    sortableDate: '2023-01-01', // processDateの結果
    others: '', // CSVの11列目 (サンプルでは省略)
    site: '', // CSVの12列目 (サンプルでは省略)
    journalConference: '', // CSVの13列目 (サンプルでは省略)
  },
  {
    id: 2,
    hasEmptyFields: false,
    name: 'Test Paper 2',
    japanese: 'テスト論文2',
    type: 'Research paper (international conference)：国際会議',
    review: '',
    authorship: '',
    presentationType: '',
    doi: '',
    webLink: '',
    date: '2022年12月15日',
    startDate: '2022-12-15',
    endDate: '2022-12-15',
    sortableDate: '2022-12-15',
    others: '',
    site: '',
    journalConference: '',
  },
];

describe('convertPublications Script', () => {
  // 各テストの前に一時ディレクトリと入力CSVを作成
  beforeEach(() => {
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR);
    }
    fs.writeFileSync(INPUT_CSV_PATH, sampleCsvData);
    // 既存の出力ファイルを削除しておく (もしあれば)
    if (fs.existsSync(EXPECTED_OUTPUT_JSON_PATH)) {
      fs.unlinkSync(EXPECTED_OUTPUT_JSON_PATH);
    }
  });

  // 各テストの後に一時ディレクトリを削除
  afterEach(() => {
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    // 生成された出力ファイルも削除
    if (fs.existsSync(EXPECTED_OUTPUT_JSON_PATH)) {
      fs.unlinkSync(EXPECTED_OUTPUT_JSON_PATH);
    }
  });

  test('should convert CSV to JSON correctly', () => {
    // スクリプトを実行 (ts-nodeのパスやオプションはpackage.jsonに合わせる)
    // 注意: スクリプトが入力パスを引数で受け取るか、固定パスを参照するかで実行コマンドが変わる
    // ここではスクリプトが固定パス data/publication_data.csv を参照すると仮定し、
    // テスト用のCSVをそのパスに一時的に配置するアプローチも考えられるが、
    // まずはスクリプトが引数を受け取れるか確認する。
    // もし固定パスなら、入力パスをモックするか、一時的にファイルを配置する必要がある。

    // 仮: スクリプトが入力パスを第一引数、出力パスを第二引数で受け取ると仮定
    // const command = `ts-node --compiler-options '{"module":"CommonJS"}' ${path.join(__dirname, '../convertPublications.ts')} ${INPUT_CSV_PATH} ${EXPECTED_OUTPUT_JSON_PATH}`;

    // 仮: スクリプトが固定パスを参照する場合、入力ファイルを data/publication_data.csv にコピー
    const originalDataPath = path.join(__dirname, '../../data/publication_data.csv');
    const tempDataPath = path.join(__dirname, '../../data/publication_data.csv.temp'); // バックアップ用

    // 元ファイルをバックアップ (存在する場合)
    if (fs.existsSync(originalDataPath)) {
        fs.renameSync(originalDataPath, tempDataPath);
    }
    // テスト用CSVをコピー
    fs.copyFileSync(INPUT_CSV_PATH, originalDataPath);


    try {
      // package.jsonのスクリプトを実行
      execSync('npm run convert-publications', { stdio: 'inherit' });

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

  // TODO: 入力ファイルが存在しない場合のテストケースを追加
  // TODO: 不正なCSV形式の場合のテストケースを追加
});