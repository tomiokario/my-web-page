import fs from 'fs';
import os from 'os';
import path from 'path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'url';
import { loadMasterPublications } from '../src/masterToPublications.mjs';
import { generateResearchmapExport } from '../src/researchmapExport.mjs';
import { buildReversibleExport } from '../src/researchmapReversibleExport.mjs';
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
