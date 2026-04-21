import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'url';
import { generateResearchmapExport } from '../src/researchmapExport.mjs';
import {
  reconstructedCitationFingerprint,
  importComparableFingerprint,
  sourceComparableFingerprint,
  sourceCitationFingerprint,
  decomposeCitation,
  extractSourceTitleVenue,
  reconstructCitationFromImportLine,
} from '../src/researchmapCitationRoundTrip.mjs';
import { loadMasterPublications } from '../src/masterToPublications.mjs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');

const samplePublications = [
  {
    id: 1,
    hasEmptyFields: false,
    name: 'Rio Tomioka and Masanori Takabayashi, "Numerical simulations on optoelectronic deep neural network hardware", Optical Review, vol. 30 (Apr. 2023).',
    japanese: '',
    abstract: 'We propose a novel optoelectronic deep neural network.',
    type: 'Journal paper：原著論文',
    review: 'Reviewed',
    authorship: 'Lead author,Corresponding author',
    presentationType: '',
    doi: '10.1007/test',
    webLink: 'https://doi.org/10.1007/test',
    date: '2023年4月28日',
    others: '',
    site: '',
    journalConference: 'Optical Review',
    startDate: '2023-04-28',
    endDate: '2023-04-28',
    sortableDate: '2023-04-28',
  },
  {
    id: 2,
    hasEmptyFields: false,
    name: '冨岡莉生, "自己参照型ホログラフィの原理に基づく光電子融合型ニューラルネットワークハードウェア", 第２回光ニューロワークショップ, 2023年3月.',
    japanese: '',
    abstract: '',
    type: 'Miscellaneous',
    review: 'Not  reviewed',
    authorship: 'Lead author',
    presentationType: 'Oral',
    doi: '',
    webLink: 'https://example.com/presentation',
    date: '2023年3月13日 → 2023年3月14日',
    others: '',
    site: '九州大学伊都ゲストハウス 多目的ホール, Fukuoka, Japan',
    journalConference: '第２回光ニューロワークショップ',
    startDate: '2023-03-13',
    endDate: '2023-03-14',
    sortableDate: '2023-03-13',
  },
  {
    id: 3,
    hasEmptyFields: true,
    name: 'Rio Tomioka and Masanori Takabayashi, "Numerical simulation of deep reinforcement learning using self-referential holographic deep neural network", International Workshop on Holography and Related Technologies 2024, S5-2, 2pages (Dec. 2024).',
    japanese: '',
    abstract: '',
    type: 'Research paper (international conference)：国際会議',
    review: '',
    authorship: 'Lead author',
    presentationType: 'Oral',
    doi: '',
    webLink: 'https://example.com/iwh',
    date: '2024年12月10日 → 2024年12月12日',
    others: '',
    site: 'Ala Moana Hotel, Honolulu, Hawaii, USA',
    journalConference: 'IWH2024',
    startDate: '2024-12-10',
    endDate: '2024-12-12',
    sortableDate: '2024-12-10',
  },
];

test('journal papers map to published_papers', () => {
  const result = generateResearchmapExport(samplePublications, { researchmapUserId: 'R123456789' });
  const firstLine = JSON.parse(result.importLines[0]);
  assert.deepEqual(firstLine.insert, { type: 'published_papers', user_id: 'R123456789' });
  assert.equal(firstLine.force.paper_title.en, 'Numerical simulations on optoelectronic deep neural network hardware');
});

test('manual rules classify opt-neuro workshop as presentations', () => {
  const result = generateResearchmapExport(samplePublications);
  const secondLine = JSON.parse(result.importLines[1]);
  assert.equal(secondLine.insert.type, 'presentations');
  assert.equal(secondLine.force.presentation_type, 'oral_presentation');
  assert.equal(result.manualReviewItems.length, 3);
});

