import fs from "fs";
import os from "os";
import path from "path";

import {
  parsePublicationMasterJson,
  writePublicationArtifacts,
} from "../utils/publicationMasterFile";
import { publicationMasterToWebPublications } from "../utils/publicationMaster";

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
        fields: {
          type: "published_papers",
          subtype: "scientific_journal",
          title: {
            en: "Alpha Paper",
          },
          contributors: [
            {
              role: "author",
              name: {
                en: "Test Author",
              },
            },
          ],
          venue: {
            kind: "publication",
            name: {
              en: "Journal A",
            },
          },
          dates: {
            published: "2024-01-01",
          },
          review: true,
          ownerRoles: ["lead"],
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
        fields: {
          type: "misc",
          subtype: "others",
          title: {
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
        fields: {
          type: "presentations",
          subtype: "oral_presentation",
          title: {
            ja: "同じタイトル",
          },
          contributors: [
            {
              role: "presenter",
              name: {
                ja: "テスト発表者",
              },
            },
          ],
          venue: {
            kind: "event",
            name: {
              ja: "テスト会議",
            },
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
        fields: {
          type: "misc",
          subtype: "others",
          title: {
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
        fields: {
          type: "presentations",
          subtype: "oral_presentation",
          title: {
            ja: "A-B",
          },
          contributors: [
            {
              role: "presenter",
              name: {
                ja: "テスト発表者",
              },
            },
          ],
          venue: {
            kind: "event",
            name: {
              ja: "テスト会議",
            },
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

  test("canonical venue metadata を type に依らず保持する", () => {
    const records = [
      {
        id: "pub-2024-canonical-venue-metadata",
        fields: {
          type: "misc",
          subtype: "technical_report",
          title: {
            ja: "会場補助情報付き業績",
          },
          contributors: [
            {
              role: "author",
              name: {
                ja: "テスト著者",
              },
            },
          ],
          venue: {
            kind: "publication",
            name: {
              ja: "研究会資料",
            },
            promoter: {
              ja: "主催者A",
            },
            addressCountry: "JP",
          },
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

  test("canonical subtype は generic より typed field を優先する", () => {
    const records = [
      {
        id: "pub-2024-canonical-subtype-priority",
        fields: {
          type: "published_papers",
          subtype: "scientific_journal",
          title: {
            en: "Subtype Priority Paper",
          },
          contributors: [
            {
              role: "author",
              name: {
                en: "Test Author",
              },
            },
          ],
          venue: {
            kind: "publication",
            name: {
              en: "Journal A",
            },
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

  test("see_also の順序が webLink の主 URL を壊さない", () => {
    const publications = publicationMasterToWebPublications([
      {
        id: "pub-2024-web-link-order",
        fields: {
          type: "published_papers",
          subtype: "scientific_journal",
          title: {
            en: "Link Order Paper",
          },
          links: [
            {
              url: "https://example.com/manual-link",
              label: "manual",
            },
            {
              url: "https://doi.org/10.1000/example",
              label: "doi",
            },
            {
              url: "https://example.com/extra-link",
              label: "supplement",
            },
          ],
          dates: {
            published: "2024-01-01",
          },
        },
        localMeta: {
          hasEmptyFields: false,
          notes: "",
        },
      },
    ]);

    expect(publications[0].webLink).toBe("https://example.com/manual-link");
    expect(publications[0].others).toContain("https://example.com/extra-link");
    expect(publications[0].others).not.toContain("https://example.com/manual-link");
  });

  test("legacy researchmapFields の master record は canonical fields がないと拒否する", () => {
    const records = [
      {
        id: "pub-legacy-master",
        researchmapFields: {
          type: "misc",
          paper_title: {
            ja: "旧形式",
          },
        },
        localMeta: {
          hasEmptyFields: false,
          notes: "",
        },
      },
    ];

    expect(() => parsePublicationMasterJson(JSON.stringify(records))).toThrow(
      "canonical schema の master record である必要があります"
    );
  });
});
