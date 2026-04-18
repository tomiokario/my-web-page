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
    fields: {
      type: "published_papers" as const,
      subtype: "scientific_journal",
      title: {
        en: "Alpha Paper",
      },
      contributors: [
        {
          role: "author" as const,
          name: {
            en: "Rio Tomioka",
          },
        },
      ],
      venue: {
        kind: "publication" as const,
        name: {
          en: "Journal A",
        },
      },
      dates: {
        published: "2024-01-01",
      },
      identifiers: {
        doi: "10.1000/alpha",
      },
      links: [
        {
          url: "https://example.com/original",
          label: "url",
        },
      ],
      bibliographic: {
        volume: "1",
        startPage: "1",
        endPage: "9",
      },
      review: true,
      ownerRoles: ["lead"],
      isInternational: true,
    },
    localMeta: {
      hasEmptyFields: true,
      notes: "keep me",
    },
    sync: {
      researchmap: {
        recordId: "53373093",
        userId: "R000104649",
      },
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

  test("record id 一致で core field が一致する場合だけ安全に更新する", () => {
    writeJsonl([
      {
        insert: { type: "published_papers", id: "53373093", user_id: "R000104649" },
        merge: {
          paper_title: { en: "Alpha Paper" },
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
    expect(report.summary.review).toBe(0);

    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(updatedMaster[0].fields.bibliographic.volume).toBe("2");
    expect(updatedMaster[0].fields.bibliographic.startPage).toBe("1");
    expect(updatedMaster[0].localMeta).toEqual(existingMasterRecord.localMeta);
    expect(updatedMaster[0].sync.researchmap.recordId).toBe("53373093");
    expect(fs.existsSync(webJsonFilePath)).toBe(true);
  });

  test("DOI 一致でも title 差分があれば review に送る", () => {
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

    expect(report.summary.matched).toBe(0);
    expect(report.summary.review).toBe(1);
    expect(report.reviewItems[0].matchStrategy).toBe("doi");
    expect(report.reviewItems[0].conflictingFields).toContain("fields.title");
    expect(fs.existsSync(webJsonFilePath)).toBe(false);

    const masterAfter = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(masterAfter).toEqual([existingMasterRecord]);
  });

  test("strict match がなく title だけ近い既存 record は review に送る", () => {
    const titleOnlyRecord = {
      ...existingMasterRecord,
      sync: {},
      fields: {
        ...existingMasterRecord.fields,
        type: "misc" as const,
        subtype: "others",
        identifiers: undefined,
      },
    };
    fs.writeFileSync(masterJsonFilePath, `${JSON.stringify([titleOnlyRecord], null, 2)}\n`, "utf8");

    writeJsonl([
      {
        insert: { type: "presentations" },
        merge: {
          presentation_title: { en: "Alpha Paper" },
          event: { en: "Workshop B" },
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

    expect(report.summary.review).toBe(1);
    expect(report.reviewItems[0].matchStrategy).toBe("title");
    expect(report.reviewItems[0].candidateRecords).toHaveLength(1);
    expect(fs.existsSync(webJsonFilePath)).toBe(false);
  });

  test("複数の strict match 候補がある場合も conflictingFields を report する", () => {
    const duplicatedDoiRecord = {
      ...existingMasterRecord,
      id: "pub-2024-alpha-paper-2",
      fields: {
        ...existingMasterRecord.fields,
        title: {
          en: "Alpha Paper Variant",
        },
        venue: {
          kind: "publication" as const,
          name: {
            en: "Journal B",
          },
        },
      },
      sync: {
        researchmap: {
          recordId: "53373094",
          userId: "R000104649",
        },
      },
    };

    fs.writeFileSync(
      masterJsonFilePath,
      `${JSON.stringify([existingMasterRecord, duplicatedDoiRecord], null, 2)}\n`,
      "utf8"
    );

    writeJsonl([
      {
        insert: { type: "published_papers" },
        merge: {
          paper_title: { en: "Alpha Paper" },
          publication_name: { en: "Journal A" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
        },
      },
    ]);

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { dryRun: true, archiveDirPath: archiveDir }
    );

    expect(report.summary.review).toBe(1);
    expect(report.reviewItems[0].matchStrategy).toBe("doi");
    expect(report.reviewItems[0].candidateRecords).toHaveLength(2);
    expect(report.reviewItems[0].conflictingFields).toContain("id");
    expect(report.reviewItems[0].conflictingFields).toContain("fields.title");
    expect(report.reviewItems[0].conflictingFields).toContain("fields.venue.name");
  });

  test("strict match に該当しない新規業績は追加する", () => {
    writeJsonl([
      {
        insert: { type: "presentations", user_id: "R000104649" },
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
      fields: {
        type: "presentations",
        subtype: "oral_presentation",
        title: { ja: "新規発表" },
        venue: {
          kind: "event",
          name: { ja: "研究会" },
        },
      },
      sync: {
        researchmap: {
          userId: "R000104649",
        },
      },
    });
  });

  test("title が空の JSONL record は review に止めて追加しない", () => {
    writeJsonl([
      {
        insert: { type: "presentations", user_id: "R000104649" },
        merge: {
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

    expect(report.summary.added).toBe(0);
    expect(report.summary.review).toBe(1);
    expect(report.reviewItems[0].candidateRecords).toEqual([]);
    expect(report.reviewItems[0].conflictingFields).toContain("fields.title");
    expect(fs.existsSync(webJsonFilePath)).toBe(false);
  });

  test("record id が一致しても title が空なら review に止める", () => {
    writeJsonl([
      {
        insert: { type: "published_papers", id: "53373093", user_id: "R000104649" },
        merge: {
          publication_name: { en: "Journal A" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
        },
      },
    ]);

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { archiveDirPath: archiveDir }
    );

    expect(report.summary.matched).toBe(0);
    expect(report.summary.review).toBe(1);
    expect(report.reviewItems[0].candidateRecords).toEqual([]);
    expect(report.reviewItems[0].conflictingFields).toContain("fields.title");
    expect(JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"))).toEqual([existingMasterRecord]);
  });

  test("同一 JSONL 内で同じ DOI を持つ 2 行目は review に止める", () => {
    fs.writeFileSync(masterJsonFilePath, "[]\n", "utf8");

    writeJsonl([
      {
        insert: { type: "published_papers", user_id: "R000104649" },
        merge: {
          paper_title: { en: "New Paper" },
          publication_name: { en: "Journal X" },
          publication_date: "2025-02-03",
          identifiers: { doi: ["10.1000/new-paper"] },
        },
      },
      {
        insert: { type: "published_papers", user_id: "R000104649" },
        merge: {
          paper_title: { en: "New Paper Revised" },
          publication_name: { en: "Journal X" },
          publication_date: "2025-02-03",
          identifiers: { doi: ["10.1000/new-paper"] },
        },
      },
    ]);

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { archiveDirPath: archiveDir }
    );

    expect(report.summary.added).toBe(1);
    expect(report.summary.review).toBe(1);
    expect(report.reviewItems[0].matchStrategy).toBe("doi");
    expect(report.reviewItems[0].candidateRecords).toHaveLength(1);
    expect(report.reviewItems[0].conflictingFields).toContain("fields.title");
    expect(fs.existsSync(webJsonFilePath)).toBe(false);
    expect(JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"))).toEqual([]);
  });

  test("secondary locale だけの title 差分も review に送る", () => {
    const bilingualRecord = {
      ...existingMasterRecord,
      fields: {
        ...existingMasterRecord.fields,
        title: {
          ja: "アルファ論文",
          en: "Alpha Paper",
        },
        venue: {
          kind: "publication" as const,
          name: {
            ja: "ジャーナルA",
            en: "Journal A",
          },
        },
      },
    };

    fs.writeFileSync(masterJsonFilePath, `${JSON.stringify([bilingualRecord], null, 2)}\n`, "utf8");

    writeJsonl([
      {
        insert: { type: "published_papers", id: "53373093", user_id: "R000104649" },
        merge: {
          paper_title: { ja: "アルファ論文", en: "Alpha Paper Revised" },
          publication_name: { ja: "ジャーナルA", en: "Journal A" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
        },
      },
    ]);

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { archiveDirPath: archiveDir }
    );

    expect(report.summary.matched).toBe(0);
    expect(report.summary.review).toBe(1);
    expect(report.reviewItems[0].matchStrategy).toBe("record_id");
    expect(report.reviewItems[0].conflictingFields).toContain("fields.title");
  });

  test("presentation venue の promoter/addressCountry 差分も review に送る", () => {
    const presentationRecord = {
      ...existingMasterRecord,
      fields: {
        type: "presentations" as const,
        subtype: "oral_presentation",
        title: {
          ja: "会場付き発表",
        },
        contributors: [
          {
            role: "presenter" as const,
            name: {
              ja: "冨岡莉生",
            },
          },
        ],
        venue: {
          kind: "event" as const,
          name: {
            ja: "研究会",
          },
          promoter: {
            ja: "主催者A",
          },
          addressCountry: "JP",
        },
        dates: {
          published: "2025-02-03",
          eventStart: "2025-02-03",
          eventEnd: "2025-02-03",
        },
      },
      sync: {
        researchmap: {
          recordId: "53373095",
          userId: "R000104649",
        },
      },
    };

    fs.writeFileSync(masterJsonFilePath, `${JSON.stringify([presentationRecord], null, 2)}\n`, "utf8");

    writeJsonl([
      {
        insert: { type: "presentations", id: "53373095", user_id: "R000104649" },
        merge: {
          presentation_title: { ja: "会場付き発表" },
          event: { ja: "研究会" },
          promoter: { ja: "主催者B" },
          address_country: "US",
          publication_date: "2025-02-03",
          from_event_date: "2025-02-03",
          to_event_date: "2025-02-03",
          presentation_type: "oral_presentation",
        },
      },
    ]);

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { archiveDirPath: archiveDir }
    );

    expect(report.summary.matched).toBe(0);
    expect(report.summary.review).toBe(1);
    expect(report.reviewItems[0].conflictingFields).toContain("fields.venue.promoter");
    expect(report.reviewItems[0].conflictingFields).toContain("fields.venue.addressCountry");
  });

  test("presentation venue metadata も canonical field に取り込む", () => {
    writeJsonl([
      {
        insert: { type: "presentations", user_id: "R000104649" },
        merge: {
          presentation_title: { ja: "会場付き発表" },
          event: { ja: "研究会" },
          promoter: { ja: "主催者A" },
          address_country: "JP",
          publication_date: "2025-02-03",
          presentation_type: "oral_presentation",
        },
      },
    ]);

    importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { archiveDirPath: archiveDir }
    );

    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(updatedMaster[1].fields.venue.promoter).toEqual({ ja: "主催者A" });
    expect(updatedMaster[1].fields.venue.addressCountry).toBe("JP");
  });

  test("review に止まった target は後続行でも自動 merge しない", () => {
    writeJsonl([
      {
        insert: { type: "published_papers", id: "53373093", user_id: "R000104649" },
        merge: {
          paper_title: { en: "Alpha Paper Updated" },
          publication_name: { en: "Journal A" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
        },
      },
      {
        insert: { type: "published_papers", id: "53373093", user_id: "R000104649" },
        merge: {
          paper_title: { en: "Alpha Paper" },
          publication_name: { en: "Journal A" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
        },
      },
    ]);

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { archiveDirPath: archiveDir }
    );

    expect(report.summary.matched).toBe(0);
    expect(report.summary.review).toBe(2);
    expect(report.reviewItems[1].reason).toContain("同一 import 内で同じ対象 record");
    expect(report.reviewItems[1].matchStrategy).toBe("record_id");
  });

  test("壊れた JSONL 行は空行があっても元ファイルの行番号で invalid を返す", () => {
    fs.writeFileSync(
      inputFilePath,
      '\n{"insert":{"type":"presentations"},"merge":{"presentation_title":{"ja":"正常"}}}\n\n{"broken":\n',
      "utf8"
    );

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { dryRun: true, archiveDirPath: archiveDir }
    );

    expect(report.summary.publicationRecords).toBe(1);
    expect(report.summary.invalid).toBe(1);
    expect(report.invalidRecords[0].lineNumber).toBe(4);
    expect(report.invalidRecords[0].sourceRecord.type).toBe("invalid_jsonl");
    expect(report.invalidRecords[0].reason).toContain("JSON 解析");
    expect(fs.existsSync(webJsonFilePath)).toBe(false);
  });

  test("review item が 1 件でもあれば非 dry-run でも書き込まない", () => {
    writeJsonl([
      {
        insert: { type: "published_papers" },
        merge: {
          paper_title: { en: "Alpha Paper Updated" },
          publication_name: { en: "Journal A" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
        },
      },
    ]);

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { archiveDirPath: archiveDir }
    );

    expect(report.summary.review).toBe(1);
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

  test("archive が EXDEV のときは copy + unlink に fallback する", () => {
    writeJsonl([
      {
        insert: { type: "presentations" },
        merge: {
          presentation_title: { ja: "EXDEV fallback" },
          event: { ja: "研究会" },
          publication_date: "2025-02-03",
        },
      },
    ]);

    const renameSpy = jest.spyOn(fs, "renameSync").mockImplementation(() => {
      const error = new Error("cross-device link not permitted") as NodeJS.ErrnoException;
      error.code = "EXDEV";
      throw error;
    });

    try {
      const report = importPublicationMasterFromResearchmap(
        inputFilePath,
        { masterJsonFilePath, webJsonFilePath },
        { archiveDirPath: archiveDir }
      );

      expect(report.archivedTo).toContain(path.join(archiveDir, "rm_sample"));
      expect(fs.existsSync(inputFilePath)).toBe(false);

      const archivedPath = report.archivedTo as string;
      expect(fs.existsSync(archivedPath)).toBe(true);

      const savedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
      expect(savedMaster).toHaveLength(2);
      expect(savedMaster[1].fields.title.ja).toBe("EXDEV fallback");
    } finally {
      renameSpy.mockRestore();
    }
  });

  test("入力 JSONL の時点で重複タイトルがあれば review に止める", () => {
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

    expect(report.summary.review).toBe(1);
    expect(report.reviewItems[0].reason).toContain("review");
    expect(fs.existsSync(webJsonFilePath)).toBe(false);
  });

  function writeJsonl(records: unknown[]) {
    fs.writeFileSync(
      inputFilePath,
      `${records.map((record) => JSON.stringify(record)).join("\n")}\n`,
      "utf8"
    );
  }
});
