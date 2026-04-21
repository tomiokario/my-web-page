/**
 * CSV から canonical publication master への移行テスト
 */

const fs = require("fs");
const path = require("path");
const { csvToMasterData, importMasterFromCsvAndSave } = require("../utils/csvToJson");

const CSV_FILE_PATH = path.join(__dirname, "../data/publication_data.csv");

function createTempCsvFile(content: string, filename = "temp_test.csv") {
  const tempDir = path.join(__dirname, "../../temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFilePath = path.join(tempDir, filename);
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }

  fs.writeFileSync(tempFilePath, content, "utf8");
  return tempFilePath;
}

function removeTempFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

describe("CSV to master conversion", () => {
  beforeAll(() => {
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`テストに必要なCSVファイル ${CSV_FILE_PATH} が見つかりません`);
    }
  });

  afterAll(() => {
    const tempDir = path.join(__dirname, "../../temp");
    if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
      fs.rmdirSync(tempDir);
    }
  });

  test("csvToMasterData function exists", () => {
    expect(typeof csvToMasterData).toBe("function");
  });

  test("CSV file exists", () => {
    expect(fs.existsSync(CSV_FILE_PATH)).toBe(true);
  });

  test("converts CSV rows into canonical master records", () => {
    const masterData = csvToMasterData(CSV_FILE_PATH);

    expect(masterData).toHaveLength(40);
    expect(masterData[0]).toHaveProperty("fields");
    expect(masterData[0].fields).toMatchObject({
      type: "published_papers",
      subtype: "international_conference_proceedings",
    });

    const targetItem = masterData.find((item: any) =>
      item.fields.title.en.includes(
        "Numerical simulations of neural network hardware based on self-referential holography"
      )
    );

    expect(targetItem).toBeDefined();
    expect(targetItem.fields.title.en).toContain(
      "Numerical simulations of neural network hardware based on self-referential holography"
    );
    expect(targetItem.fields.type).toBe("published_papers");
    expect(targetItem.fields.subtype).toBe("international_conference_proceedings");
    expect(targetItem.fields.dates?.published).toBe("2021-10-03");
  });

  test("skips malformed lines while keeping valid rows", () => {
    const testCsvData = `未入力項目有り,名前,Japanese（日本語）,type,Review,Authorship,Presentation type,DOI,web link,Date,Others,site,journal / conference
No,"Test Author, ""Test Title""",テスト,Test Type,Reviewed,Lead author,Oral,,https://example.com,2023-01-01,,Test Site,Test Journal

Invalid Line with no commas
No,,,,,,,,,,,,
`;

    const tempFilePath = createTempCsvFile(testCsvData, "temp_test.csv");

    try {
      const masterData = csvToMasterData(tempFilePath);

      expect(masterData).toHaveLength(1);
      expect(masterData[0].fields.title.en).toBe("Test Title");
      expect(masterData[0].fields.title.ja).toBe("テスト");
      expect(masterData[0].fields.identifiers).toBeUndefined();
    } finally {
      removeTempFile(tempFilePath);
    }
  });

  test("normalizes authorship, presentation type, and dates into canonical fields", () => {
    const testCsvData = `未入力項目有り,名前,Japanese（日本語）,type,Review,Authorship,Presentation type,DOI,web link,Date,Others,site,journal / conference
No,"Test Author, ""Multiple Roles""",テスト,Test Type,Reviewed,"Corresponding author, Lead author","Oral, Poster",,https://example.com,2021年10月3日 → 2021年10月6日,,Test Site,Test Journal
No,"Test Author, ""Single Role""",テスト,Test Type,Reviewed,Lead author,Oral,,https://example.com,2023年7月,,Test Site,Test Journal
`;

    const tempFilePath = createTempCsvFile(testCsvData, "temp_normalization.csv");

    try {
      const masterData = csvToMasterData(tempFilePath);

      expect(masterData).toHaveLength(2);
      expect(masterData[0].fields.ownerRoles).toEqual(["corresponding", "lead"]);
      expect(masterData[0].fields.dates).toMatchObject({
        published: "2021-10-03",
        eventStart: "2021-10-03",
        eventEnd: "2021-10-06",
      });
      expect(masterData[1].fields.ownerRoles).toEqual(["lead"]);
      expect(masterData[1].fields.dates).toMatchObject({
        published: "2023-07-01",
        eventStart: "2023-07-01",
        eventEnd: "2023-07-01",
      });
    } finally {
      removeTempFile(tempFilePath);
    }
  });

  test("promotes URL-like others into canonical localMeta notes while keeping web link primary", () => {
    const testCsvData = `未入力項目有り,名前,Japanese（日本語）,type,Review,Authorship,Presentation type,DOI,web link,Date,Others,site,journal / conference
No,"Test Author, ""Supplement Link Test""",補足リンクテスト,Test Type,Reviewed,Lead author,Oral,,https://example.com/main,2023-01-01,Full text link: https://example.com/full-text,Test Site,Test Journal
`;

    const tempFilePath = createTempCsvFile(testCsvData, "temp_others_to_notes.csv");

    try {
      const masterData = csvToMasterData(tempFilePath);

      expect(masterData).toHaveLength(1);
      expect(masterData[0].fields.links?.[0]?.url).toBe("https://example.com/main");
      expect(masterData[0].localMeta.notes).toBe("");
    } finally {
      removeTempFile(tempFilePath);
    }
  });

  test("importMasterFromCsvAndSave rejects duplicate titles after normalization", () => {
    const testCsvData = `未入力項目有り,名前,Japanese（日本語）,type,Review,Authorship,Presentation type,DOI,web link,Date,Others,site,journal / conference
No,"Author A, ""Ａ−Ｂ""",Ａ−Ｂ,Test Type,Reviewed,Lead author,Oral,,https://example.com/a,2023年1月1日,,Test Site,Test Journal
No,"Author B, ""A-B""",A-B,Test Type,Reviewed,Lead author,Oral,,https://example.com/b,2023年1月2日,,Test Site,Test Journal
`;
    const tempFilePath = createTempCsvFile(testCsvData, "temp_duplicate_titles.csv");
    const outputPath = path.join(__dirname, "../../temp/duplicate_titles_master.json");

    try {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }

      const success = importMasterFromCsvAndSave(tempFilePath, {
        masterJsonFilePath: outputPath,
      });

      expect(success).toBe(false);
      expect(fs.existsSync(outputPath)).toBe(false);
    } finally {
      removeTempFile(tempFilePath);
      removeTempFile(outputPath);
    }
  });
});
