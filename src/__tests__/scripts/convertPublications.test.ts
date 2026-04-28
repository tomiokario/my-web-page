import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const DATA_DIR = path.join(__dirname, "../../data");
const MASTER_JSON_PATH = path.join(DATA_DIR, "publication_master.json");
const WEB_JSON_PATH = path.join(DATA_DIR, "publications.json");
const MASTER_BACKUP_PATH = path.join(DATA_DIR, "publication_master.json.test-backup");
const WEB_BACKUP_PATH = path.join(DATA_DIR, "publications.json.test-backup");

const sampleMasterData = [
  {
    id: "pub-2023-test-paper-1",
    fields: {
      type: "published_papers",
      subtype: "scientific_journal",
      title: {
        en: "Test Paper 1",
        ja: "テスト論文1",
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
        published: "2023-01-01",
      },
      identifiers: {
        doi: "10.1234/test.1",
      },
      links: [
        {
          url: "https://example.com/1",
          label: "url",
        },
        {
          url: "https://example.com/full-text/1",
          label: "Full text link",
        },
      ],
      referee: true,
      ownerRoles: ["lead"],
    },
    localMeta: {
      hasEmptyFields: false,
      notes: "Private editor note 1",
    },
    sync: {
      researchmap: {
        recordId: "53373093",
        userId: "R000000001",
        lastImportedAt: "2026-04-21T09:00:00.000Z",
        lastPayloadHash: "hash-1",
      },
    },
  },
  {
    id: "pub-2022-test-paper-2",
    fields: {
      type: "presentations",
      subtype: "poster_presentation",
      title: {
        en: "Test Paper 2",
        ja: "テスト論文2",
      },
      contributors: [
        {
          role: "presenter",
          name: {
            en: "Test Presenter",
          },
        },
      ],
      venue: {
        kind: "event",
        name: {
          en: "Conference B",
        },
      },
      dates: {
        published: "2022-12-15",
        eventStart: "2022-12-15",
        eventEnd: "2022-12-15",
      },
      identifiers: {
        doi: "10.1234/test.2",
      },
      links: [
        {
          url: "https://example.com/2",
          label: "url",
        },
      ],
    },
    localMeta: {
      hasEmptyFields: true,
      notes: "Private editor note 2",
    },
    sync: {
      researchmap: {
        recordId: "53373094",
        userId: "R000000001",
        lastImportedAt: "2026-04-21T09:05:00.000Z",
        lastPayloadHash: "hash-2",
      },
    },
  },
];

describe("convertPublications script", () => {
  beforeEach(() => {
    if (fs.existsSync(MASTER_JSON_PATH) && !fs.existsSync(MASTER_BACKUP_PATH)) {
      fs.renameSync(MASTER_JSON_PATH, MASTER_BACKUP_PATH);
    }
    if (fs.existsSync(WEB_JSON_PATH) && !fs.existsSync(WEB_BACKUP_PATH)) {
      fs.renameSync(WEB_JSON_PATH, WEB_BACKUP_PATH);
    }
  });

  afterEach(() => {
    if (fs.existsSync(MASTER_JSON_PATH)) {
      fs.unlinkSync(MASTER_JSON_PATH);
    }
    if (fs.existsSync(WEB_JSON_PATH)) {
      fs.unlinkSync(WEB_JSON_PATH);
    }
    if (fs.existsSync(MASTER_BACKUP_PATH)) {
      fs.renameSync(MASTER_BACKUP_PATH, MASTER_JSON_PATH);
    }
    if (fs.existsSync(WEB_BACKUP_PATH)) {
      fs.renameSync(WEB_BACKUP_PATH, WEB_JSON_PATH);
    }
  });

  test("reads publication_master.json and regenerates publications.json", () => {
    fs.writeFileSync(MASTER_JSON_PATH, `${JSON.stringify(sampleMasterData, null, 2)}\n`, "utf8");

    execSync("npm run convert-publications", { stdio: "pipe" });

    expect(fs.existsSync(WEB_JSON_PATH)).toBe(true);

    const outputJson = JSON.parse(fs.readFileSync(WEB_JSON_PATH, "utf8"));
    expect(outputJson).toEqual([
      {
        id: 1,
        recordId: "pub-2023-test-paper-1",
        name: "Test Paper 1",
        japanese: "テスト論文1",
        abstract: "",
        type: "published_papers/scientific_journal",
        category: "published_papers",
        subtype: "scientific_journal",
        review: "",
        authorship: "lead",
        doi: "10.1234/test.1",
        webLink: "https://example.com/1",
        date: "2023-01-01",
        startDate: "2023-01-01",
        endDate: "2023-01-01",
        sortableDate: "2023-01-01",
        others: "Full text link: https://example.com/full-text/1",
        site: "",
        journalConference: "Journal A",
      },
      {
        id: 2,
        recordId: "pub-2022-test-paper-2",
        name: "Test Paper 2",
        japanese: "テスト論文2",
        abstract: "",
        type: "presentations/poster_presentation",
        category: "presentations",
        subtype: "poster_presentation",
        review: "",
        authorship: "",
        doi: "10.1234/test.2",
        webLink: "https://example.com/2",
        date: "2022-12-15",
        startDate: "2022-12-15",
        endDate: "2022-12-15",
        sortableDate: "2022-12-15",
        others: "",
        site: "",
        journalConference: "Conference B",
      },
    ]);
  });

  test("fails when publication_master.json does not exist", () => {
    expect(() => {
      execSync("npm run convert-publications", { stdio: "pipe" });
    }).toThrow();
  });

  test("publications.json には localMeta や sync.researchmap を出力しない", () => {
    fs.writeFileSync(MASTER_JSON_PATH, `${JSON.stringify(sampleMasterData, null, 2)}\n`, "utf8");

    execSync("npm run convert-publications", { stdio: "pipe" });

    const outputJson = JSON.parse(fs.readFileSync(WEB_JSON_PATH, "utf8"));
    expect(outputJson[0]).not.toHaveProperty("presentationType");
    expect(outputJson[1]).not.toHaveProperty("presentationType");
    expect(outputJson[0].localMeta).toBeUndefined();
    expect(outputJson[0].sync).toBeUndefined();
    expect(outputJson[1].localMeta).toBeUndefined();
    expect(outputJson[1].sync).toBeUndefined();
  });
});
