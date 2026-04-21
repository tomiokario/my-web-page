import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { loadMasterPublications } from '../src/masterToPublications.mjs';
import { generateResearchmapExport } from '../src/researchmapExport.mjs';

test('master localMeta.notes does not affect researchmap export inference', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'master-to-publications-'));
  const masterPath = path.join(tempDir, 'publication_master.json');

  try {
    fs.writeFileSync(
      masterPath,
      JSON.stringify(
        [
          {
            id: 'pub-2024-note-isolation-presentation',
            researchmapFields: {
              type: 'presentations',
              subtype: 'oral_presentation',
              presentation_type: 'oral_presentation',
              presentation_title: {
                en: 'Presentation Title',
              },
              event: {
                en: 'Expected Conference',
              },
              publication_date: '2024-01-01',
              from_event_date: '2024-01-01',
              to_event_date: '2024-01-01',
            },
            localMeta: {
              hasEmptyFields: false,
              notes: 'Injected promoter vol.99 pp.1-9',
            },
          },
          {
            id: 'pub-2024-note-isolation-misc',
            researchmapFields: {
              type: 'misc',
              subtype: 'others',
              paper_title: {
                en: 'Misc Title',
              },
              publication_name: {
                en: 'Expected Journal',
              },
              publication_date: '2024-02-01',
            },
            localMeta: {
              hasEmptyFields: false,
              notes: 'vol.99 no.4 pp.1-9',
            },
          },
        ],
        null,
        2
      ),
      'utf8'
    );

    const publications = loadMasterPublications(masterPath).publications;

    assert.equal(publications[0].others, '');
    assert.equal(publications[1].others, '');

    const result = generateResearchmapExport(publications, { researchmapUserId: 'R123456789' });
    const presentationLine = JSON.parse(result.importLines[0]);
    const miscLine = JSON.parse(result.importLines[1]);

    assert.equal(presentationLine.force.promoter.en, 'Expected Conference');
    assert.equal(miscLine.force.volume, undefined);
    assert.equal(miscLine.force.number, undefined);
    assert.equal(miscLine.force.starting_page, undefined);
    assert.equal(miscLine.force.ending_page, undefined);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('canonical fields take precedence over stale legacyHints in master publications', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'master-to-publications-hints-'));
  const masterPath = path.join(tempDir, 'publication_master.json');

  try {
    fs.writeFileSync(
      masterPath,
      JSON.stringify(
        [
          {
            id: 'pub-2024-canonical-priority',
            fields: {
              type: 'presentations',
              subtype: 'poster_presentation',
              title: {
                en: 'Canonical Presentation',
              },
              contributors: [
                {
                  role: 'presenter',
                  name: {
                    en: 'Rio Tomioka',
                  },
                },
              ],
              venue: {
                kind: 'event',
                name: {
                  en: 'Canonical Conference',
                },
              },
              dates: {
                published: '2024-06-01',
                eventStart: '2024-06-01',
                eventEnd: '2024-06-01',
              },
            },
            localMeta: {
              hasEmptyFields: false,
              notes: '',
              legacyHints: {
                authorship: ['Corresponding author'],
                presentationType: ['Oral'],
              },
            },
          },
        ],
        null,
        2
      ),
      'utf8'
    );

    const publications = loadMasterPublications(masterPath).publications;

    assert.equal(publications[0].authorship, '');
    assert.equal(publications[0].presentationType, 'Poster');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('legacy researchmapFields preserve promoter and address country in canonical normalization', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'master-to-publications-venue-'));
  const masterPath = path.join(tempDir, 'publication_master.json');

  try {
    fs.writeFileSync(
      masterPath,
      JSON.stringify(
        [
          {
            id: 'pub-2025-legacy-venue-metadata',
            researchmapFields: {
              type: 'presentations',
              subtype: 'oral_presentation',
              presentation_type: 'oral_presentation',
              presentation_title: {
                ja: '会場情報付き発表',
              },
              event: {
                ja: '研究会',
              },
              promoter: {
                ja: '主催者A',
              },
              address_country: 'JP',
              publication_date: '2025-02-03',
              from_event_date: '2025-02-03',
              to_event_date: '2025-02-03',
            },
            localMeta: {
              hasEmptyFields: false,
              notes: '',
            },
          },
        ],
        null,
        2
      ),
      'utf8'
    );

    const loaded = loadMasterPublications(masterPath);
    const rawRecords = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
    const exportFromLegacyMaster = generateResearchmapExport(rawRecords, {
      researchmapUserId: 'R123456789',
    });

    assert.equal(loaded.records[0].fields.venue.promoter.ja, '主催者A');
    assert.equal(loaded.records[0].fields.venue.addressCountry, 'JP');

    const exportLine = JSON.parse(exportFromLegacyMaster.importLines[0]);
    assert.equal(exportLine.force.promoter.ja, '主催者A');
    assert.equal(exportLine.force.address_country, 'JP');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('legacy subtype prefers typed researchmap fields over stale generic subtype', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'master-to-publications-subtype-'));
  const masterPath = path.join(tempDir, 'publication_master.json');

  try {
    fs.writeFileSync(
      masterPath,
      JSON.stringify(
        [
          {
            id: 'pub-2025-legacy-subtype-priority',
            researchmapFields: {
              type: 'published_papers',
              subtype: 'others',
              published_paper_type: 'scientific_journal',
              paper_title: {
                en: 'Subtype Priority Paper',
              },
            },
            localMeta: {
              hasEmptyFields: false,
              notes: '',
            },
          },
        ],
        null,
        2
      ),
      'utf8'
    );

    const loaded = loadMasterPublications(masterPath);
    const rawRecords = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
    const exportFromLegacyMaster = generateResearchmapExport(rawRecords, {
      researchmapUserId: 'R123456789',
    });

    assert.equal(loaded.records[0].fields.subtype, 'scientific_journal');
    assert.equal(loaded.publications[0].type, 'Journal paper：原著論文');

    const exportLine = JSON.parse(exportFromLegacyMaster.importLines[0]);
    assert.equal(exportLine.force.published_paper_type, 'scientific_journal');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
