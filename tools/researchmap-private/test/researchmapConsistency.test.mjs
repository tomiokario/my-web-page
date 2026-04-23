import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateResearchmapExport } from '../src/researchmapExport.mjs';
import { analyzeResearchmapConsistency } from '../src/researchmapConsistency.mjs';
import { buildReversibleExport } from '../src/researchmapReversibleExport.mjs';
import { loadMasterPublications } from '../src/masterToPublications.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');
const currentExportPath = path.join(__dirname, 'fixtures/current-export.jsonl');
const currentExportJsonl = fs.readFileSync(currentExportPath, 'utf8');

test('generated researchmap data surfaces current master inconsistencies', () => {
  const masterPath = path.join(repoRoot, 'src/data/publication_master.json');
  const sourceMetadata = loadMasterPublications(masterPath);
  const { publications } = sourceMetadata;
  const { importLines } = generateResearchmapExport(sourceMetadata.records, { researchmapUserId: 'R123456789' });

  const report = analyzeResearchmapConsistency(publications, importLines);

  assert.equal(report.issues.length, 27);
  assert.deepEqual(
    [...new Set(report.issues.flatMap((item) => item.issues.map((issue) => issue.code)))].sort(),
    ['bibliography_mismatch', 'ja_venue_mismatch']
  );

  const venueMismatch = report.issues.find(
    (item) => item.publicationId === 'pub-2022-improvement-of-learning-process-by-transmission-'
  );
  assert.ok(venueMismatch);
  assert.deepEqual(
    {
      publicationId: venueMismatch.publicationId,
      lineType: venueMismatch.type,
      issueCodes: venueMismatch.issues.map((issue) => issue.code),
      warningCodes: venueMismatch.warnings.map((warning) => warning.code),
    },
    {
      publicationId: 'pub-2022-improvement-of-learning-process-by-transmission-',
      lineType: 'misc',
      issueCodes: ['ja_venue_mismatch', 'bibliography_mismatch'],
      warningCodes: ['jpn_with_en_only_location'],
    }
  );

  const japaneseFallback = report.issues.find(
    (item) => item.publicationId ===
      'pub-2022-仮想空間アプリケーションを利用した訪問地の事前体験と高齢化社会への適用'
  );
  assert.ok(japaneseFallback);
  assert.deepEqual(japaneseFallback.warnings.map((warning) => warning.code), ['japanese_fallback_in_en_title']);
});

test('current export surfaces alignment gaps against the master data', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'researchmap-consistency-'));
  const masterPath = path.join(tempDir, 'publication_master.json');
  const masterRecords = [
    {
      id: 'pub-2024-synthetic-alpha',
      fields: {
        type: 'published_papers',
        subtype: 'scientific_journal',
        title: { en: 'Synthetic Alpha Paper' },
        contributors: [{ role: 'author', name: { en: 'Aki Example' } }],
        venue: { kind: 'publication', name: { en: 'Journal of Synthetic Studies' } },
        dates: { published: '2024-01-10' },
        identifiers: { doi: '10.1234/alpha' },
        bibliographic: { volume: '12', number: '3', startPage: '1', endPage: '9' },
        review: true,
        invited: false,
        ownerRoles: ['lead'],
        isInternational: true,
      },
      localMeta: {
        hasEmptyFields: false,
      },
      sync: {},
    },
    {
      id: 'pub-2024-synthetic-beta',
      fields: {
        type: 'misc',
        subtype: 'technical_report',
        title: { ja: '合成ベータ報告' },
        contributors: [{ role: 'author', name: { ja: '合成 太郎' } }],
        venue: { kind: 'publication', name: { ja: '合成研究会' } },
        dates: { published: '2024-02-20' },
        location: { ja: 'Tokyo, Japan' },
        review: false,
        invited: false,
        isInternational: false,
      },
      localMeta: {
        hasEmptyFields: true,
      },
      sync: {},
    },
    {
      id: 'pub-2024-synthetic-gamma',
      fields: {
        type: 'presentations',
        subtype: 'oral_presentation',
        title: { en: 'Synthetic Gamma Talk' },
        contributors: [{ role: 'presenter', name: { en: 'Yui Sample' } }],
        venue: { kind: 'event', name: { en: 'Synthetic Symposium' } },
        dates: {
          published: '2024-03-15',
          eventStart: '2024-03-15',
          eventEnd: '2024-03-16',
        },
        location: { en: 'Online' },
        review: false,
        invited: false,
        isInternational: true,
      },
      localMeta: {
        hasEmptyFields: false,
      },
      sync: {},
    },
    {
      id: 'pub-2024-synthetic-delta',
      fields: {
        type: 'published_papers',
        subtype: 'scientific_journal',
        title: { en: 'Synthetic Delta Paper' },
        contributors: [{ role: 'author', name: { en: 'Ren Demo' } }],
        venue: { kind: 'publication', name: { en: 'Journal of Synthetic Studies' } },
        dates: { published: '2024-04-11' },
        identifiers: { doi: '10.1234/delta' },
        bibliographic: { volume: '7', number: '1', startPage: '21', endPage: '24' },
        review: true,
        invited: false,
        ownerRoles: ['lead'],
        isInternational: true,
      },
      localMeta: {
        hasEmptyFields: false,
      },
      sync: {},
    },
  ];

  try {
    fs.writeFileSync(masterPath, `${JSON.stringify(masterRecords, null, 2)}\n`, 'utf8');
    const sourceMetadata = loadMasterPublications(masterPath);
    const { publications } = sourceMetadata;
    const importLines = currentExportJsonl.trimEnd().split(/\r?\n/).filter(Boolean);
    const reversibleExport = buildReversibleExport(publications, importLines, sourceMetadata);
    const unmatchedRows = reversibleExport.rows.filter((row) => !row.importRecord);

    assert.equal(reversibleExport.rows.length, publications.length);
    assert.equal(reversibleExport.rows.filter((row) => row.importRecord).length, 3);
    assert.deepEqual(
      unmatchedRows.map((row) => ({ id: row.id, lineNumber: row.lineNumber, matchStrategy: row.matchStrategy })),
      [{ id: 'pub-2024-synthetic-delta', lineNumber: 5, matchStrategy: 'unmatched' }]
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('consistency analysis reports missing import rows instead of throwing', () => {
  const masterPath = path.join(repoRoot, 'src/data/publication_master.json');
  const sourceMetadata = loadMasterPublications(masterPath);
  const partialImportLines = currentExportJsonl.trimEnd().split(/\r?\n/).filter(Boolean).slice(0, 10);

  const report = analyzeResearchmapConsistency(sourceMetadata.publications, partialImportLines);

  assert.equal(
    report.issues.some((item) => item.issues.some((issue) => issue.code === 'missing_import_record')),
    true
  );
});
