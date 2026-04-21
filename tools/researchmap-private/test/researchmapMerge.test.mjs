import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeWithExistingResearchmapExport } from '../src/researchmapMerge.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadMasterPublications } from '../src/masterToPublications.mjs';
import { generateResearchmapExport } from '../src/researchmapExport.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');

test('existing researchmap export is updated in-place and keeps manual fields', () => {
  const existingRecords = [
    {
      insert: { type: 'researchers', id: 'R123456789' },
      merge: { permalink: 'sample-researcher' },
    },
    {
      insert: { type: 'published_papers', id: '53373093', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Numerical simulations on optoelectronic deep neural network hardware based on self-referential holography' },
        publication_name: { en: 'Optical Review' },
        publication_date: '2023-04-28',
        identifiers: { doi: ['10.1007/s10043-023-00810-2'] },
        see_also: [{ '@id': 'https://doi.org/10.1007/s10043-023-00810-2', label: 'doi', is_downloadable: false }],
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'published_papers', user_id: 'R123456789' },
      force: {
        paper_title: { en: 'Numerical simulations on optoelectronic deep neural network hardware based on self-referential holography' },
        publication_name: { en: 'Optical Review' },
        publication_date: '2023-04-28',
        identifiers: { doi: ['10.1007/s10043-023-00810-2'] },
        volume: '30',
        starting_page: '387',
        ending_page: '396',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const mergedRecords = result.mergedLines.map((line) => JSON.parse(line));
  const mergedPaper = mergedRecords.find((record) => record.insert.id === '53373093');

  assert.equal(mergedPaper.merge.volume, '30');
  assert.equal(mergedPaper.merge.starting_page, '387');
  assert.equal(mergedPaper.merge.ending_page, '396');
  assert.equal(mergedPaper.merge.see_also[0].label, 'doi');
  assert.equal(result.mergeReview.matchedCount, 1);
  assert.equal(result.mergeReview.unmatchedGenerated.length, 0);
});

test('strict match keeps researchmap-only see_also links in existing-first order', () => {
  const existingRecords = [
    {
      insert: { type: 'published_papers', id: '53373093', user_id: 'R123456789' },
      merge: {
        paper_title: {
          en: 'Numerical simulations on optoelectronic deep neural network hardware based on self-referential holography',
        },
        publication_name: { en: 'Optical Review' },
        publication_date: '2023-04-28',
        identifiers: { doi: ['10.1007/s10043-023-00810-2'] },
        see_also: [
          { '@id': 'https://example.com/manual-link', label: 'manual', is_downloadable: true },
          { '@id': 'https://doi.org/10.1007/s10043-023-00810-2', label: 'doi', is_downloadable: false },
        ],
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'published_papers', user_id: 'R123456789' },
      force: {
        paper_title: {
          en: 'Numerical simulations on optoelectronic deep neural network hardware based on self-referential holography',
        },
        publication_name: { en: 'Optical Review' },
        publication_date: '2023-04-28',
        identifiers: { doi: ['10.1007/s10043-023-00810-2'] },
        see_also: [
          { '@id': 'https://doi.org/10.1007/s10043-023-00810-2', label: 'doi', is_downloadable: false },
          { '@id': 'https://example.com/extra-link', label: 'supplement', is_downloadable: true },
        ],
        volume: '30',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const mergedPaper = result.mergedLines.map((line) => JSON.parse(line))[0];

  assert.equal(mergedPaper.merge.volume, '30');
  assert.deepEqual(
    mergedPaper.merge.see_also.map((entry) => entry['@id']),
    [
      'https://example.com/manual-link',
      'https://doi.org/10.1007/s10043-023-00810-2',
      'https://example.com/extra-link',
    ]
  );
});

test('strict match dedupes see_also by url even when metadata differs', () => {
  const existingRecords = [
    {
      insert: { type: 'published_papers', id: '53373093', user_id: 'R123456789' },
      merge: {
        paper_title: {
          en: 'Numerical simulations on optoelectronic deep neural network hardware based on self-referential holography',
        },
        publication_name: { en: 'Optical Review' },
        publication_date: '2023-04-28',
        identifiers: { doi: ['10.1007/s10043-023-00810-2'] },
        see_also: [
          { '@id': 'https://example.com/shared-link', label: 'manual', is_downloadable: true },
        ],
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'published_papers', user_id: 'R123456789' },
      force: {
        paper_title: {
          en: 'Numerical simulations on optoelectronic deep neural network hardware based on self-referential holography',
        },
        publication_name: { en: 'Optical Review' },
        publication_date: '2023-04-28',
        identifiers: { doi: ['10.1007/s10043-023-00810-2'] },
        see_also: [
          { '@id': 'https://example.com/shared-link', label: 'doi', is_downloadable: false },
        ],
        volume: '30',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const mergedPaper = result.mergedLines.map((line) => JSON.parse(line))[0];

  assert.deepEqual(mergedPaper.merge.see_also, [
    { '@id': 'https://example.com/shared-link', label: 'manual', is_downloadable: true },
  ]);
});

test('generated bibliographic core field differences are quarantined after strict match', () => {
  const existingRecords = [
    {
      insert: { type: 'published_papers', id: '53373093', user_id: 'R123456789' },
      merge: {
        paper_title: {
          en: 'Numerical simulations on self-referential holographic data storage with built-in denoising function by self-referential holographic deep neural network',
        },
        publication_name: { en: 'Optical Review' },
        publication_date: '2025-06-21',
        identifiers: { doi: ['10.1007/s10043-025-00978-9'] },
        volume: '999',
        starting_page: '1',
        ending_page: '2',
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'published_papers', user_id: 'R123456789' },
      force: {
        paper_title: {
          en: 'Numerical simulations on self-referential holographic data storage with built-in denoising function by self-referential holographic deep neural network',
        },
        publication_name: { en: 'Optical Review' },
        publication_date: '2025-06-21',
        identifiers: { doi: ['10.1007/s10043-025-00978-9'] },
        volume: '32',
        starting_page: '534',
        ending_page: '545',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const quarantinedRecord = result.quarantineLines.map((line) => JSON.parse(line))[0];

  assert.equal(result.mergeReview.matchedCount, 0);
  assert.equal(result.mergeReview.reviewItems.length, 1);
  assert.equal(result.mergeReview.reviewItems[0].matchStrategy, 'doi');
  assert.ok(result.mergeReview.reviewItems[0].conflictingFields.includes('volume'));
  assert.ok(result.mergeReview.reviewItems[0].conflictingFields.includes('starting_page'));
  assert.ok(result.mergeReview.reviewItems[0].conflictingFields.includes('ending_page'));
  assert.equal(quarantinedRecord.insert.id, undefined);
  assert.equal(result.mergedLines.length, 0);
});

test('generated languages override existing languages when language detection is corrected', () => {
  const existingRecords = [
    {
      insert: { type: 'presentations', id: '53373069', user_id: 'R123456789' },
      merge: {
        presentation_title: {
          ja: '仮想空間アプリケーションを利用した訪問地の事前体験と高齢化社会への適用',
          en: '仮想空間アプリケーションを利用した訪問地の事前体験と高齢化社会への適用',
        },
        event: { ja: '第25回ASD研究会' },
        publication_date: '2022-12-09',
        languages: ['eng'],
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'presentations', user_id: 'R123456789' },
      force: {
        presentation_title: {
          ja: '仮想空間アプリケーションを利用した訪問地の事前体験と高齢化社会への適用',
          en: '仮想空間アプリケーションを利用した訪問地の事前体験と高齢化社会への適用',
        },
        event: { ja: '第25回ASD研究会' },
        publication_date: '2022-12-09',
        languages: ['jpn'],
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const mergedRecord = result.mergedLines.map((line) => JSON.parse(line))[0];

  assert.deepEqual(mergedRecord.merge.languages, ['jpn']);
});

test('author 差分がある generated record は review に送る', () => {
  const existingRecords = [
    {
      insert: { type: 'misc', id: '53373088', user_id: 'R123456789' },
      merge: {
        paper_title: {
          en: 'Self-Referential Holographic Memory with Denoising Functionality by Deep Learning for Reconstructed Datapages --A Study on Dataset Generation Methods for Deep Learning--',
        },
        publication_name: { ja: 'MMS2024(愛媛)' },
        publication_date: '2024-12-05',
        authors: {
          en: [
            { name: 'Eto Yuta' },
            { name: 'Rio Tomioka' },
            { name: 'Taichi Takatsu' },
            { name: 'Masanori Takabayashi' },
          ],
        },
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'misc', user_id: 'R123456789' },
      force: {
        paper_title: {
          en: 'Self-Referential Holographic Memory with Denoising Functionality by Deep Learning for Reconstructed Datapages --A Study on Dataset Generation Methods for Deep Learning--',
        },
        publication_name: { ja: 'MMS2024(愛媛)' },
        publication_date: '2024-12-05',
        authors: {
          en: [
            { name: 'Yuta Eto' },
            { name: 'Rio Tomioka' },
            { name: 'Taichi Takatsu' },
            { name: 'Masanori Takabayashi' },
          ],
        },
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const quarantinedRecord = result.quarantineLines.map((line) => JSON.parse(line))[0];

  assert.equal(quarantinedRecord.force.authors.en[0].name, 'Yuta Eto');
  assert.equal(result.mergeReview.matchedCount, 0);
  assert.equal(result.mergeReview.reviewItems.length, 1);
  assert.equal(result.mergeReview.reviewItems[0].lineNumber, 1);
  assert.deepEqual(result.mergeReview.reviewItems[0].conflictingFields, ['contributors']);
  assert.equal(result.mergedLines.length, 0);
});

test('complementary contributor locales are merged without quarantine', () => {
  const existingRecords = [
    {
      insert: { type: 'misc', id: '53373088', user_id: 'R123456789' },
      merge: {
        paper_title: {
          en: 'Self-Referential Holographic Memory with Denoising Functionality by Deep Learning for Reconstructed Datapages --A Study on Dataset Generation Methods for Deep Learning--',
        },
        publication_name: { ja: 'MMS2024(愛媛)' },
        publication_date: '2024-12-05',
        authors: {
          ja: [
            { name: '江藤優太' },
            { name: '冨岡莉生' },
            { name: '高津太一' },
            { name: '髙林正典' },
          ],
        },
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'misc', user_id: 'R123456789' },
      force: {
        paper_title: {
          en: 'Self-Referential Holographic Memory with Denoising Functionality by Deep Learning for Reconstructed Datapages --A Study on Dataset Generation Methods for Deep Learning--',
        },
        publication_name: { ja: 'MMS2024(愛媛)' },
        publication_date: '2024-12-05',
        authors: {
          en: [
            { name: 'Yuta Eto' },
            { name: 'Rio Tomioka' },
            { name: 'Taichi Takatsu' },
            { name: 'Masanori Takabayashi' },
          ],
        },
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const mergedRecord = result.mergedLines.map((line) => JSON.parse(line))[0];

  assert.equal(result.mergeReview.matchedCount, 1);
  assert.equal(result.mergeReview.reviewItems.length, 0);
  assert.equal(result.quarantineLines.length, 0);
  assert.deepEqual(mergedRecord.merge.authors.ja.map((person) => person.name), [
    '江藤優太',
    '冨岡莉生',
    '高津太一',
    '髙林正典',
  ]);
  assert.deepEqual(mergedRecord.merge.authors.en.map((person) => person.name), [
    'Yuta Eto',
    'Rio Tomioka',
    'Taichi Takatsu',
    'Masanori Takabayashi',
  ]);
});

test('type-mismatched existing records are not merged into generated records', () => {
  const existingRecords = [
    {
      insert: { type: 'presentations', id: '53373069', user_id: 'R123456789' },
      merge: {
        presentation_title: {
          ja: '仮想空間アプリケーションを利用した訪問地の事前体験と高齢化社会への適用',
          en: '仮想空間アプリケーションを利用した訪問地の事前体験と高齢化社会への適用',
        },
        event: { ja: '第25回ASD研究会' },
        publication_date: '2022-12-02',
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'misc', user_id: 'R123456789' },
      force: {
        paper_title: {
          ja: '仮想空間アプリケーションを利用した訪問地の事前体験と高齢化社会への適用',
          en: '仮想空間アプリケーションを利用した訪問地の事前体験と高齢化社会への適用',
        },
        publication_name: { ja: '第25回ASD研究会' },
        publication_date: '2022-12-02',
        misc_type: 'summary_national_conference',
        number: '2022-ASD-25-6',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const quarantinedRecord = result.quarantineLines.map((line) => JSON.parse(line))[0];

  assert.equal(quarantinedRecord.insert.type, 'misc');
  assert.equal(quarantinedRecord.insert.id, undefined);
  assert.equal(quarantinedRecord.force.number, '2022-ASD-25-6');
  assert.equal(result.mergeReview.matchedCount, 0);
  assert.equal(result.mergeReview.typeMismatches.length, 1);
  assert.equal(result.mergeReview.unmatchedGenerated.length, 1);
  assert.equal(result.mergeReview.unmatchedExisting.length, 1);
  assert.equal(result.mergedLines.length, 0);
});

test('merge chooses the correct existing record among similar candidates', () => {
  const existingRecords = [
    {
      insert: { type: 'published_papers', id: '100', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Numerical simulations of neural network hardware based on self-referential holography' },
        publication_name: { en: 'ISOM20' },
        publication_date: '2020-10-03',
        identifiers: { doi: ['10.1000/old'] },
      },
    },
    {
      insert: { type: 'published_papers', id: '101', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Numerical simulations of neural network hardware based on self-referential holography' },
        publication_name: { en: 'ISOM21' },
        publication_date: '2021-10-03',
        identifiers: { doi: ['10.1000/right'] },
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'published_papers', user_id: 'R123456789' },
      force: {
        paper_title: { en: 'Numerical simulations of neural network hardware based on self-referential holography' },
        publication_name: { en: 'ISOM21' },
        publication_date: '2021-10-03',
        identifiers: { doi: ['10.1000/right'] },
        number: 'We-A-02',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const mergedRecords = result.mergedLines.map((line) => JSON.parse(line));
  const matched = mergedRecords.find((record) => record.insert.id === '101');
  const unmatched = mergedRecords.find((record) => record.insert.id === '100');

  assert.equal(matched.merge.number, 'We-A-02');
  assert.equal(unmatched, undefined);
  assert.equal(result.mergeReview.matchedCount, 1);
  assert.equal(result.mergeReview.unmatchedExisting[0].id, '100');
});

test('merge leaves generated record unmatched when multiple existing candidates tie without doi', () => {
  const existingRecords = [
    {
      insert: { type: 'published_papers', id: '200', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Ambiguous Title' },
        publication_name: { en: 'Same Venue' },
        publication_date: '2024-01-01',
      },
    },
    {
      insert: { type: 'published_papers', id: '201', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Ambiguous Title' },
        publication_name: { en: 'Same Venue' },
        publication_date: '2024-01-01',
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'published_papers', user_id: 'R123456789' },
      force: {
        paper_title: { en: 'Ambiguous Title' },
        publication_name: { en: 'Same Venue' },
        publication_date: '2024-01-01',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const quarantinedRecords = result.quarantineLines.map((line) => JSON.parse(line));

  assert.equal(quarantinedRecords[0].insert.id, undefined);
  assert.equal(result.mergeReview.matchedCount, 0);
  assert.equal(result.mergeReview.unmatchedGenerated.length, 1);
  assert.equal(result.mergeReview.unmatchedExisting.length, 2);
  assert.equal(result.mergeReview.reviewItems[0].lineNumber, 1);
  assert.ok(result.mergeReview.reviewItems[0].conflictingFields.includes('id'));
  assert.equal(result.mergedLines.length, 0);
});

test('merge sends secondary locale title differences to review', () => {
  const existingRecords = [
    {
      insert: { type: 'published_papers', id: '210', user_id: 'R123456789' },
      merge: {
        paper_title: { ja: '同じ題名', en: 'Old English Title' },
        publication_name: { ja: '同じ会議', en: 'Same Venue' },
        publication_date: '2024-01-01',
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'published_papers', user_id: 'R123456789' },
      force: {
        paper_title: { ja: '同じ題名', en: 'New English Title' },
        publication_name: { ja: '同じ会議', en: 'Same Venue' },
        publication_date: '2024-01-01',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);

  assert.equal(result.mergeReview.matchedCount, 0);
  assert.equal(result.mergeReview.reviewItems.length, 1);
  assert.equal(result.mergeReview.reviewItems[0].lineNumber, 1);
  assert.equal(result.mergeReview.reviewItems[0].matchStrategy, 'title');
  assert.ok(result.mergeReview.reviewItems[0].conflictingFields.includes('title'));
  assert.equal(result.quarantineLines.length, 1);
});

test('merge sends mismatched non-empty record ids to review even when doi matches', () => {
  const existingRecords = [
    {
      insert: { type: 'published_papers', id: 'A', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Alpha Paper' },
        publication_name: { en: 'Journal A' },
        publication_date: '2024-01-01',
        identifiers: { doi: ['10.1000/alpha'] },
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'published_papers', id: 'B', user_id: 'R123456789' },
      force: {
        paper_title: { en: 'Alpha Paper' },
        publication_name: { en: 'Journal A' },
        publication_date: '2024-01-01',
        identifiers: { doi: ['10.1000/alpha'] },
        volume: '2',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const quarantinedRecord = result.quarantineLines.map((line) => JSON.parse(line))[0];

  assert.equal(result.mergeReview.matchedCount, 0);
  assert.equal(result.mergeReview.reviewItems.length, 1);
  assert.equal(result.mergeReview.reviewItems[0].matchStrategy, 'doi');
  assert.ok(result.mergeReview.reviewItems[0].conflictingFields.includes('id'));
  assert.equal(quarantinedRecord.insert.id, 'B');
  assert.equal(result.mergedLines.length, 0);
});

test('strict match backfills generated id when the existing record is missing one', () => {
  const existingRecords = [
    {
      insert: { type: 'published_papers', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Alpha Paper' },
        publication_name: { en: 'Journal A' },
        publication_date: '2024-01-01',
        identifiers: { doi: ['10.1000/alpha'] },
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'published_papers', id: 'generated-123', user_id: 'R123456789' },
      force: {
        paper_title: { en: 'Alpha Paper' },
        publication_name: { en: 'Journal A' },
        publication_date: '2024-01-01',
        identifiers: { doi: ['10.1000/alpha'] },
        volume: '2',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const mergedRecord = result.mergedLines.map((line) => JSON.parse(line))[0];

  assert.equal(result.mergeReview.matchedCount, 1);
  assert.equal(result.mergeReview.unmatchedGenerated.length, 0);
  assert.equal(mergedRecord.insert.id, 'generated-123');
  assert.equal(mergedRecord.insert.user_id, 'R123456789');
  assert.equal(mergedRecord.merge.volume, '2');
});

test('id-less strict matches keep distinct reservation keys across multiple existing records', () => {
  const existingRecords = [
    {
      insert: { type: 'published_papers', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Alpha Paper' },
        publication_name: { en: 'Journal A' },
        publication_date: '2024-01-01',
        identifiers: { doi: ['10.1000/alpha'] },
      },
    },
    {
      insert: { type: 'published_papers', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Beta Paper' },
        publication_name: { en: 'Journal B' },
        publication_date: '2024-02-01',
        identifiers: { doi: ['10.1000/beta'] },
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'published_papers', id: 'generated-alpha', user_id: 'R123456789' },
      force: {
        paper_title: { en: 'Alpha Paper' },
        publication_name: { en: 'Journal A' },
        publication_date: '2024-01-01',
        identifiers: { doi: ['10.1000/alpha'] },
        volume: '1',
      },
    }),
    JSON.stringify({
      insert: { type: 'published_papers', id: 'generated-beta', user_id: 'R123456789' },
      force: {
        paper_title: { en: 'Beta Paper' },
        publication_name: { en: 'Journal B' },
        publication_date: '2024-02-01',
        identifiers: { doi: ['10.1000/beta'] },
        volume: '2',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const mergedRecords = result.mergedLines.map((line) => JSON.parse(line));

  assert.equal(result.mergeReview.matchedCount, 2);
  assert.equal(result.mergeReview.unmatchedExisting.length, 0);
  assert.equal(result.mergeReview.unmatchedGenerated.length, 0);
  assert.deepEqual(
    mergedRecords.map((record) => record.insert.id).sort(),
    ['generated-alpha', 'generated-beta']
  );
  assert.deepEqual(
    mergedRecords.map((record) => record.merge.volume).sort(),
    ['1', '2']
  );
});

test('strict match sends bibliographic core field differences to review', () => {
  const existingRecords = [
    {
      insert: { type: 'published_papers', id: '700', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Core Field Paper' },
        publication_name: { en: 'Journal Core' },
        publication_date: '2024-06-01',
        identifiers: { doi: ['10.1000/core-field'] },
        volume: '31',
        number: '1',
        starting_page: '1',
        ending_page: '10',
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'published_papers', user_id: 'R123456789' },
      force: {
        paper_title: { en: 'Core Field Paper' },
        publication_name: { en: 'Journal Core' },
        publication_date: '2024-06-01',
        identifiers: { doi: ['10.1000/core-field'] },
        volume: '32',
        number: '2',
        starting_page: '11',
        ending_page: '20',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);

  assert.equal(result.mergeReview.matchedCount, 0);
  assert.equal(result.mergeReview.reviewItems.length, 1);
  assert.equal(result.mergeReview.reviewItems[0].matchStrategy, 'doi');
  assert.deepEqual(result.mergeReview.reviewItems[0].conflictingFields, [
    'volume',
    'number',
    'starting_page',
    'ending_page',
  ]);
  assert.equal(result.quarantineLines.length, 1);
  assert.equal(result.mergedLines.length, 0);
});

test('strict match sends presentation core field differences to review', () => {
  const existingRecords = [
    {
      insert: { type: 'presentations', id: '701', user_id: 'R123456789' },
      merge: {
        presentation_title: { en: 'Core Field Talk' },
        event: { en: 'Core Conference' },
        publication_date: '2025-03-01',
        from_event_date: '2025-03-01',
        to_event_date: '2025-03-01',
        identifiers: { doi: ['10.1000/presentation-core'] },
        location: { en: 'Room A' },
        description: { en: 'Old abstract' },
        referee: false,
        invited: false,
        published_paper_owner_roles: ['lead'],
        is_international_presentation: false,
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'presentations', user_id: 'R123456789' },
      force: {
        presentation_title: { en: 'Core Field Talk' },
        event: { en: 'Core Conference' },
        publication_date: '2025-03-01',
        from_event_date: '2025-03-02',
        to_event_date: '2025-03-02',
        identifiers: { doi: ['10.1000/presentation-core'] },
        location: { en: 'Room B' },
        description: { en: 'New abstract' },
        referee: true,
        invited: true,
        published_paper_owner_roles: ['coauthor'],
        is_international_presentation: true,
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);

  assert.equal(result.mergeReview.matchedCount, 0);
  assert.equal(result.mergeReview.reviewItems.length, 1);
  assert.equal(result.mergeReview.reviewItems[0].matchStrategy, 'doi');
  assert.deepEqual(result.mergeReview.reviewItems[0].conflictingFields, [
    'from_event_date',
    'to_event_date',
    'location',
    'description',
    'referee',
    'invited',
    'published_paper_owner_roles',
    'is_international_presentation',
  ]);
  assert.equal(result.quarantineLines.length, 1);
  assert.equal(result.mergedLines.length, 0);
});

test('strict match keeps complementary locale location and description changes out of review', () => {
  const existingRecords = [
    {
      insert: { type: 'presentations', id: '702', user_id: 'R123456789' },
      merge: {
        presentation_title: { en: 'Locale-Friendly Talk' },
        event: { en: 'Locale Conference' },
        publication_date: '2025-04-01',
        identifiers: { doi: ['10.1000/presentation-locale'] },
        location: { en: 'Room A' },
        description: { ja: '既存抄録' },
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'presentations', user_id: 'R123456789' },
      force: {
        presentation_title: { en: 'Locale-Friendly Talk' },
        event: { en: 'Locale Conference' },
        publication_date: '2025-04-01',
        identifiers: { doi: ['10.1000/presentation-locale'] },
        location: { ja: '会場A' },
        description: { en: 'New abstract' },
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const mergedRecord = result.mergedLines.map((line) => JSON.parse(line))[0];

  assert.equal(result.mergeReview.matchedCount, 1);
  assert.equal(result.mergeReview.reviewItems.length, 0);
  assert.equal(result.quarantineLines.length, 0);
  assert.deepEqual(mergedRecord.merge.location, { en: 'Room A', ja: '会場A' });
  assert.deepEqual(mergedRecord.merge.description, { ja: '既存抄録', en: 'New abstract' });
});

test('strict match quarantines same locale location and description differences', () => {
  const existingRecords = [
    {
      insert: { type: 'presentations', id: '703', user_id: 'R123456789' },
      merge: {
        presentation_title: { en: 'Locale Conflict Talk' },
        event: { en: 'Locale Conference' },
        publication_date: '2025-04-02',
        identifiers: { doi: ['10.1000/presentation-locale-conflict'] },
        location: { en: 'Room A', ja: '会場A' },
        description: { en: 'Old abstract' },
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'presentations', user_id: 'R123456789' },
      force: {
        presentation_title: { en: 'Locale Conflict Talk' },
        event: { en: 'Locale Conference' },
        publication_date: '2025-04-02',
        identifiers: { doi: ['10.1000/presentation-locale-conflict'] },
        location: { en: 'Room B', ja: '会場A' },
        description: { en: 'New abstract' },
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const reviewItem = result.mergeReview.reviewItems[0];
  const quarantinedRecord = result.quarantineLines.map((line) => JSON.parse(line))[0];

  assert.equal(result.mergeReview.matchedCount, 0);
  assert.equal(result.mergeReview.reviewItems.length, 1);
  assert.equal(reviewItem.matchStrategy, 'doi');
  assert.ok(reviewItem.conflictingFields.includes('location'));
  assert.ok(reviewItem.conflictingFields.includes('description'));
  assert.equal(quarantinedRecord.insert.id, undefined);
  assert.equal(result.mergedLines.length, 0);
});

test('merge sends venue promoter and address country differences to review', () => {
  const existingRecords = [
    {
      insert: { type: 'presentations', id: '220', user_id: 'R123456789' },
      merge: {
        presentation_title: { ja: '会場付き発表' },
        event: { ja: '研究会' },
        promoter: { ja: '主催者A' },
        address_country: 'JP',
        publication_date: '2025-02-03',
        from_event_date: '2025-02-03',
        to_event_date: '2025-02-03',
        presentation_type: 'oral_presentation',
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'presentations', id: '220', user_id: 'R123456789' },
      force: {
        presentation_title: { ja: '会場付き発表' },
        event: { ja: '研究会' },
        promoter: { ja: '主催者B' },
        address_country: 'US',
        publication_date: '2025-02-03',
        from_event_date: '2025-02-03',
        to_event_date: '2025-02-03',
        presentation_type: 'oral_presentation',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);

  assert.equal(result.mergeReview.matchedCount, 0);
  assert.equal(result.mergeReview.reviewItems.length, 1);
  assert.equal(result.mergeReview.reviewItems[0].lineNumber, 1);
  assert.ok(result.mergeReview.reviewItems[0].conflictingFields.includes('venue.promoter'));
  assert.ok(result.mergeReview.reviewItems[0].conflictingFields.includes('venue.address_country'));
  assert.equal(result.quarantineLines.length, 1);
});

test('reviewed existing record is not auto-merged by a later generated line', () => {
  const existingRecords = [
    {
      insert: { type: 'presentations', id: '230', user_id: 'R123456789' },
      merge: {
        presentation_title: { ja: '会場付き発表' },
        event: { ja: '研究会' },
        promoter: { ja: '主催者A' },
        address_country: 'JP',
        publication_date: '2025-02-03',
        from_event_date: '2025-02-03',
        to_event_date: '2025-02-03',
        presentation_type: 'oral_presentation',
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'presentations', id: '230', user_id: 'R123456789' },
      force: {
        presentation_title: { ja: '会場付き発表' },
        event: { ja: '研究会' },
        promoter: { ja: '主催者B' },
        address_country: 'JP',
        publication_date: '2025-02-03',
        from_event_date: '2025-02-03',
        to_event_date: '2025-02-03',
        presentation_type: 'oral_presentation',
      },
    }),
    JSON.stringify({
      insert: { type: 'presentations', user_id: 'R123456789' },
      force: {
        presentation_title: { ja: '会場付き発表' },
        event: { ja: '研究会' },
        promoter: { ja: '主催者A' },
        address_country: 'JP',
        publication_date: '2025-02-03',
        from_event_date: '2025-02-03',
        to_event_date: '2025-02-03',
        presentation_type: 'oral_presentation',
        number: 'second-line',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const secondRecord = result.quarantineLines
    .map((line) => JSON.parse(line))
    .find((record) => record.force?.number === 'second-line');

  assert.equal(result.mergeReview.matchedCount, 0);
  assert.equal(result.mergeReview.reviewItems.length, 2);
  assert.equal(result.mergeReview.reviewItems[0].lineNumber, 1);
  assert.equal(result.mergeReview.reviewItems[1].lineNumber, 2);
  assert.equal(result.mergeReview.unmatchedGenerated.length, 2);
  assert.equal(result.quarantineLines.length, 2);
  assert.equal(result.mergedLines.length, 0);
  assert.equal(secondRecord.insert.id, undefined);
});

test('fullwidth and dash variants still match the existing record safely', () => {
  const existingRecords = [
    {
      insert: { type: 'misc', id: '240', user_id: 'R123456789' },
      merge: {
        paper_title: { ja: 'A-B' },
        publication_name: { ja: '研究会' },
        publication_date: '2025-02-03',
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'misc', user_id: 'R123456789' },
      force: {
        paper_title: { ja: 'Ａ−Ｂ' },
        publication_name: { ja: '研究会' },
        publication_date: '2025-02-03',
        number: 'normalized-match',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const mergedRecord = result.mergedLines.map((line) => JSON.parse(line))[0];

  assert.equal(result.mergeReview.matchedCount, 1);
  assert.equal(result.quarantineLines.length, 0);
  assert.equal(mergedRecord.insert.id, '240');
  assert.equal(mergedRecord.merge.number, 'normalized-match');
});

test('merge prefers the best metadata match among several doi-less nearby candidates', () => {
  const existingRecords = [
    {
      insert: { type: 'published_papers', id: '300', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Nearby Title' },
        publication_name: { en: 'Venue A' },
        publication_date: '2024-01-02',
      },
    },
    {
      insert: { type: 'published_papers', id: '301', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Nearby Title' },
        publication_name: { en: 'Venue B' },
        publication_date: '2024-01-01',
      },
    },
    {
      insert: { type: 'published_papers', id: '302', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Nearby Title' },
        publication_name: { en: 'Venue A' },
        publication_date: '2024-01-01',
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'published_papers', user_id: 'R123456789' },
      force: {
        paper_title: { en: 'Nearby Title' },
        publication_name: { en: 'Venue A' },
        publication_date: '2024-01-01',
        number: 'X-1',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const matched = result.mergedLines.map((line) => JSON.parse(line))[0];

  assert.equal(matched.insert.id, '302');
  assert.equal(matched.merge.number, 'X-1');
  assert.equal(result.mergeReview.unmatchedExisting.length, 2);
});

test('merge leaves generated record unmatched when near-threshold doi-less candidates remain ambiguous', () => {
  const existingRecords = [
    {
      insert: { type: 'published_papers', id: '400', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Threshold Title' },
        publication_name: { en: 'Venue A' },
        publication_date: '2024-01-01',
      },
    },
    {
      insert: { type: 'published_papers', id: '401', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Threshold Title' },
        publication_name: { en: 'Venue A' },
        publication_date: '2024-01-01',
      },
    },
    {
      insert: { type: 'published_papers', id: '402', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Threshold Title' },
        publication_name: { en: 'Venue B' },
        publication_date: '2024-01-02',
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'published_papers', user_id: 'R123456789' },
      force: {
        paper_title: { en: 'Threshold Title' },
        publication_name: { en: 'Venue A' },
        publication_date: '2024-01-01',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);

  assert.equal(result.mergeReview.matchedCount, 0);
  assert.equal(result.mergeReview.unmatchedGenerated.length, 1);
  assert.equal(result.mergeReview.unmatchedExisting.length, 3);
});

test('merge leaves generated record unmatched when score stays below threshold', () => {
  const existingRecords = [
    {
      insert: { type: 'published_papers', id: '500', user_id: 'R123456789' },
      merge: {
        paper_title: { en: 'Different Title' },
        publication_name: { en: 'Far Venue' },
        publication_date: '2020-01-01',
      },
    },
  ];

  const generatedImportLines = [
    JSON.stringify({
      insert: { type: 'published_papers', user_id: 'R123456789' },
      force: {
        paper_title: { en: 'Threshold Title' },
        publication_name: { en: 'Venue A' },
        publication_date: '2024-01-01',
      },
    }),
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const mergedRecord = result.mergedLines.map((line) => JSON.parse(line))[0];

  assert.equal(mergedRecord.insert.id, undefined);
  assert.equal(result.mergeReview.matchedCount, 0);
  assert.equal(result.mergeReview.unmatchedGenerated.length, 1);
  assert.equal(result.mergeReview.unmatchedExisting.length, 1);
});

test('merge matches the full master dataset one-to-one against equivalent existing records', () => {
  const masterPath = path.join(repoRoot, 'src/data/publication_master.json');
  const { records } = loadMasterPublications(masterPath);
  const generatedImportLines = generateResearchmapExport(records, { researchmapUserId: 'R123456789' }).importLines;
  const existingPublicationRecords = generatedImportLines.map((line, index) => {
    const record = JSON.parse(line);
    const generatedId = record.insert.id;
    const payload = record.force || record.merge || {};
    return {
      insert: {
        type: record.insert.type,
        id: generatedId || `existing-${index + 1}`,
        user_id: 'R123456789',
      },
      merge: {
        ...payload,
        internal_note: `manual-${index + 1}`,
      },
    };
  });
  const existingRecords = [
    {
      insert: { type: 'researchers', id: 'R123456789' },
      merge: { permalink: 'sample-researcher' },
    },
    ...existingPublicationRecords,
  ];

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const mergedRecords = result.mergedLines.map((line) => JSON.parse(line));
  const mergedPublicationRecords = mergedRecords.filter((record) => record.insert?.type !== 'researchers');

  assert.equal(result.mergeReview.matchedCount, generatedImportLines.length);
  assert.equal(result.mergeReview.unmatchedGenerated.length, 0);
  assert.equal(result.mergeReview.unmatchedExisting.length, 0);
  assert.equal(mergedPublicationRecords.length, generatedImportLines.length);
  assert.ok(
    mergedPublicationRecords.every((record, index) => {
      const generatedRecord = JSON.parse(generatedImportLines[index]);
      const expectedId = generatedRecord.insert.id || `existing-${index + 1}`;
      return record.insert.id === expectedId && record.merge.internal_note === `manual-${index + 1}`;
    })
  );
});

test('merge matches the current researchmap export against the full generated master dataset', () => {
  const masterPath = path.join(repoRoot, 'src/data/publication_master.json');
  const existingJsonlPath = path.join(repoRoot, 'tmp/researchmap/rm_researchers20260416.jsonl');
  if (!fs.existsSync(existingJsonlPath)) return;

  const { records } = loadMasterPublications(masterPath);
  const generatedImportLines = generateResearchmapExport(records, { researchmapUserId: 'R123456789' }).importLines;
  const existingRecords = fs
    .readFileSync(existingJsonlPath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const result = mergeWithExistingResearchmapExport(existingRecords, generatedImportLines);
  const mergedPublicationRecords = result.mergedLines
    .map((line) => JSON.parse(line))
    .filter((record) => ['published_papers', 'misc', 'presentations'].includes(record.insert?.type));

  assert.equal(result.mergeReview.matchedCount, generatedImportLines.length);
  assert.equal(result.mergeReview.unmatchedGenerated.length, 0);
  assert.equal(result.mergeReview.unmatchedExisting.length, 0);
  assert.equal(result.mergeReview.typeMismatches.length, 0);
  assert.ok(mergedPublicationRecords.every((record) => Boolean(record.insert?.id)));
});
