import { createPublications } from '../factories/publicationFactory';

// 共通で使用する Publication のモックデータセット
export const mockPublications = createPublications(5, [
  // Publication 1 (Journal, 2023)
  {
    name: 'Journal Paper A',
    type: 'published_papers/scientific_journal',
    date: '2023年10月1日',
    sortableDate: '20231001',
    authorship: ['lead', 'corresponding'],
    review: 'peer_reviewed',
  },
  // Publication 2 (International Conference, 2022)
  {
    name: 'Intl Conf Paper B',
    type: 'published_papers/international_conference_proceedings',
    date: '2022年5月15日',
    sortableDate: '20220515',
    authorship: ['coauthor'],
    review: 'peer_reviewed',
  },
  // Publication 3 (Invited, 2023)
  {
    name: 'Invited Talk C',
    type: 'misc/introduction_scientific_journal',
    date: '2023年3月10日',
    sortableDate: '20230310',
    authorship: ['lead'],
    review: 'N/A',
  },
  // Publication 4 (Domestic Conference, 2022)
  {
    name: 'Domestic Conf Paper D',
    type: 'misc/summary_national_conference',
    date: '2022年11月20日',
    sortableDate: '20221120',
    authorship: ['corresponding'],
    review: 'N/A', // 国内会議は査読なしの場合もある
  },
  // Publication 5 (Journal, 2022) - 著者複数
  {
    name: 'Journal Paper E',
    type: 'published_papers/scientific_journal',
    date: '2022年8月5日',
    sortableDate: '20220805',
    authorship: ['coauthor', 'corresponding'],
    review: 'peer_reviewed',
  },
]);
