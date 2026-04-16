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
    researchmapFields: {
      type: "published_papers",
      subtype: "scientific_journal",
      published_paper_type: "scientific_journal",
      paper_title: {
        en: "Test Paper 1",
        ja: "テスト論文1",
      },
      authors: {
        en: [{ name: "Test Author" }],
      },
      publication_name: {
        en: "Journal A",
      },
      publication_date: "2023-01-01",
      identifiers: {
        doi: ["10.1234/test.1"],
      },
      see_also: [
        {
          "@id": "https://example.com/1",
          label: "url",
        },
      ],
      referee: true,
      published_paper_owner_roles: ["lead"],
    },
    localMeta: {
      hasEmptyFields: false,
      rawCitation: {
        en: "Test Paper 1",
        ja: "テスト論文1",
      },
      notes: "Other info 1",
    },
  },
  {
    id: "pub-2022-test-paper-2",
    researchmapFields: {
      type: "presentations",
      subtype: "poster_presentation",
      presentation_type: "poster_presentation",
      presentation_title: {
        en: "Test Paper 2",
        ja: "テスト論文2",
      },
      presenters: {
        en: [{ name: "Test Presenter" }],
      },
      event: {
        en: "Conference B",
      },
      publication_date: "2022-12-15",
      from_event_date: "2022-12-15",
      to_event_date: "2022-12-15",
      identifiers: {
        doi: ["10.1234/test.2"],
      },
      see_also: [
        {
          "@id": "https://example.com/2",
          label: "url",
        },
      ],
    },
    localMeta: {
      hasEmptyFields: true,
      rawCitation: {
        en: "Test Paper 2",
        ja: "テスト論文2",
      },
      notes: "Other info 2",
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
        hasEmptyFields: false,
        name: "Test Paper 1",
        japanese: "テスト論文1",
        abstract: "",
        type: "published_papers/scientific_journal",
        category: "published_papers",
        subtype: "scientific_journal",
        review: "peer_reviewed",
        authorship: "lead",
        presentationType: "",
        doi: "10.1234/test.1",
        webLink: "https://example.com/1",
        date: "2023-01-01",
        startDate: "2023-01-01",
        endDate: "2023-01-01",
        sortableDate: "2023-01-01",
        others: "Other info 1",
        site: "",
        journalConference: "Journal A",
      },
      {
        id: 2,
        recordId: "pub-2022-test-paper-2",
        hasEmptyFields: true,
        name: "Test Paper 2",
        japanese: "テスト論文2",
        abstract: "",
        type: "presentations/poster_presentation",
        category: "presentations",
        subtype: "poster_presentation",
        review: "",
        authorship: "",
        presentationType: "poster_presentation",
        doi: "10.1234/test.2",
        webLink: "https://example.com/2",
        date: "2022-12-15",
        startDate: "2022-12-15",
        endDate: "2022-12-15",
        sortableDate: "2022-12-15",
        others: "Other info 2",
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
});
