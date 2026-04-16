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
      fs.unlinkSync(masterJsonFilePath);
    }
    if (fs.existsSync(webJsonFilePath)) {
      fs.unlinkSync(webJsonFilePath);
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
});