test('ASD and welfare workshop proceedings are exported as misc with bibliographic details', () => {
  const result = generateResearchmapExport(
    [
      {
        id: 107,
        hasEmptyFields: false,
        name: '山崎駆, 山口健太, 冨岡莉生, 梶谷柊, 高津太一, 根崎翔, 井上快斗, 岸田隆之, 井上創造, 柴田智広, "仮想空間アプリケーションを利用した訪問地の事前体験と高齢化社会への適用", 第25回ASD研究会, 2022-ASD-25-6, 4pages, 2022年12月.',
        japanese: '',
        abstract: '',
        type: 'Research paper (domestic conference)：国内会議',
        review: 'Not  reviewed',
        authorship: 'Co-author',
        presentationType: 'Oral',
        doi: '',
        webLink: 'http://sigasd.ipsj.or.jp/?p=1574',
        date: '2022年12月2日',
        others: '',
        site: '',
        journalConference: '第25回ASD研究会',
        startDate: '2022-12-02',
        endDate: '2022-12-02',
        sortableDate: '2022-12-02',
      },
      {
        id: 108,
        hasEmptyFields: false,
        name: '山崎駆, 山口健太, 冨岡莉生, 梶谷柊, 高津太一, 根崎翔, 井上快斗, 岸田隆之, 井上創造, 柴田智広, "訪問地事前体験のための仮想空間アプリケーションの開発及び実証実験", 第7回福祉工学会九州支部大会, P1-3, pp.30-31, 2022年12月.',
        japanese: '',
        abstract: '',
        type: 'Research paper (domestic conference)：国内会議',
        review: 'Not  reviewed',
        authorship: 'Co-author',
        presentationType: 'Oral',
        doi: '',
        webLink: 'http://www.jswe.jp/division/kyushu/2022/entry.html',
        date: '2022年12月10日',
        others: '',
        site: '',
        journalConference: '第7回福祉工学会九州支部大会',
        startDate: '2022-12-10',
        endDate: '2022-12-10',
        sortableDate: '2022-12-10',
      },
    ],
    { researchmapUserId: 'R123456789' }
  );
  const [asd, welfare] = result.importLines.map(JSON.parse);

  assert.equal(asd.insert.type, 'misc');
  assert.equal(asd.force.misc_type, 'summary_national_conference');
  assert.equal(asd.force.number, '2022-ASD-25-6');
  assert.equal(asd.force.starting_page, undefined);
  assert.equal(asd.force.ending_page, undefined);

  assert.equal(welfare.insert.type, 'misc');
  assert.equal(welfare.force.misc_type, 'summary_national_conference');
  assert.equal(welfare.force.number, 'P1-3');
  assert.equal(welfare.force.starting_page, '30');
  assert.equal(welfare.force.ending_page, '31');
});

test('IWH is exported as peer-reviewed international conference proceedings even when review is blank', () => {
  const result = generateResearchmapExport(samplePublications, { researchmapUserId: 'R123456789' });
  const thirdLine = JSON.parse(result.importLines[2]);
  assert.equal(thirdLine.insert.type, 'published_papers');
  assert.equal(thirdLine.force.published_paper_type, 'international_conference_proceedings');
  assert.equal(thirdLine.force.referee, true);
  assert.equal(thirdLine.force.invited, false);
});

test('Optical Review stays non-invited', () => {
  const result = generateResearchmapExport(samplePublications, { researchmapUserId: 'R123456789' });
  const firstLine = JSON.parse(result.importLines[0]);
  assert.equal(firstLine.force.invited, false);
  assert.equal(firstLine.force.is_international_journal, true);
});

test('bibliographic fields are extracted when available', () => {
  const result = generateResearchmapExport(samplePublications, { researchmapUserId: 'R123456789' });
  const firstLine = JSON.parse(result.importLines[0]);
  assert.equal(firstLine.force.volume, '30');
});

test('compact journal citations map volume and pages without fabricating issue number', () => {
  const result = generateResearchmapExport(
    [
      {
        id: 99,
        hasEmptyFields: false,
        name: 'Yuta Eto, Rio Tomioka, Taichi Takatsu and Masanori Takabayashi, "Numerical simulations on self-referential holographic data storage with built-in denoising function by self-referential holographic deep neural network," Optical Review 32, 534–545 (2025).',
        japanese: '',
        abstract: '',
        type: 'Journal paper：原著論文',
        review: 'Reviewed',
        authorship: 'Co-author',
        presentationType: '',
        doi: '10.1007/s10043-025-00978-9',
        webLink: 'https://doi.org/10.1007/s10043-025-00978-9',
        date: '2025年6月21日',
        others: '',
        site: '',
        journalConference: 'Optical Review',
        startDate: '2025-06-21',
        endDate: '2025-06-21',
        sortableDate: '2025-06-21',
      },
    ],
    { researchmapUserId: 'R123456789' }
  );
  const line = JSON.parse(result.importLines[0]);
  assert.equal(line.force.volume, '32');
  assert.equal(line.force.starting_page, '534');
  assert.equal(line.force.ending_page, '545');
  assert.equal(line.force.number, undefined);
});

