import fs from 'fs';
import os from 'os';
import path from 'path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'url';
import { loadCsvPublications } from '../src/csvToPublications.mjs';
import { loadMasterPublications } from '../src/masterToPublications.mjs';
import { generateResearchmapExport } from '../src/researchmapExport.mjs';
import { buildReversibleExport, reconstructCsvFromReversibleExport } from '../src/researchmapReversibleExport.mjs';
import {
  decomposeCitation,
  extractSourceTitleVenue,
  importComparableFingerprint,
  reconstructCitationFromImportLine,
  reconstructedCitationFingerprint,
  sourceComparableFingerprint,
  sourceCitationFingerprint,
} from '../src/researchmapCitationRoundTrip.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');

test('reversible sidecar can reconstruct the original csv content', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'researchmap-reversible-'));
  const csvPath = path.join(tempDir, 'publication_data.csv');
  const csvContent = [
    '\uFEFF未入力項目有り,名前,Japanese（日本語）,type,Review,Authorship,Presentation type,DOI,web link,Date,Others,site,journal / conference,abstract',
    'No,"Rio Tomioka and Masanori Takabayashi, ""Numerical simulations of neural network hardware based on self-referential holography,"" International Symposium on Imaging, Sensing, and Optical Memory (ISOM’21) Technical Digest， We-A-02， pp.123-124 (Oct. 2021).",,Research paper (international conference)：国際会議,Reviewed,Lead author,Oral,,https://www.isom.jp/PDF/ISOM21_Advance%20Program.pdf,2021年10月3日 → 2021年10月6日,,online,ISOM21',
    'No,"Yuta Eto, Rio Tomioka, Taichi Takatsu and Masanori Takabayashi, ""Numerical simulations on self-referential holographic data storage with built-in denoising function by self-referential holographic deep neural network,"" Optical Review 32, 534–545 (2025).",,Journal paper：原著論文,Reviewed,Co-author,,https://doi.org/10.1007/s10043-025-00978-9,https://doi.org/10.1007/s10043-025-00978-9,2025年6月21日,,,Optical Review,"abstract"',
    '',
  ].join('\n');
  fs.writeFileSync(csvPath, csvContent, 'utf8');

  const csvMetadata = loadCsvPublications(csvPath);
  const exportResult = generateResearchmapExport(csvMetadata.publications, { researchmapUserId: 'R123456789' });
  const reversibleExport = buildReversibleExport(csvMetadata.publications, exportResult.importLines, csvMetadata);
  const reversedReversibleExport = buildReversibleExport(
    csvMetadata.publications,
    [...exportResult.importLines].reverse(),
    csvMetadata
  );
  const reconstructedCsv = reconstructCsvFromReversibleExport(reversibleExport);

  assert.equal(reconstructedCsv, csvContent);
  assert.equal(reversibleExport.rawHeaderLine, '未入力項目有り,名前,Japanese（日本語）,type,Review,Authorship,Presentation type,DOI,web link,Date,Others,site,journal / conference,abstract');
  assert.equal(reversibleExport.rows[0].importRecord.insert.type, 'published_papers');
  assert.equal(reversibleExport.rows[0].importRecord.force.number, 'We-A-02');
  assert.match(reversibleExport.rows[0].rawLine, /We-A-02/);
  assert.equal(reversibleExport.rows[1].importRecord.insert.type, 'published_papers');
  assert.equal(reversibleExport.rows[1].importRecord.force.volume, '32');
  assert.match(reversibleExport.rows[1].rawLine, /Optical Review 32/);
  assert.deepEqual(
    reversibleExport.rows.map((row) => ({
      id: row.id,
      lineNumber: row.lineNumber,
      type: row.importRecord.insert.type,
    })),
    [
      { id: 1, lineNumber: 2, type: 'published_papers' },
      { id: 2, lineNumber: 3, type: 'published_papers' },
    ]
  );
  assert.ok(reversibleExport.rows.every((row) => row.importRecord));
  assert.deepEqual(
    reversedReversibleExport.rows.map((row) => row.importRecord.force.publication_name.en),
    ['ISOM21', 'Optical Review']
  );
  assert.ok(
    reversedReversibleExport.rows.every((row) =>
      ['comparable-fingerprint', 'fingerprint', 'metadata', 'doi'].includes(row.matchStrategy)
    )
  );
});

