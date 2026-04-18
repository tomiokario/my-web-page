import fs from "fs";
import os from "os";
import path from "path";

import { importPublicationMasterFromResearchmap } from "../utils/researchmapImport";

describe("researchmapImport", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "researchmap-import-"));
  const dataDir = path.join(tempDir, "data");
  const archiveDir = path.join(tempDir, "archive");
  const inputFilePath = path.join(tempDir, "rm_sample.jsonl");
  const masterJsonFilePath = path.join(dataDir, "publication_master.json");
  const webJsonFilePath = path.join(dataDir, "publications.json");

  const existingMasterRecord = {
    id: "pub-2024-alpha-paper",
    researchmapFields: {
      type: "published_papers" as const,
      subtype: "scientific_journal",
      published_paper_type: "scientific_journal",
      paper_title: {
        en: "Alpha Paper",
      },
      authors: {
        en: [{ name: "Rio Tomioka" }],
      },
      publication_name: {
        en: "Journal A",
      },
      publication_date: "2024-01-01",
      identifiers: {
        doi: ["10.1000/alpha"],
      },
      volume: "1",
      starting_page: "1",
      ending_page: "9",
      see_also: [
        {
          "@id": "https://example.com/original",
          label: "url",
        },
      ],
      referee: true,
      published_paper_owner_roles: ["lead"],
    },
    localMeta: {
      hasEmptyFields: true,
      notes: "keep me",
    },
  };

  beforeEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(masterJsonFilePath, `${JSON.stringify([existingMasterRecord], null, 2)}\n`, "utf8");
    if (fs.existsSync(inputFilePath)) {
      fs.unlinkSync(inputFilePath);
    }
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("DOI一致で既存業績を更新し localMeta を保持する", () => {
    writeJsonl([
      {
        insert: { type: "published_papers" },
        merge: {
          paper_title: { en: "Alpha Paper Updated" },
          publication_name: { en: "Journal A" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
          volume: "2",
        },
      },
    ]);

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { archiveDirPath: archiveDir }
    );

    expect(report.summary.matched).toBe(1);
    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(updatedMaster[0].researchmapFields.paper_title.en).toBe("Alpha Paper Updated");
    expect(updatedMaster[0].researchmapFields.volume).toBe("2");
    expect(updatedMaster[0].researchmapFields.starting_page).toBe("1");
    expect(updatedMaster[0].localMeta).toEqual(existingMasterRecord.localMeta);
  });

  test("一部 field だけ JSONL が持つ場合に部分上書きできる", () => {
    writeJsonl([
      {
        insert: { type: "published_papers" },
        merge: {
          paper_title: { en: "Alpha Paper" },
          publication_name: { en: "Journal A" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
          number: "5",
        },
      },
    ]);

    importPublicationMasterFromResearchmap(inputFilePath, { masterJsonFilePath, webJsonFilePath }, {
      archiveDirPath: archiveDir,
    });

    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(updatedMaster[0].researchmapFields.number).toBe("5");
    expect(updatedMaster[0].researchmapFields.volume).toBe("1");
    expect(updatedMaster[0].researchmapFields.see_also).toEqual(existingMasterRecord.researchmapFields.see_also);
  });

  test("JSONL にしかない業績を新規追加する", () => {
    writeJsonl([
      {
        insert: { type: "presentations" },
        merge: {
          presentation_title: { ja: "新規発表" },
          event: { ja: "研究会" },
          publication_date: "2025-02-03",
          presentation_type: "oral_presentation",
        },
      },
    ]);

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { archiveDirPath: archiveDir }
    );

    expect(report.summary.added).toBe(1);
    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(updatedMaster).toHaveLength(2);
    expect(updatedMaster[1]).toMatchObject({
      researchmapFields: {
        type: "presentations",
        subtype: "oral_presentation",
        presentation_title: { ja: "新規発表" },
        event: { ja: "研究会" },
      },
      localMeta: {
        hasEmptyFields: false,
        notes: "",
      },
    });
  });

  test("タイトル一致なら type や venue が違っても既存値を保持しつつ既存業績へマージする", () => {
    const titleOnlyMasterRecord = {
      ...existingMasterRecord,
      researchmapFields: {
        ...existingMasterRecord.researchmapFields,
        type: "misc" as const,
        subtype: "others",
        published_paper_type: undefined,
        misc_type: "others",
        publication_name: {
          ja: "旧会議名",
        },
        identifiers: undefined,
      },
    };
    fs.writeFileSync(
      masterJsonFilePath,
      `${JSON.stringify([titleOnlyMasterRecord], null, 2)}\n`,
      "utf8"
    );
    writeJsonl([
      {
        insert: { type: "presentations" },
        merge: {
          presentation_title: { ja: "Alpha Paper" },
          event: { ja: "新しい会議名" },
          publication_date: "2024-01-01",
          presentation_type: "oral_presentation",
        },
      },
    ]);

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { archiveDirPath: archiveDir }
    );

    expect(report.summary.matched).toBe(1);
    expect(report.summary.added).toBe(0);

    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(updatedMaster).toHaveLength(1);
    expect(updatedMaster[0]).toMatchObject({
      id: titleOnlyMasterRecord.id,
      researchmapFields: {
        type: "presentations",
        subtype: "oral_presentation",
        paper_title: { en: "Alpha Paper" },
        presentation_title: { ja: "Alpha Paper" },
        authors: titleOnlyMasterRecord.researchmapFields.authors,
        publication_name: { ja: "旧会議名" },
        event: { ja: "新しい会議名" },
        published_paper_owner_roles: ["lead"],
      },
      localMeta: titleOnlyMasterRecord.localMeta,
    });
    expect(updatedMaster[0].researchmapFields.published_paper_type).toBeUndefined();

    const updatedWeb = JSON.parse(fs.readFileSync(webJsonFilePath, "utf8"));
    expect(updatedWeb[0].type).toBe("presentations/oral_presentation");
    expect(updatedWeb[0].journalConference).toBe("新しい会議名");
    expect(updatedWeb[0].authorship).toBe("lead");
  });

  test("type が変わっても JSONL にない既存の著者や誌名は保持する", () => {
    const miscMasterRecord = {
      ...existingMasterRecord,
      researchmapFields: {
        ...existingMasterRecord.researchmapFields,
        type: "misc" as const,
        subtype: "others",
        misc_type: "others",
        published_paper_type: undefined,
        publication_name: {
          en: "Proceedings of Alpha",
        },
      },
    };
    fs.writeFileSync(
      masterJsonFilePath,
      `${JSON.stringify([miscMasterRecord], null, 2)}\n`,
      "utf8"
    );
    writeJsonl([
      {
        insert: { type: "presentations" },
        merge: {
          presentation_title: { en: "Alpha Paper" },
          event: { en: "New Event" },
          publication_date: "2024-01-01",
          presentation_type: "poster_presentation",
        },
      },
    ]);

    importPublicationMasterFromResearchmap(inputFilePath, { masterJsonFilePath, webJsonFilePath }, {
      archiveDirPath: archiveDir,
    });

    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(updatedMaster[0].researchmapFields.type).toBe("presentations");
    expect(updatedMaster[0].researchmapFields.authors).toEqual(
      miscMasterRecord.researchmapFields.authors
    );
    expect(updatedMaster[0].researchmapFields.publication_name).toEqual(
      miscMasterRecord.researchmapFields.publication_name
    );
    expect(updatedMaster[0].researchmapFields.published_paper_owner_roles).toEqual(["lead"]);
    expect(updatedMaster[0].researchmapFields.event).toEqual({ en: "New Event" });
    expect(updatedMaster[0].researchmapFields.published_paper_type).toBeUndefined();

    const updatedWeb = JSON.parse(fs.readFileSync(webJsonFilePath, "utf8"));
    expect(updatedWeb[0].authorship).toBe("lead");
  });

  test("タイトル正規化が一致すれば全角半角やダッシュ差分でも既存業績へマージする", () => {
    const normalizedTitleMasterRecord = {
      ...existingMasterRecord,
      researchmapFields: {
        ...existingMasterRecord.researchmapFields,
        type: "misc" as const,
        subtype: "others",
        paper_title: {
          ja: "Ａ−Ｂ",
        },
        publication_name: {
          ja: "旧会議名",
        },
        identifiers: undefined,
      },
    };
    fs.writeFileSync(
      masterJsonFilePath,
      `${JSON.stringify([normalizedTitleMasterRecord], null, 2)}\n`,
      "utf8"
    );
    writeJsonl([
      {
        insert: { type: "presentations" },
        merge: {
          presentation_title: { ja: "A-B" },
          event: { ja: "新しい会議名" },
          publication_date: "2024-01-01",
          presentation_type: "poster_presentation",
        },
      },
    ]);

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { archiveDirPath: archiveDir }
    );

    expect(report.summary.matched).toBe(1);
    expect(report.summary.added).toBe(0);

    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(updatedMaster).toHaveLength(1);
    expect(updatedMaster[0]).toMatchObject({
      id: normalizedTitleMasterRecord.id,
      researchmapFields: {
        type: "presentations",
        subtype: "poster_presentation",
        presentation_title: { ja: "A-B" },
      },
    });
  });

  test("壊れた JSONL 行は dry-run report の invalid として返す", () => {
    fs.writeFileSync(
      inputFilePath,
      '{"insert":{"type":"presentations"},"merge":{"presentation_title":{"ja":"正常"}}}\n{"broken":\n',
      "utf8"
    );

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { dryRun: true, archiveDirPath: archiveDir }
    );

    expect(report.summary.publicationRecords).toBe(1);
    expect(report.summary.invalid).toBe(1);
    expect(report.invalidRecords[0]).toMatchObject({
      lineNumber: 2,
      type: "invalid_jsonl",
    });
    expect(report.invalidRecords[0].reason).toContain("JSON 解析");
    expect(fs.existsSync(webJsonFilePath)).toBe(false);
  });

  test("壊れた JSONL 行があれば非 dry-run でも書き込まず停止する", () => {
    fs.writeFileSync(
      inputFilePath,
      '{"insert":{"type":"presentations"},"merge":{"presentation_title":{"ja":"正常"}}}\n{"broken":\n',
      "utf8"
    );

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { archiveDirPath: archiveDir }
    );

    expect(report.summary.invalid).toBe(1);
    expect(report.archivedTo).toBeUndefined();
    expect(fs.existsSync(webJsonFilePath)).toBe(false);
    expect(JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"))).toEqual([existingMasterRecord]);
  });

  test("非出版物 record を無視できる", () => {
    writeJsonl([
      {
        insert: { type: "researchers" },
        merge: {
          permalink: "tomiokario",
        },
      },
    ]);

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { dryRun: true, archiveDirPath: archiveDir }
    );

    expect(report.summary.skippedNonPublication).toBe(1);
    expect(report.summary.publicationRecords).toBe(0);
    expect(fs.existsSync(webJsonFilePath)).toBe(false);
  });

  test("archive と再取り込み防止が動作する", () => {
    writeJsonl([
      {
        insert: { type: "presentations" },
        merge: {
          presentation_title: { ja: "再取り込み防止テスト" },
          event: { ja: "研究会" },
          publication_date: "2025-02-03",
        },
      },
    ]);

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { archiveDirPath: archiveDir }
    );

    expect(report.archivedTo).toContain(path.join(archiveDir, "rm_sample"));
    expect(fs.existsSync(inputFilePath)).toBe(false);

    const archivedPath = report.archivedTo as string;
    const replayInputPath = path.join(tempDir, "replay.jsonl");
    fs.copyFileSync(archivedPath, replayInputPath);

    expect(() =>
      importPublicationMasterFromResearchmap(
        replayInputPath,
        { masterJsonFilePath, webJsonFilePath },
        { archiveDirPath: archiveDir }
      )
    ).toThrow("既に取り込み済み");
  });

  test("master 側に重複タイトルがある場合は import 前に停止する", () => {
    const secondMasterRecord = {
      ...existingMasterRecord,
      id: "pub-2024-alpha-paper-duplicate",
      researchmapFields: {
        ...existingMasterRecord.researchmapFields,
        identifiers: undefined,
      },
    };
    fs.writeFileSync(
      masterJsonFilePath,
      `${JSON.stringify([existingMasterRecord, secondMasterRecord], null, 2)}\n`,
      "utf8"
    );
    writeJsonl([
      {
        insert: { type: "published_papers" },
        merge: {
          paper_title: { en: "Alpha Paper" },
          publication_name: { en: "Journal A" },
          publication_date: "2024-01-01",
        },
      },
    ]);

    expect(() =>
      importPublicationMasterFromResearchmap(
        inputFilePath,
        { masterJsonFilePath, webJsonFilePath },
        { archiveDirPath: archiveDir }
      )
    ).toThrow("重複タイトルがあります");
  });

  test("入力 JSONL の時点で重複タイトルがあれば dry-run で invalid に出す", () => {
    writeJsonl([
      {
        insert: { type: "presentations" },
        merge: {
          presentation_title: { ja: "重複タイトル" },
          event: { ja: "研究会A" },
          publication_date: "2025-02-03",
        },
      },
      {
        insert: { type: "misc" },
        merge: {
          paper_title: { ja: "重複タイトル" },
          publication_name: { ja: "研究会B" },
          publication_date: "2025-02-04",
        },
      },
    ]);

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { dryRun: true, archiveDirPath: archiveDir }
    );

    expect(report.summary.invalid).toBe(1);
    expect(report.invalidRecords[0].reason).toContain("タイトル重複");
    expect(fs.existsSync(webJsonFilePath)).toBe(false);
  });

  test("入力 JSONL の重複タイトルは非 dry-run でも書き込まず停止する", () => {
    writeJsonl([
      {
        insert: { type: "presentations" },
        merge: {
          presentation_title: { ja: "Ａ−Ｂ" },
          event: { ja: "研究会A" },
          publication_date: "2025-02-03",
        },
      },
      {
        insert: { type: "misc" },
        merge: {
          paper_title: { ja: "A-B" },
          publication_name: { ja: "研究会B" },
          publication_date: "2025-02-04",
        },
      },
    ]);

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { archiveDirPath: archiveDir }
    );

    expect(report.summary.invalid).toBe(1);
    expect(report.archivedTo).toBeUndefined();
    expect(fs.existsSync(webJsonFilePath)).toBe(false);

    const masterAfter = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(masterAfter).toEqual([existingMasterRecord]);
    expect(fs.existsSync(inputFilePath)).toBe(true);
  });

  function writeJsonl(records: unknown[]) {
    fs.writeFileSync(
      inputFilePath,
      `${records.map((record) => JSON.stringify(record)).join("\n")}\n`,
      "utf8"
    );
  }
});