test('conference presentation codes are not treated as page ranges', () => {
  const result = generateResearchmapExport(
    [
      {
        id: 100,
        hasEmptyFields: false,
        name: 'Rio Tomioka, "Numerical Simulation of Output Filter Design for Optoelectronic Deep Neural Network Using Hyperparameter Optimization", Program and Abstracts The 6th International Symposium on Neuromorphic AI Hardware, P1-21, p. 39 (2025)',
        japanese: '',
        abstract: '',
        type: 'Research paper (international conference)：国際会議',
        review: 'Reviewed',
        authorship: 'Lead author',
        presentationType: 'Poster',
        doi: '',
        webLink: 'https://example.com/program',
        date: '2025年3月3日',
        others: '',
        site: '',
        journalConference: 'the 6th International Symposium on Neuromorphic AI Hardware',
        startDate: '2025-03-03',
        endDate: '2025-03-03',
        sortableDate: '2025-03-03',
      },
    ],
    { researchmapUserId: 'R123456789' }
  );
  const line = JSON.parse(result.importLines[0]);
  assert.equal(line.force.starting_page, '39');
  assert.equal(line.force.ending_page, '39');
});

test('international conference paper codes are exported as number when available', () => {
  const result = generateResearchmapExport(
    [
      {
        id: 101,
        hasEmptyFields: false,
        name: 'Rio Tomioka and Masanori Takabayashi, "Numerical simulations of neural network hardware based on self-referential holography," International Symposium on Imaging, Sensing, and Optical Memory (ISOM’21) Technical Digest, We-A-02, pp.123-124 (Oct. 2021).',
        japanese: '',
        abstract: '',
        type: 'Research paper (international conference)：国際会議',
        review: 'Reviewed',
        authorship: 'Lead author',
        presentationType: 'Oral',
        doi: '',
        webLink: 'https://example.com/isom21',
        date: '2021年10月3日',
        others: '',
        site: '',
        journalConference: 'ISOM21',
        startDate: '2021-10-03',
        endDate: '2021-10-03',
        sortableDate: '2021-10-03',
      },
      {
        id: 102,
        hasEmptyFields: false,
        name: 'Rio Tomioka and Masanori Takabayashi, "Dependence of activation function on image recognition accuracy in self-referential holographic deep neural network," in Proceedings of the 2022 International Symposium on Imaging, Sensing, and Optical Memory (ISOM) and the 13th International Conference on Optics-photonics Design and Fabrication (ODF), Technical Digest Series (Optica Publishing Group, 2022), paper ITuPJ_01, 2pages (Jul. 2022).',
        japanese: '',
        abstract: '',
        type: 'Research paper (international conference)：国際会議',
        review: 'Reviewed',
        authorship: 'Lead author',
        presentationType: 'Oral',
        doi: '',
        webLink: 'https://example.com/isom2022',
        date: '2022年7月31日',
        others: '',
        site: '',
        journalConference: 'ISOM2022',
        startDate: '2022-07-31',
        endDate: '2022-07-31',
        sortableDate: '2022-07-31',
      },
    ],
    { researchmapUserId: 'R123456789' }
  );
  const lines = result.importLines.map(JSON.parse);
  assert.equal(lines[0].force.number, 'We-A-02');
  assert.equal(lines[0].force.starting_page, '123');
  assert.equal(lines[0].force.ending_page, '124');
  assert.equal(lines[1].force.number, 'ITuPJ_01');
});

test('round-trip citation stays comparable for journal papers', () => {
  const publication = {
    id: 103,
    hasEmptyFields: false,
    name: 'Yuta Eto, Rio Tomioka, Taichi Takatsu and Masanori Takabayashi, "Numerical simulations on self-referential holographic data storage with built-in denoising function by self-referential holographic deep neural network," Optical Review 32, 534–545 (2025).',
    japanese: '',
    abstract: '',
    type: 'Journal paper：原著論文',
    review: 'Reviewed',
    authorship: 'Co-author',
    presentationType: '',
    doi: '10.1007/s10043-025-00978-9',
    webLink: 'https://doi.org/10.1007/s10043-025-00978-9',
    date: '2025年6月21日',
    others: '',
    site: '',
    journalConference: 'Optical Review',
    startDate: '2025-06-21',
    endDate: '2025-06-21',
    sortableDate: '2025-06-21',
  };
  const result = generateResearchmapExport([publication], { researchmapUserId: 'R123456789' });
  assert.equal(reconstructedCitationFingerprint(result.importLines[0]), sourceCitationFingerprint(publication));
});

test('round-trip citation stays comparable for international conference papers', () => {
  const publication = {
    id: 104,
    hasEmptyFields: false,
    name: 'Rio Tomioka and Masanori Takabayashi, "Numerical simulations of neural network hardware based on self-referential holography," International Symposium on Imaging, Sensing, and Optical Memory (ISOM’21) Technical Digest, We-A-02, pp.123-124 (Oct. 2021).',
    japanese: '',
    abstract: '',
    type: 'Research paper (international conference)：国際会議',
    review: 'Reviewed',
    authorship: 'Lead author',
    presentationType: 'Oral',
    doi: '',
    webLink: 'https://example.com/isom21',
    date: '2021年10月3日',
    others: '',
    site: '',
    journalConference: 'ISOM21',
    startDate: '2021-10-03',
    endDate: '2021-10-03',
    sortableDate: '2021-10-03',
  };
  const result = generateResearchmapExport([publication], { researchmapUserId: 'R123456789' });
  assert.equal(reconstructedCitationFingerprint(result.importLines[0]), sourceCitationFingerprint(publication));
});

