import fs from "fs";
import os from "os";
import path from "path";

import {
  parsePublicationMasterJson,
  writePublicationArtifacts,
} from "../utils/publicationMasterFile";

describe("publicationMasterFile", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "publication-master-file-"));
  const masterJsonFilePath = path.join(tempDir, "publication_master.json");
  const webJsonFilePath = path.join(tempDir, "publications.json");

  afterEach(() => {
    if (fs.existsSync(masterJsonFilePath)) {
      fs.rmSync(masterJsonFilePath, { recursive: true, force: true });
    }
    if (fs.existsSync(webJsonFilePath)) {
      fs.rmSync(webJsonFilePath, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("validates and saves master plus web artifacts together", () => {
    const records = [
      {
        id: "pub-2024-alpha",
        researchmapFields: {
          type: "published_papers",
          published_paper_type: "scientific_journal",
          paper_title: {
            en: "Alpha Paper",
          },
          publication_name: {
            en: "Journal A",
          },
          publication_date: "2024-01-01",
          referee: true,
          published_paper_owner_roles: ["lead"],
        },
        localMeta: {
          hasEmptyFields: false,
          notes: "Alpha note",
        },
      },
    ];

    const webPublications = writePublicationArtifacts(records, {
      masterJsonFilePath,
      webJsonFilePath,
    });

    expect(fs.existsSync(masterJsonFilePath)).toBe(true);
    expect(fs.existsSync(webJsonFilePath)).toBe(true);
    expect(webPublications[0]).toMatchObject({
      type: "published_papers/scientific_journal",
      review: "peer_reviewed",
      authorship: "lead",
    });

    const savedMasterJson = JSON.parse(fs.readFileSync(masterJsonFilePath, "utf8"));
    expect(savedMasterJson[0].localMeta).not.toHaveProperty("legacyHints");
  });

  test("rejects invalid publication master payloads", () => {
    expect(() => parsePublicationMasterJson(JSON.stringify({ invalid: true }))).toThrow(
      "配列である必要があります"
    );
  });

  test("rejects duplicate publication titles in master payloads", () => {
    const records = [
      {
        id: "pub-2024-alpha-ja",
        researchmapFields: {
          type: "misc",
          paper_title: {
            ja: "同じタイトル",
          },
        },
        localMeta: {
          hasEmptyFields: false,
          notes: "",
        },
      },
      {
        id: "pub-2024-alpha-en",
        researchmapFields: {
          type: "presentations",
          presentation_title: {
            ja: "同じタイトル",
          },
        },
        localMeta: {
          hasEmptyFields: false,
          notes: "",
        },
      },
    ];

    expect(() => parsePublicationMasterJson(JSON.stringify(records))).toThrow(
      "重複タイトルがあります"
    );
  });

  test("rejects canonical records without title", () => {
    const records = [
      {
        id: "pub-2024-no-title",
        fields: {
          type: "misc",
        },
        localMeta: {
          hasEmptyFields: false,
          notes: "",
        },
      },
    ];

    expect(() => parsePublicationMasterJson(JSON.stringify(records))).toThrow(
      "title は少なくとも ja または en のタイトルが必要です"
    );
  });

  test("rejects canonical records whose contributor role or venue kind disagrees with type", () => {
    const records = [
      {
        id: "pub-2024-invalid-presentation",
        fields: {
          type: "presentations",
          title: {
            ja: "不整合な発表",
          },
          contributors: [
            {
              role: "author",
              name: {
                ja: "冨岡莉生",
              },
            },
          ],
          venue: {
            kind: "publication",
          },
        },
        localMeta: {
          hasEmptyFields: false,
          notes: "",
        },
      },
    ];

    expect(() => parsePublicationMasterJson(JSON.stringify(records))).toThrow(
      "contributors は presentations の場合 presenter role で統一する必要があります"
    );
  });

  test("rejects duplicate titles after NFKC and dash normalization", () => {
    const records = [
      {
        id: "pub-2024-alpha-1",
        researchmapFields: {
          type: "misc",
          paper_title: {
            ja: "Ａ−Ｂ",
          },
        },
        localMeta: {
          hasEmptyFields: false,
          notes: "",
        },
      },
      {
        id: "pub-2024-alpha-2",
        researchmapFields: {
          type: "presentations",
          presentation_title: {
            ja: "A-B",
          },
        },
        localMeta: {
          hasEmptyFields: false,
          notes: "",
        },
      },
    ];

    expect(() => parsePublicationMasterJson(JSON.stringify(records))).toThrow(
      "重複タイトルがあります"
    );
  });

  test("web artifact の rename が失敗したら master も含めてロールバックする", () => {
    const records = [
      {
        id: "pub-2024-alpha",
        fields: {
          type: "published_papers",
          subtype: "scientific_journal",
          title: {
            en: "Alpha Paper",
          },
        },
        localMeta: {
          hasEmptyFields: false,
          notes: "",
        },
      },
    ];

    fs.mkdirSync(webJsonFilePath);

    expect(() =>
      writePublicationArtifacts(records, {
        masterJsonFilePath,
        webJsonFilePath,
      })
    ).toThrow();

    expect(fs.existsSync(masterJsonFilePath)).toBe(false);
    expect(fs.statSync(webJsonFilePath).isDirectory()).toBe(true);
  });

  test("legacy researchmapFields の venue metadata を type に依らず canonical に保持する", () => {
    const records = [
      {
        id: "pub-2024-legacy-venue-metadata",
        researchmapFields: {
          type: "misc",
          paper_title: {
            ja: "会場補助情報付き業績",
          },
          publication_name: {
            ja: "研究会資料",
          },
          promoter: {
            ja: "主催者A",
          },
          address_country: "JP",
        },
        localMeta: {
          hasEmptyFields: false,
          notes: "",
        },
      },
    ];

    const parsed = parsePublicationMasterJson(JSON.stringify(records));

    expect(parsed[0].fields.venue).toMatchObject({
      kind: "publication",
      name: {
        ja: "研究会資料",
      },
      promoter: {
        ja: "主催者A",
      },
      addressCountry: "JP",
    });
  });

  test("legacy subtype は generic より typed field を優先する", () => {
    const records = [
      {
        id: "pub-2024-legacy-subtype-priority",
        researchmapFields: {
          type: "published_papers",
          subtype: "others",
          published_paper_type: "scientific_journal",
          paper_title: {
            en: "Subtype Priority Paper",
          },
        },
        localMeta: {
          hasEmptyFields: false,
          notes: "",
        },
      },
    ];

    const parsed = parsePublicationMasterJson(JSON.stringify(records));

    expect(parsed[0].fields.subtype).toBe("scientific_journal");
  });
});
