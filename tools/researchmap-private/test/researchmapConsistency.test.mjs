import fs from 'fs';
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
  const masterPath = path.join(repoRoot, 'src/data/publication_master.json');
  const sourceMetadata = loadMasterPublications(masterPath);
  const { publications } = sourceMetadata;
  const importLines = currentExportJsonl.trimEnd().split(/\r?\n/).filter(Boolean);
  const reversibleExport = buildReversibleExport(publications, importLines, sourceMetadata);
  const unmatchedRows = reversibleExport.rows.filter((row) => !row.importRecord);

  assert.equal(reversibleExport.rows.length, publications.length);
  assert.equal(reversibleExport.rows.filter((row) => row.importRecord).length, 36);
  assert.deepEqual(
    unmatchedRows.map((row) => ({ id: row.id, lineNumber: row.lineNumber, matchStrategy: row.matchStrategy })),
    [
      { id: 'pub-2022-improvement-of-learning-process-by-transmission-', lineNumber: 3, matchStrategy: 'unmatched' },
      { id: 'pub-2023-numerical-simulation-on-phase-to-intensity-conve', lineNumber: 15, matchStrategy: 'unmatched' },
      { id: 'pub-2024-numerical-simulations-on-optoelectronic-deep-neu', lineNumber: 23, matchStrategy: 'unmatched' },
      { id: 'pub-2026-自己参照型ホログラフィック深層ニューラルネットワークを用いた並列画像デノイジングに関する数値シミ', lineNumber: 39, matchStrategy: 'unmatched' },
    ]
  );
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
