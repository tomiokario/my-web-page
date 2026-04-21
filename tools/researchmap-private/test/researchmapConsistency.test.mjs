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
  const { importLines } = generateResearchmapExport(publications, { researchmapUserId: 'R123456789' });

  const report = analyzeResearchmapConsistency(publications, importLines);

  assert.equal(report.issues.length, 4);
  assert.deepEqual(
    report.issues.map((item) => ({
      publicationId: item.publicationId,
      lineType: item.type,
      title: item.title,
      issueCodes: item.issues.map((issue) => issue.code),
      warningCodes: item.warnings.map((warning) => warning.code),
    })),
    [
      {
        publicationId: 'pub-2023-自己参照型ホログラフィの原理に基づく光電子融合型ニューラルネットワークハードウェア',
        lineType: 'presentations',
        title: '自己参照型ホログラフィの原理に基づく光電子融合型ニューラルネットワークハードウェア',
        issueCodes: ['bibliography_mismatch'],
        warningCodes: ['japanese_fallback_in_en_title'],
      },
      {
        publicationId: 'pub-2024-numerical-simulations-on-complex-valued-optoelec',
        lineType: 'presentations',
        title: 'Numerical simulations on complex-valued optoelectronic deep neural network',
        issueCodes: ['bibliography_mismatch'],
        warningCodes: [],
      },
      {
        publicationId: 'pub-2024-numerical-simulations-of-efficient-training-meth',
        lineType: 'presentations',
        title: 'Numerical simulations of efficient training method on optoelectronic deep neural network using transmission matrix',
        issueCodes: ['bibliography_mismatch'],
        warningCodes: [],
      },
      {
        publicationId: 'pub-2025-深層学習によるデノイズ機能を内在した自己参照型ホログラフィックメモリのための効率的な学習手法の検',
        lineType: 'presentations',
        title: '深層学習によるデノイズ機能を内在した自己参照型ホログラフィックメモリのための効率的な学習手法の検討',
        issueCodes: ['bibliography_mismatch'],
        warningCodes: ['japanese_fallback_in_en_title'],
      },
    ]
  );
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