test('round-trip citation preserves japanese title and venue decomposition', () => {
  const publication = {
    id: 105,
    hasEmptyFields: false,
    name: '冨岡莉生, "自己参照型ホログラフィの原理に基づく光電子融合型ニューラルネットワークハードウェア", 第２回光ニューロワークショップ, 2023年3月.',
    japanese: '',
    abstract: '',
    type: 'Miscellaneous',
    review: 'Not  reviewed',
    authorship: 'Lead author',
    presentationType: 'Oral',
    doi: '',
    webLink: 'https://example.com/presentation',
    date: '2023年3月13日 → 2023年3月14日',
    others: '',
    site: '九州大学伊都ゲストハウス 多目的ホール, Fukuoka, Japan',
    journalConference: '第２回光ニューロワークショップ',
    startDate: '2023-03-13',
    endDate: '2023-03-14',
    sortableDate: '2023-03-13',
  };
  const result = generateResearchmapExport([publication], { researchmapUserId: 'R123456789' });
  assert.equal(reconstructedCitationFingerprint(result.importLines[0]), sourceCitationFingerprint(publication));
});

test('records with japanese titles use jpn language even when english fallback is populated', () => {
  const publication = {
    id: 106,
    hasEmptyFields: false,
    name: '冨岡莉生, "自己参照型ホログラフィの原理に基づく光電子融合型ニューラルネットワークハードウェア", 第２回光ニューロワークショップ, 2023年3月.',
    japanese: '',
    abstract: '',
    type: 'Miscellaneous',
    review: 'Not  reviewed',
    authorship: 'Lead author',
    presentationType: 'Oral',
    doi: '',
    webLink: 'https://example.com/presentation',
    date: '2023年3月13日 → 2023年3月14日',
    others: '',
    site: '九州大学伊都ゲストハウス 多目的ホール, Fukuoka, Japan',
    journalConference: '第２回光ニューロワークショップ',
    startDate: '2023-03-13',
    endDate: '2023-03-14',
    sortableDate: '2023-03-13',
  };
  const result = generateResearchmapExport([publication], { researchmapUserId: 'R123456789' });
  const record = JSON.parse(result.importLines[0]);

  assert.deepEqual(record.force.languages, ['jpn']);
  assert.equal(record.force.presentation_title.ja, '自己参照型ホログラフィの原理に基づく光電子融合型ニューラルネットワークハードウェア');
  assert.equal(record.force.presentation_title.en, '自己参照型ホログラフィの原理に基づく光電子融合型ニューラルネットワークハードウェア');
});

test('round-trip citation preserves title and venue across the full dataset', () => {
  const masterPath = path.join(repoRoot, 'src/data/publication_master.json');
  const sourceMetadata = loadMasterPublications(masterPath);
  const result = generateResearchmapExport(sourceMetadata.records, { researchmapUserId: 'R123456789' });

  assert.ok(
    result.importLines.every((line, index) => {
      const reconstructed = decomposeCitation(reconstructCitationFromImportLine(line));
      const source = extractSourceTitleVenue(sourceMetadata.publications[index]);
      return reconstructed.title === source.title && reconstructed.venue === source.venue;
    })
  );
});

test('master-based full dataset export keeps title, venue, doi, and publication count aligned', () => {
  const masterPath = path.join(repoRoot, 'src/data/publication_master.json');
  const sourceMetadata = loadMasterPublications(masterPath);
  const result = generateResearchmapExport(sourceMetadata.records, { researchmapUserId: 'R123456789' });

  assert.equal(result.importLines.length, sourceMetadata.publications.length);
  assert.ok(
    result.importLines.every((line, index) => {
      const record = JSON.parse(line);
      const payload = record.force || record.merge || {};
      const source = sourceMetadata.publications[index];
      const payloadDoi = payload.identifiers?.doi?.[0] || '';
      const sourceDoi = (source.doi || '').replace(/^https?:\/\/doi\.org\//i, '');
      const reconstructed = decomposeCitation(reconstructCitationFromImportLine(line));
      return (
        reconstructed.title === extractSourceTitleVenue(source).title &&
        reconstructed.venue === extractSourceTitleVenue(source).venue &&
        payload.publication_date === source.startDate &&
        (!sourceDoi || payloadDoi === sourceDoi)
      );
    })
  );
});
