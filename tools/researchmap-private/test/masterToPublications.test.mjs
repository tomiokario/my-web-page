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
            fields: {
              type: 'presentations',
              subtype: 'oral_presentation',
              title: {
                en: 'Presentation Title',
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
                  en: 'Expected Conference',
                },
              },
              dates: {
                published: '2024-01-01',
                eventStart: '2024-01-01',
                eventEnd: '2024-01-01',
              },
            },
            localMeta: {
              hasEmptyFields: false,
              notes: 'Injected promoter vol.99 pp.1-9',
            },
          },
          {
            id: 'pub-2024-note-isolation-misc',
            fields: {
              type: 'misc',
              subtype: 'others',
              title: {
                en: 'Misc Title',
              },
              contributors: [
                {
                  role: 'author',
                  name: {
                    en: 'Rio Tomioka',
                  },
                },
              ],
              venue: {
                kind: 'publication',
                name: {
                  en: 'Expected Journal',
                },
              },
              dates: {
                published: '2024-02-01',
              },
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

    const sourceMetadata = loadMasterPublications(masterPath);
    const publications = sourceMetadata.publications;

    assert.equal(publications[0].others, '');
    assert.equal(publications[1].others, '');

    const result = generateResearchmapExport(sourceMetadata.records, { researchmapUserId: 'R123456789' });
    const presentationLine = JSON.parse(result.importLines[0]);
    const miscLine = JSON.parse(result.importLines[1]);

    assert.equal(presentationLine.force.event.en, 'Expected Conference');
    assert.equal(miscLine.force.volume, undefined);
    assert.equal(miscLine.force.number, undefined);
    assert.equal(miscLine.force.starting_page, undefined);
    assert.equal(miscLine.force.ending_page, undefined);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('canonical venue metadata preserves promoter and address country in master normalization', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'master-to-publications-venue-'));
  const masterPath = path.join(tempDir, 'publication_master.json');

  try {
    fs.writeFileSync(
      masterPath,
      JSON.stringify(
        [
          {
            id: 'pub-2025-canonical-venue-metadata',
            fields: {
              type: 'presentations',
              subtype: 'oral_presentation',
              title: {
                ja: '会場情報付き発表',
              },
              contributors: [
                {
                  role: 'presenter',
                  name: {
                    ja: 'Rio Tomioka',
                  },
                },
              ],
              venue: {
                kind: 'event',
                name: {
                  ja: '研究会',
                },
                promoter: {
                  ja: '主催者A',
                },
                addressCountry: 'JP',
              },
              dates: {
                published: '2025-02-03',
                eventStart: '2025-02-03',
                eventEnd: '2025-02-03',
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
    const exportFromMaster = generateResearchmapExport(loaded.records, {
      researchmapUserId: 'R123456789',
    });

    assert.equal(loaded.records[0].fields.venue.promoter.ja, '主催者A');
    assert.equal(loaded.records[0].fields.venue.addressCountry, 'JP');

    const exportLine = JSON.parse(exportFromMaster.importLines[0]);
    assert.equal(exportLine.force.promoter.ja, '主催者A');
    assert.equal(exportLine.force.address_country, 'JP');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('canonical subtype prefers typed field over stale generic fallback', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'master-to-publications-subtype-'));
  const masterPath = path.join(tempDir, 'publication_master.json');

  try {
    fs.writeFileSync(
      masterPath,
      JSON.stringify(
        [
          {
            id: 'pub-2025-canonical-subtype-priority',
            fields: {
              type: 'published_papers',
              subtype: 'scientific_journal',
              title: {
                en: 'Subtype Priority Paper',
              },
              contributors: [
                {
                  role: 'author',
                  name: {
                    en: 'Rio Tomioka',
                  },
                },
              ],
              venue: {
                kind: 'publication',
                name: {
                  en: 'Journal A',
                },
              },
              identifiers: {
                doi: '10.1234/example',
              },
              links: [
                {
                  label: 'DOI',
                  url: 'https://doi.org/10.1234/example',
                },
                {
                  label: 'Project',
                  url: 'https://example.com/paper',
                },
              ],
              review: true,
              ownerRoles: ['lead', 'corresponding'],
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
    const exportFromMaster = generateResearchmapExport(loaded.records, {
      researchmapUserId: 'R123456789',
    });

    assert.equal(loaded.records[0].fields.subtype, 'scientific_journal');
    assert.equal(loaded.publications[0].type, 'published_papers/scientific_journal');
    assert.equal(loaded.publications[0].category, 'published_papers');
    assert.equal(loaded.publications[0].subtype, 'scientific_journal');
    assert.equal(loaded.publications[0].review, 'peer_reviewed');
    assert.deepEqual(loaded.publications[0].authorship, ['lead', 'corresponding']);
    assert.equal(loaded.publications[0].doi, '10.1234/example');
    assert.equal(loaded.publications[0].webLink, 'https://example.com/paper');
    assert.equal(loaded.publications[0].others, '');
    assert.equal(Object.hasOwn(loaded.publications[0], 'presentationType'), false);

    const exportLine = JSON.parse(exportFromMaster.importLines[0]);
    assert.equal(exportLine.force.published_paper_type, 'scientific_journal');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('web publication conversion skips malformed links and keeps published paper date range complete', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'master-to-publications-web-safety-'));
  const masterPath = path.join(tempDir, 'publication_master.json');

  try {
    fs.writeFileSync(
      masterPath,
      JSON.stringify(
        [
          {
            id: 'pub-2025-web-safety',
            fields: {
              type: 'published_papers',
              subtype: 'scientific_journal',
              title: {
                en: 'Web Safety Paper',
              },
              contributors: [
                {
                  role: 'author',
                  name: {
                    en: 'Rio Tomioka',
                  },
                },
              ],
              venue: {
                kind: 'publication',
                name: {
                  en: 'Journal B',
                },
              },
              dates: {
                published: '2025-04-01',
              },
              identifiers: {
                doi: '10.1234/web-safety',
              },
              links: [
                {
                  label: 'Missing URL',
                },
                {
                  label: 'DOI',
                  url: 'https://doi.org/10.1234/web-safety',
                },
                {
                  label: 'Project',
                  url: 'https://example.com/web-safety',
                },
              ],
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
    const publication = loaded.publications[0];

    assert.equal(publication.webLink, 'https://example.com/web-safety');
    assert.equal(publication.others, '');
    assert.equal(publication.startDate, '2025-04-01');
    assert.equal(publication.endDate, '2025-04-01');
    assert.equal(publication.sortableDate, '2025-04-01');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
