import { createPublications } from '../factories/publicationFactory';

// 共通で使用する Publication のモックデータセット
export const mockPublications = createPublications(5, [
  // Publication 1 (Journal, 2023)
  {
    name: 'Journal Paper A',
    type: 'Journal paper：原著論文',
    date: '2023年10月1日',
    sortableDate: '20231001',
    authorship: ['First author', 'Corresponding author'],
    review: 'Peer-reviewed',
  },
  // Publication 2 (International Conference, 2022)
  {
    name: 'Intl Conf Paper B',
    type: 'Research paper (international conference)：国際会議',
    date: '2022年5月15日',
    sortableDate: '20220515',
    authorship: ['Co-author'],
    presentationType: 'Poster',
    review: 'Peer-reviewed',
  },
  // Publication 3 (Invited, 2023)
  {
    name: 'Invited Talk C',
    type: 'Invited paper：招待論文',
    date: '2023年3月10日',
    sortableDate: '20230310',
    authorship: ['First author'],
    review: 'N/A',
  },
  // Publication 4 (Domestic Conference, 2022)
  {
    name: 'Domestic Conf Paper D',
    type: 'Research paper (domestic conference)：国内会議',
    date: '2022年11月20日',
    sortableDate: '20221120',
    authorship: ['Corresponding author'],
    presentationType: 'Oral',
    review: 'N/A', // 国内会議は査読なしの場合もある
  },
  // Publication 5 (Journal, 2022) - 著者複数
  {
    name: 'Journal Paper E',
    type: 'Journal paper：原著論文',
    date: '2022年8月5日',
    sortableDate: '20220805',
    authorship: ['Co-author', 'Corresponding author'],
    review: 'Peer-reviewed',
  },
]);