test('reversible sidecar keeps row-to-import correspondence across shuffled import lines', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'researchmap-reversible-shuffle-'));
  const csvPath = path.join(tempDir, 'publication_data.csv');
  const csvContent = [
    '\uFEFF未入力項目有り,名前,Japanese（日本語）,type,Review,Authorship,Presentation type,DOI,web link,Date,Others,site,journal / conference,abstract',
    'No,"Rio Tomioka and Masanori Takabayashi, ""Numerical simulations of neural network hardware based on self-referential holography,"" International Symposium on Imaging, Sensing, and Optical Memory (ISOM’21) Technical Digest， We-A-02， pp.123-124 (Oct. 2021).",,Research paper (international conference)：国際会議,Reviewed,Lead author,Oral,,https://www.isom.jp/PDF/ISOM21_Advance%20Program.pdf,2021年10月3日 → 2021年10月6日,,online,ISOM21',
    'Yes,"Masanori Takabayashi, Sae Isayama, and Rio Tomioka, ""Hyperparameter tuning for accurate image classification using self-referential holographic neural network,"" International Workshop on Holography and Related Technologies (IWH 2021) Technical Digest, 11-P08 (Mar. 2022).",,Research paper (international conference)：国際会議,,Co-author,Oral,,https://www.i-w-holography.org/archives/iwh2021-top/iwh2021-program/,2022年3月11日 → 2022年3月12日,,,IWH2021',
    'No,"Yuta Eto, Rio Tomioka, Taichi Takatsu and Masanori Takabayashi, ""Numerical simulations on self-referential holographic data storage with built-in denoising function by self-referential holographic deep neural network,"" Optical Review 32, 534–545 (2025).",,Journal paper：原著論文,Reviewed,Co-author,,https://doi.org/10.1007/s10043-025-00978-9,https://doi.org/10.1007/s10043-025-00978-9,2025年6月21日,,,Optical Review,"abstract"',
    'No,"Rio Tomioka, ""Numerical Simulation of Output Filter Design for Optoelectronic Deep Neural Network Using Hyperparameter Optimization"", Program and Abstracts The 6th International Symposium on Neuromorphic AI Hardware, P1-21, p. 39 (2025)",,Research paper (international conference)：国際会議,Reviewed,Lead author,Poster,,https://kyutech.repo.nii.ac.jp/records/2001779,2025年3月3日 → 2025年3月4日,,"Kitakyushu, Fukuoka, Japan",the 6th International Symposium on Neuromorphic AI Hardware',
    '',
  ].join('\n');
  fs.writeFileSync(csvPath, csvContent, 'utf8');

  const csvMetadata = loadCsvPublications(csvPath);
  const exportResult = generateResearchmapExport(csvMetadata.publications, { researchmapUserId: 'R123456789' });
  const shuffledImportLines = [
    exportResult.importLines[2],
    exportResult.importLines[0],
    exportResult.importLines[3],
    exportResult.importLines[1],
  ];
  const reversibleExport = buildReversibleExport(csvMetadata.publications, shuffledImportLines, csvMetadata);

  assert.deepEqual(
    reversibleExport.rows.map((row, index) => {
      const reconstructed = decomposeCitation(reconstructCitationFromImportLine(row.importRecord));
      const source = extractSourceTitleVenue(csvMetadata.publications[index]);
      return (
        reconstructed.title === source.title &&
        reconstructed.venue === source.venue &&
        row.importRecord.force.publication_date === csvMetadata.publications[index].startDate
      );
    }),
    [true, true, true, true]
  );
});

