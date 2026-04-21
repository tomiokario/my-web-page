import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath } from 'url';

import { loadMasterPublications } from '../src/masterToPublications.mjs';
import { generateResearchmapExport } from '../src/researchmapExport.mjs';
import {
  decomposeCitation,
  extractSourceTitleVenue,
  reconstructCitationFromImportLine,
  reconstructedCitationFingerprint,
  sourceCitationFingerprint,
} from '../src/researchmapCitationRoundTrip.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');

test('canonical master records are exported to researchmap JSONL without legacy adapters', () => {
  const result = generateResearchmapExport(
    [
      {
        id: 'pub-2024-canonical-paper',
        fields: {
          type: 'published_papers',
          subtype: 'scientific_journal',
          title: { en: 'Canonical Paper' },
          contributors: [
            {
              role: 'author',
              name: { en: 'Rio Tomioka' },
            },
          ],
          venue: {
            kind: 'publication',
            name: { en: 'Journal of Canonical Studies' },
          },
          dates: {
            published: '2024-01-02',
          },
          identifiers: {
            doi: '10.1234/canonical.1',
          },
          links: [
            {
              url: 'https://example.com/canonical',
              label: 'url',
            },
          ],
          bibliographic: {
            volume: '12',
            startPage: '1',
            endPage: '8',
          },
          review: true,
          invited: false,
          ownerRoles: ['lead'],
          isInternational: true,
        },
        localMeta: {
          hasEmptyFields: false,
          notes: '',
        },
        sync: {
          researchmap: {
            recordId: '53373093',
            userId: 'R123456789',
          },
        },
      },
      {
        id: 'pub-2024-canonical-talk',
        fields: {
          type: 'presentations',
          subtype: 'poster_presentation',
          title: { ja: 'カノニカル発表' },
          contributors: [
            {
              role: 'presenter',
              name: { ja: '冨岡莉生' },
            },
          ],
          venue: {
            kind: 'event',
            name: { ja: 'カノニカル会議' },
          },
          dates: {
            published: '2024-03-01',
            eventStart: '2024-03-01',
            eventEnd: '2024-03-02',
          },
          review: false,
          invited: true,
          isInternational: false,
        },
        localMeta: {
          hasEmptyFields: false,
          notes: '',
        },
        sync: {
          researchmap: {
            userId: 'R123456789',
          },
        },
      },
    ],
    { researchmapUserId: 'R123456789' }
  );

  const [paper, talk] = result.importLines.map(JSON.parse);
  const paperPayload = paper.merge || paper.force;
  const talkPayload = talk.merge || talk.force;

  assert.deepEqual(paper.insert, {
    type: 'published_papers',
    user_id: 'R123456789',
    id: '53373093',
  });
  assert.equal(paperPayload.paper_title.en, 'Canonical Paper');
  assert.equal(paperPayload.publication_name.en, 'Journal of Canonical Studies');
  assert.equal(paperPayload.published_paper_type, 'scientific_journal');
  assert.equal(talk.insert.type, 'presentations');
  assert.equal(talkPayload.presentation_title.ja, 'カノニカル発表');
  assert.equal(talkPayload.event.ja, 'カノニカル会議');
  assert.equal(talkPayload.presentation_type, 'poster_presentation');
  assert.equal(result.manualReviewItems.length, 0);
});

test('master-based export keeps title, venue, doi, and publication count aligned', () => {
  const masterPath = path.join(repoRoot, 'src/data/publication_master.json');
  const sourceMetadata = loadMasterPublications(masterPath);
  const result = generateResearchmapExport(sourceMetadata.records, { researchmapUserId: 'R123456789' });

  assert.equal(result.importLines.length, sourceMetadata.records.length);
  assert.ok(
    result.importLines.every((line, index) => {
      const reconstructed = decomposeCitation(reconstructCitationFromImportLine(line));
      const source = extractSourceTitleVenue(sourceMetadata.publications[index]);
      const record = JSON.parse(line);
      const payload = record.force || record.merge || {};
      const sourceDoi = (sourceMetadata.publications[index].doi || '').replace(/^https?:\/\/doi\.org\//i, '');

      return (
        reconstructed.title === source.title &&
        reconstructed.venue === source.venue &&
        payload.publication_date === sourceMetadata.publications[index].startDate &&
        (!sourceDoi || (payload.identifiers?.doi?.[0] || '') === sourceDoi)
      );
    })
  );
});
