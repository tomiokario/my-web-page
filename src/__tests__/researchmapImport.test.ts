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

  test("DOI 一致でも recordId が食い違えば review に送る", () => {
    writeJsonl([
      {
        insert: { type: "published_papers", id: "53373094", user_id: "R000104649" },
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

    expect(report.summary.matched).toBe(0);
    expect(report.summary.review).toBe(1);
    expect(report.reviewItems[0].matchStrategy).toBe("doi");
    expect(report.reviewItems[0].conflictingFields).toContain("sync.researchmap.recordId");
    expect(JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"))).toEqual([existingMasterRecord]);
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

  test("カテゴリ変更で JSONL から欠落した既存値を保持し表示用 authorship も維持する", () => {
    const miscRecord = {
      ...existingMasterRecord,
      fields: {
        type: "misc" as const,
        subtype: "technical_report",
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
        bibliographic: {
          volume: "1",
          startPage: "1",
          endPage: "9",
        },
        ownerRoles: ["lead"],
      },
    };
    fs.writeFileSync(masterJsonFilePath, `${JSON.stringify([miscRecord], null, 2)}\n`, "utf8");

    writeJsonl([
      {
        insert: { type: "presentations", id: "53373093", user_id: "R000104649" },
        merge: {
          presentation_title: { en: "Alpha Paper" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
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
    expect(report.summary.review).toBe(0);

    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(updatedMaster[0].fields).toMatchObject({
      type: "presentations",
      subtype: "poster_presentation",
      contributors: [
        {
          role: "presenter",
          name: { en: "Rio Tomioka" },
        },
      ],
      venue: {
        kind: "event",
        name: { en: "Journal A" },
      },
      bibliographic: {
        volume: "1",
        startPage: "1",
        endPage: "9",
      },
      ownerRoles: ["lead"],
    });

    const updatedWeb = JSON.parse(fs.readFileSync(webJsonFilePath, "utf8"));
    expect(updatedWeb[0]).toMatchObject({
      category: "presentations",
      subtype: "poster_presentation",
      type: "presentations/poster_presentation",
      authorship: "lead",
      presentationType: "poster_presentation",
    });
  });

  test("カテゴリ変更で新カテゴリの subtype が無ければ review に止める", () => {
    writeJsonl([
      {
        insert: { type: "presentations", id: "53373093", user_id: "R000104649" },
        merge: {
          presentation_title: { en: "Alpha Paper" },
          event: { en: "Journal A" },
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
    expect(report.reviewItems[0].conflictingFields).toContain("fields.subtype");
    expect(JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"))).toEqual([existingMasterRecord]);
    expect(fs.existsSync(webJsonFilePath)).toBe(false);
  });

  test("JSONL に存在する空値は明示削除として master と publications.json に反映する", () => {
    writeJsonl([
      {
        insert: { type: "published_papers", id: "53373093", user_id: "R000104649" },
        merge: {
          paper_title: { en: "Alpha Paper" },
          publication_name: { en: "Journal A" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
          published_paper_owner_roles: [],
          starting_page: "",
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
    expect(updatedMaster[0].fields.ownerRoles).toBeUndefined();
    expect(updatedMaster[0].fields.bibliographic.startPage).toBeUndefined();
    expect(updatedMaster[0].fields.bibliographic.volume).toBe("1");
    expect(updatedMaster[0].fields.bibliographic.endPage).toBe("9");

    const updatedWeb = JSON.parse(fs.readFileSync(webJsonFilePath, "utf8"));
    expect(updatedWeb[0].authorship).toBe("");
  });

  test("published_papers の subtype 更新では JSONL に存在しない invited を保持する", () => {
    const invitedPaper = {
      ...existingMasterRecord,
      fields: {
        ...existingMasterRecord.fields,
        invited: true,
      },
    };
    fs.writeFileSync(masterJsonFilePath, `${JSON.stringify([invitedPaper], null, 2)}\n`, "utf8");

    writeJsonl([
      {
        insert: { type: "published_papers", id: "53373093", user_id: "R000104649" },
        merge: {
          paper_title: { en: "Alpha Paper" },
          publication_name: { en: "Journal A" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
          published_paper_type: "research_paper",
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
    expect(updatedMaster[0].fields.subtype).toBe("research_paper");
    expect(updatedMaster[0].fields.invited).toBe(true);
  });

  test("misc の subtype 更新では JSONL に存在しない invited を保持する", () => {
    const invitedMisc = {
      ...existingMasterRecord,
      fields: {
        ...existingMasterRecord.fields,
        type: "misc" as const,
        subtype: "others",
        invited: true,
      },
    };
    fs.writeFileSync(masterJsonFilePath, `${JSON.stringify([invitedMisc], null, 2)}\n`, "utf8");

    writeJsonl([
      {
        insert: { type: "misc", id: "53373093", user_id: "R000104649" },
        merge: {
          paper_title: { en: "Alpha Paper" },
          publication_name: { en: "Journal A" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
          misc_type: "technical_report",
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
    expect(updatedMaster[0].fields.subtype).toBe("technical_report");
    expect(updatedMaster[0].fields.invited).toBe(true);
  });

  test("localized field は JSONL に ja だけ存在する場合に既存 en を保持する", () => {
    const bilingualPresentation = {
      ...existingMasterRecord,
      fields: {
        ...existingMasterRecord.fields,
        type: "presentations" as const,
        subtype: "poster_presentation",
        title: { ja: "アルファ発表", en: "Alpha Presentation" },
        contributors: [
          {
            role: "presenter" as const,
            name: { ja: "冨岡莉生", en: "Rio Tomioka" },
          },
        ],
        venue: {
          kind: "event" as const,
          name: { ja: "研究会", en: "Workshop" },
          promoter: { ja: "主催者", en: "Promoter" },
        },
        location: { ja: "東京", en: "Tokyo" },
        description: { ja: "概要", en: "Abstract" },
      },
    };
    fs.writeFileSync(masterJsonFilePath, `${JSON.stringify([bilingualPresentation], null, 2)}\n`, "utf8");

    writeJsonl([
      {
        insert: { type: "presentations", id: "53373093", user_id: "R000104649" },
        merge: {
          presentation_title: { ja: "アルファ発表" },
          presenters: { ja: [{ name: "冨岡莉生" }] },
          event: { ja: "研究会" },
          promoter: { ja: "主催者" },
          location: { ja: "東京" },
          description: { ja: "概要" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
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
    expect(report.summary.review).toBe(0);

    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(updatedMaster[0].fields).toMatchObject({
      title: { ja: "アルファ発表", en: "Alpha Presentation" },
      contributors: [
        {
          role: "presenter",
          name: { ja: "冨岡莉生", en: "Rio Tomioka" },
        },
      ],
      venue: {
        name: { ja: "研究会", en: "Workshop" },
        promoter: { ja: "主催者", en: "Promoter" },
      },
      location: { ja: "東京", en: "Tokyo" },
      description: { ja: "概要", en: "Abstract" },
    });
  });

  test("localized field は JSONL に空文字 locale が存在する場合に明示削除する", () => {
    const bilingualPresentation = {
      ...existingMasterRecord,
      fields: {
        ...existingMasterRecord.fields,
        type: "presentations" as const,
        subtype: "poster_presentation",
        title: { ja: "アルファ発表", en: "Alpha Presentation" },
        contributors: [
          {
            role: "presenter" as const,
            name: { ja: "冨岡莉生", en: "Rio Tomioka" },
          },
        ],
        venue: {
          kind: "event" as const,
          name: { ja: "研究会", en: "Workshop" },
          promoter: { ja: "主催者", en: "Promoter" },
        },
        location: { ja: "東京", en: "Tokyo" },
        description: { ja: "概要", en: "Abstract" },
      },
    };
    fs.writeFileSync(masterJsonFilePath, `${JSON.stringify([bilingualPresentation], null, 2)}\n`, "utf8");

    writeJsonl([
      {
        insert: { type: "presentations", id: "53373093", user_id: "R000104649" },
        merge: {
          presentation_title: { ja: "アルファ発表", en: "" },
          presenters: { ja: [{ name: "冨岡莉生" }], en: [{ name: "" }] },
          event: { ja: "研究会", en: "" },
          promoter: { ja: "主催者", en: "" },
          location: { ja: "東京", en: "" },
          description: { ja: "概要", en: "" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
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
    expect(report.summary.review).toBe(0);

    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(updatedMaster[0].fields.title).toEqual({ ja: "アルファ発表" });
    expect(updatedMaster[0].fields.contributors).toEqual([
      {
        role: "presenter",
        name: { ja: "冨岡莉生" },
      },
    ]);
    expect(updatedMaster[0].fields.venue.name).toEqual({ ja: "研究会" });
    expect(updatedMaster[0].fields.venue.promoter).toEqual({ ja: "主催者" });
    expect(updatedMaster[0].fields.location).toEqual({ ja: "東京" });
    expect(updatedMaster[0].fields.description).toEqual({ ja: "概要" });
  });

  test("localized field は JSONL に null や空オブジェクトで存在する場合に明示削除する", () => {
    const bilingualPresentation = {
      ...existingMasterRecord,
      fields: {
        ...existingMasterRecord.fields,
        type: "presentations" as const,
        subtype: "poster_presentation",
        title: { ja: "アルファ発表", en: "Alpha Presentation" },
        contributors: [
          {
            role: "presenter" as const,
            name: { ja: "冨岡莉生", en: "Rio Tomioka" },
          },
        ],
        venue: {
          kind: "event" as const,
          name: { ja: "研究会", en: "Workshop" },
          promoter: { ja: "主催者", en: "Promoter" },
        },
        location: { ja: "東京", en: "Tokyo" },
        description: { ja: "概要", en: "Abstract" },
      },
    };
    fs.writeFileSync(masterJsonFilePath, `${JSON.stringify([bilingualPresentation], null, 2)}\n`, "utf8");

    writeJsonl([
      {
        insert: { type: "presentations", id: "53373093", user_id: "R000104649" },
        merge: {
          presentation_title: { ja: "アルファ発表", en: "Alpha Presentation" },
          presenters: { ja: [{ name: "冨岡莉生" }], en: [{ name: "Rio Tomioka" }] },
          event: {},
          promoter: null,
          location: null,
          description: {},
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
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
    expect(report.summary.review).toBe(0);

    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(updatedMaster[0].fields.venue).toEqual({ kind: "event" });
    expect(updatedMaster[0].fields.location).toBeUndefined();
    expect(updatedMaster[0].fields.description).toBeUndefined();
  });

  test("contributors は JSONL に存在しない index-locale の既存値を保持する", () => {
    const bilingualPresentation = {
      ...existingMasterRecord,
      fields: {
        ...existingMasterRecord.fields,
        type: "presentations" as const,
        subtype: "poster_presentation",
        title: { ja: "共同発表", en: "Joint Presentation" },
        contributors: [
          {
            role: "presenter" as const,
            name: { ja: "冨岡莉生", en: "Rio Tomioka" },
          },
          {
            role: "presenter" as const,
            name: { ja: "共同研究者", en: "Collaborator" },
          },
        ],
        venue: {
          kind: "event" as const,
          name: { ja: "研究会", en: "Workshop" },
        },
        dates: {
          published: "2024-01-01",
        },
        identifiers: {
          doi: "10.1000/alpha",
        },
      },
    };
    fs.writeFileSync(masterJsonFilePath, `${JSON.stringify([bilingualPresentation], null, 2)}\n`, "utf8");

    writeJsonl([
      {
        insert: { type: "presentations", id: "53373093", user_id: "R000104649" },
        merge: {
          presentation_title: { ja: "共同発表", en: "Joint Presentation" },
          presenters: {
            ja: [{ name: "冨岡莉生" }, { name: "共同研究者" }],
            en: [{ name: "Rio Tomioka" }],
          },
          event: { ja: "研究会", en: "Workshop" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
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
    expect(report.summary.review).toBe(0);

    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(updatedMaster[0].fields.contributors).toEqual([
      {
        role: "presenter",
        name: { ja: "冨岡莉生", en: "Rio Tomioka" },
      },
      {
        role: "presenter",
        name: { ja: "共同研究者", en: "Collaborator" },
      },
    ]);
  });

  test("contributors は JSONL の空文字 index-locale だけを削除する", () => {
    const bilingualPresentation = {
      ...existingMasterRecord,
      fields: {
        ...existingMasterRecord.fields,
        type: "presentations" as const,
        subtype: "poster_presentation",
        title: { ja: "共同発表", en: "Joint Presentation" },
        contributors: [
          {
            role: "presenter" as const,
            name: { ja: "冨岡莉生", en: "Rio Tomioka" },
          },
          {
            role: "presenter" as const,
            name: { ja: "共同研究者", en: "Collaborator" },
          },
        ],
        venue: {
          kind: "event" as const,
          name: { ja: "研究会", en: "Workshop" },
        },
        dates: {
          published: "2024-01-01",
        },
        identifiers: {
          doi: "10.1000/alpha",
        },
      },
    };
    fs.writeFileSync(masterJsonFilePath, `${JSON.stringify([bilingualPresentation], null, 2)}\n`, "utf8");

    writeJsonl([
      {
        insert: { type: "presentations", id: "53373093", user_id: "R000104649" },
        merge: {
          presentation_title: { ja: "共同発表", en: "Joint Presentation" },
          presenters: {
            ja: [{ name: "冨岡莉生" }, { name: "共同研究者" }],
            en: [{ name: "Rio Tomioka" }, { name: "" }],
          },
          event: { ja: "研究会", en: "Workshop" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
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
    expect(report.summary.review).toBe(0);

    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(updatedMaster[0].fields.contributors).toEqual([
      {
        role: "presenter",
        name: { ja: "冨岡莉生", en: "Rio Tomioka" },
      },
      {
        role: "presenter",
        name: { ja: "共同研究者" },
      },
    ]);
  });

  test("contributors は JSONL に空配列で存在する場合に明示削除する", () => {
    const bilingualPresentation = {
      ...existingMasterRecord,
      fields: {
        ...existingMasterRecord.fields,
        type: "presentations" as const,
        subtype: "poster_presentation",
        title: { ja: "共同発表", en: "Joint Presentation" },
        contributors: [
          {
            role: "presenter" as const,
            name: { ja: "冨岡莉生", en: "Rio Tomioka" },
          },
        ],
        venue: {
          kind: "event" as const,
          name: { ja: "研究会", en: "Workshop" },
        },
        dates: {
          published: "2024-01-01",
        },
        identifiers: {
          doi: "10.1000/alpha",
        },
      },
    };
    fs.writeFileSync(masterJsonFilePath, `${JSON.stringify([bilingualPresentation], null, 2)}\n`, "utf8");

    writeJsonl([
      {
        insert: { type: "presentations", id: "53373093", user_id: "R000104649" },
        merge: {
          presentation_title: { ja: "共同発表", en: "Joint Presentation" },
          presenters: { ja: [], en: [] },
          event: { ja: "研究会", en: "Workshop" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
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
    expect(report.summary.review).toBe(0);

    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(updatedMaster[0].fields.contributors).toBeUndefined();
  });

  test("contributors は JSONL に null で存在する場合に明示削除する", () => {
    const bilingualPresentation = {
      ...existingMasterRecord,
      fields: {
        ...existingMasterRecord.fields,
        type: "presentations" as const,
        subtype: "poster_presentation",
        title: { ja: "共同発表", en: "Joint Presentation" },
        contributors: [
          {
            role: "presenter" as const,
            name: { ja: "冨岡莉生", en: "Rio Tomioka" },
          },
        ],
        venue: {
          kind: "event" as const,
          name: { ja: "研究会", en: "Workshop" },
        },
        dates: {
          published: "2024-01-01",
        },
        identifiers: {
          doi: "10.1000/alpha",
        },
      },
    };
    fs.writeFileSync(masterJsonFilePath, `${JSON.stringify([bilingualPresentation], null, 2)}\n`, "utf8");

    writeJsonl([
      {
        insert: { type: "presentations", id: "53373093", user_id: "R000104649" },
        merge: {
          presentation_title: { ja: "共同発表", en: "Joint Presentation" },
          presenters: null,
          event: { ja: "研究会", en: "Workshop" },
          publication_date: "2024-01-01",
          identifiers: { doi: ["10.1000/alpha"] },
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
    expect(report.summary.review).toBe(0);

    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(updatedMaster[0].fields.contributors).toBeUndefined();
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

  test("published_papers / misc の from_event_date と to_event_date を dates に保持する", () => {
    fs.writeFileSync(masterJsonFilePath, "[]\n", "utf8");

    writeJsonl([
      {
        insert: { type: "published_papers", user_id: "R000104649" },
        merge: {
          paper_title: { en: "Paper With Event Dates" },
          publication_name: { en: "Journal A" },
          publication_date: "2024-03-01",
          from_event_date: "2024-03-01",
          to_event_date: "2024-03-03",
          published_paper_type: "scientific_journal",
        },
      },
      {
        insert: { type: "misc", user_id: "R000104649" },
        merge: {
          paper_title: { en: "Misc With Event Dates" },
          publication_name: { en: "Report A" },
          publication_date: "2024-04-01",
          from_event_date: "2024-04-01",
          to_event_date: "2024-04-02",
          misc_type: "technical_report",
        },
      },
    ]);

    const report = importPublicationMasterFromResearchmap(
      inputFilePath,
      { masterJsonFilePath, webJsonFilePath },
      { archiveDirPath: archiveDir }
    );

    expect(report.summary.added).toBe(2);

    const updatedMaster = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    const paperRecord = updatedMaster.find(
      (record: { fields: { title?: { en?: string } } }) =>
        record.fields.title?.en === "Paper With Event Dates"
    );
    const miscRecord = updatedMaster.find(
      (record: { fields: { title?: { en?: string } } }) =>
        record.fields.title?.en === "Misc With Event Dates"
    );

    expect(paperRecord.fields.dates).toEqual({
      published: "2024-03-01",
      eventStart: "2024-03-01",
      eventEnd: "2024-03-03",
    });
    expect(miscRecord.fields.dates).toEqual({
      published: "2024-04-01",
      eventStart: "2024-04-01",
      eventEnd: "2024-04-02",
    });
  });

  test("matched record は publication_date が無い from_event_date でも published を更新する", () => {
    const undatedRecord = {
      ...existingMasterRecord,
      fields: {
        ...existingMasterRecord.fields,
        dates: undefined,
      },
    };
    fs.writeFileSync(masterJsonFilePath, `${JSON.stringify([undatedRecord], null, 2)}\n`, "utf8");

    writeJsonl([
      {
        insert: { type: "published_papers", id: "53373093", user_id: "R000104649" },
        merge: {
          paper_title: { en: "Alpha Paper" },
          publication_name: { en: "Journal A" },
          from_event_date: "2024-02-10",
          to_event_date: "2024-02-12",
          identifiers: { doi: ["10.1000/alpha"] },
          published_paper_type: "scientific_journal",
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
    expect(updatedMaster[0].fields.dates).toEqual({
      published: "2024-02-10",
      eventStart: "2024-02-10",
      eventEnd: "2024-02-12",
    });
  });

  test("presentation は typed field を優先し legacy field を無視する", () => {
    writeJsonl([
      {
        insert: { type: "presentations", user_id: "R000104649" },
        merge: {
          presentation_title: { ja: "フォールバック発表" },
          paper_title: { ja: "legacy 論文タイトル" },
          presenters: { ja: [{ name: "発表者" }], en: [] },
          authors: { ja: [{ name: "legacy 著者" }], en: [] },
          event: { ja: "研究会" },
          publication_name: { ja: "legacy 会場" },
          publication_date: "2025-02-03",
          presentation_type: "invited_oral_presentation",
          subtype: "poster_presentation",
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
    expect(updatedMaster[1].fields).toMatchObject({
      type: "presentations",
      subtype: "invited_oral_presentation",
      title: { ja: "フォールバック発表" },
      contributors: [
        {
          role: "presenter",
          name: { ja: "発表者" },
        },
      ],
      venue: {
        kind: "event",
        name: { ja: "研究会" },
      },
      invited: true,
    });
  });

  test("generic subtype は typed field が無ければ使われない", () => {
    writeJsonl([
      {
        insert: { type: "published_papers", user_id: "R000104649" },
        merge: {
          paper_title: { en: "論文タイトル" },
          authors: { en: [{ name: "Paper Author" }], ja: [] },
          publication_name: { en: "Journal A" },
          publication_date: "2025-02-03",
          subtype: "scientific_journal",
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
    expect(updatedMaster[1].fields.title).toEqual({ en: "論文タイトル" });
    expect(updatedMaster[1].fields).not.toHaveProperty("subtype");
    expect(updatedMaster[1].fields.contributors).toEqual([
      {
        role: "author",
        name: { en: "Paper Author" },
      },
    ]);
  });

  test("published_papers は typed field を優先し presentation 由来の値を無視する", () => {
    writeJsonl([
      {
        insert: { type: "published_papers", user_id: "R000104649" },
        merge: {
          paper_title: { en: "論文タイトル" },
          presentation_title: { en: "誤って残った発表タイトル" },
          authors: { en: [{ name: "Paper Author" }], ja: [] },
          presenters: { en: [{ name: "Presentation Author" }], ja: [] },
          publication_name: { en: "Journal A" },
          event: { en: "legacy event" },
          publication_date: "2025-02-03",
          published_paper_type: "scientific_journal",
          subtype: "poster_presentation",
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
    expect(updatedMaster[1].fields.title).toEqual({ en: "論文タイトル" });
    expect(updatedMaster[1].fields.contributors).toEqual([
      {
        role: "author",
        name: { en: "Paper Author" },
      },
    ]);
    expect(updatedMaster[1].fields.venue).toEqual({
      kind: "publication",
      name: { en: "Journal A" },
    });
    expect(updatedMaster[1].fields.subtype).toBe("scientific_journal");
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