test('master source rows omit localMeta.notes from reversible sidecar tracing', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'researchmap-reversible-master-'));
  const masterPath = path.join(tempDir, 'publication_master.json');
  const masterRecords = [
    {
      id: 'pub-2025-master-sidecar',
      fields: {
        type: 'published_papers',
        subtype: 'scientific_journal',
        title: { en: 'Master Sidecar Paper' },
        contributors: [
          {
            role: 'author',
            name: { en: 'Rio Tomioka' },
          },
        ],
        venue: {
          kind: 'publication',
          name: { en: 'Optical Review' },
        },
        dates: {
          published: '2025-01-01',
        },
      },
      localMeta: {
        hasEmptyFields: false,
        notes: 'sidecar-trace',
      },
    },
  ];

  try {
    fs.writeFileSync(masterPath, `${JSON.stringify(masterRecords, null, 2)}\n`, 'utf8');

    const sourceMetadata = loadMasterPublications(masterPath);
    const exportResult = generateResearchmapExport(sourceMetadata.records, { researchmapUserId: 'R123456789' });
    const reversibleExport = buildReversibleExport(sourceMetadata.publications, exportResult.importLines, sourceMetadata);

    assert.equal(sourceMetadata.records[0].localMeta.notes, 'sidecar-trace');
    assert.match(sourceMetadata.sourceRows[0].rawLine, /"id":\s*"pub-2025-master-sidecar"/);
    assert.match(sourceMetadata.sourceRows[0].rawLine, /"fields":/);
    assert.equal(reversibleExport.rows[0].rawLine, sourceMetadata.sourceRows[0].rawLine);
    assert.doesNotMatch(reversibleExport.rows[0].rawLine, /"notes":\s*"sidecar-trace"/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('reversible sidecar keeps row-to-import correspondence across the full dataset', () => {
  const masterPath = path.join(repoRoot, 'src/data/publication_master.json');
  const sourceMetadata = loadMasterPublications(masterPath);
  const exportResult = generateResearchmapExport(sourceMetadata.records, { researchmapUserId: 'R123456789' });
  const shuffledImportLines = [...exportResult.importLines].reverse();
  const reversibleExport = buildReversibleExport(sourceMetadata.publications, shuffledImportLines, sourceMetadata);

  assert.equal(reversibleExport.rows.length, sourceMetadata.publications.length);
  assert.ok(reversibleExport.rows.every((row) => row.importRecord));
  assert.ok(
    reversibleExport.rows.every((row, index) => {
      const publication = sourceMetadata.publications[index];
      const payload = row.importRecord.force || row.importRecord.merge || {};
      const source = extractSourceTitleVenue(publication);
      const reconstructed = decomposeCitation(reconstructCitationFromImportLine(row.importRecord));
      const payloadDoi = payload.identifiers?.doi?.[0] || '';
      const sourceDoi = (publication.doi || '').replace(/^https?:\/\/doi\.org\//i, '');
      return (
        reconstructed.title === source.title &&
        reconstructed.venue === source.venue &&
        payload.publication_date === publication.startDate &&
        row.sourceFingerprint === sourceCitationFingerprint(publication) &&
        row.importFingerprint === reconstructedCitationFingerprint(row.importRecord) &&
        row.sourceComparableFingerprint === sourceComparableFingerprint(publication, row.importRecord.insert?.type) &&
        row.importComparableFingerprint === importComparableFingerprint(row.importRecord) &&
        (!sourceDoi || payloadDoi === sourceDoi)
      );
    })
  );
  assert.ok(
    reversibleExport.rows.every((row) =>
      ['comparable-fingerprint', 'fingerprint', 'metadata', 'metadata-fingerprint', 'doi'].includes(row.matchStrategy)
    )
  );
});
