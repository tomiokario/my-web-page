import { renderHook } from '@testing-library/react';
import usePublications from '../hooks/usePublications';
import { createPublication } from '../test-utils/factories/publicationFactory'; // createPublications は不要に

// モックデータを直接定義
jest.mock('../data/publications.json', () => [
  // Publication 1 (Journal)
  {
    hasEmptyFields: false,
    name: 'Test Publication 1',
    japanese: 'テスト出版物 1',
    type: 'Journal paper：原著論文',
    review: 'Peer-reviewed',
    authorship: ['First author'],
    presentationType: 'Oral', // デフォルト値
    doi: '10.1234/test.1',
    webLink: 'https://example.com/test-1',
    date: '2022年10月1日',
    startDate: '2022-10-01',
    endDate: '2022-10-01',
    sortableDate: '20221001',
    others: 'Additional info 1',
    site: 'Test Site 1',
    journalConference: 'Test Journal 1',
    // フック内で計算されるプロパティは不要 (id, year)
  },
  // Publication 2 (International Conference)
  {
    hasEmptyFields: false,
    name: 'Test Publication 2',
    japanese: 'テスト出版物 2',
    type: 'Research paper (international conference)：国際会議',
    review: 'Peer-reviewed', // デフォルト値
    authorship: ['Corresponding author'],
    presentationType: 'Poster', // 例として変更
    doi: '10.1234/test.2',
    webLink: 'https://example.com/test-2',
    date: '2021年5月15日',
    startDate: '2021-05-15',
    endDate: '2021-05-15',
    sortableDate: '20210515',
    others: 'Additional info 2',
    site: 'Test Site 2',
    journalConference: 'Test Conference 2',
  },
  // Publication 3 (Invited)
  {
    hasEmptyFields: false,
    name: 'Test Publication 3',
    japanese: 'テスト出版物 3',
    type: 'Invited paper：招待論文',
    review: 'N/A', // 例として変更
    authorship: ['Co-author'],
    presentationType: 'Oral', // デフォルト値
    doi: '10.1234/test.3',
    webLink: 'https://example.com/test-3',
    date: '2022年3月10日',
    startDate: '2022-03-10',
    endDate: '2022-03-10',
    sortableDate: '20220310',
    others: 'Additional info 3',
    site: 'Test Site 3',
    journalConference: 'Test Symposium 3',
  }
]);


describe('usePublications', () => {
  describe('extractYear', () => {
    it('日付文字列から年を正しく抽出する', () => {
      const { result } = renderHook(() => usePublications({ sortOrder: 'type', filteredPublications: [] }));
      
      expect(result.current.extractYear('2022年10月1日')).toBe(2022);
      expect(result.current.extractYear('2021年5月15日 → 2021年5月20日')).toBe(2021);
      expect(result.current.extractYear(null)).toBeNull();
      expect(result.current.extractYear('')).toBeNull();
      expect(result.current.extractYear('No date')).toBeNull();
    });
  });

  describe('formattedPublications', () => {
    it('出版物データを正しく整形する', () => {
      const { result } = renderHook(() => usePublications({ sortOrder: 'type', filteredPublications: [] }));
      
      expect(result.current.formattedPublications).toHaveLength(3);
      expect(result.current.formattedPublications[0].year).toBe(2022);
      expect(result.current.formattedPublications[1].year).toBe(2021);
      expect(result.current.formattedPublications[2].year).toBe(2022);
    });
  });

  describe('sortedPublications', () => {
    it('種類順で正しくソートする', () => {
      const { result } = renderHook(() => usePublications({ sortOrder: 'type', filteredPublications: [] }));
      
      expect(result.current.sortedPublications[0].type).toBe('Journal paper：原著論文');
      expect(result.current.sortedPublications[1].type).toBe('Invited paper：招待論文');
      expect(result.current.sortedPublications[2].type).toBe('Research paper (international conference)：国際会議');
    });

    it('時系列順で正しくソートする', () => {
      const { result } = renderHook(() => usePublications({ sortOrder: 'chronological', filteredPublications: [] }));
      
      // sortableDateの降順（新しい順）でソートされる
      expect(result.current.sortedPublications[0].sortableDate).toBe('20221001');
      expect(result.current.sortedPublications[1].sortableDate).toBe('20220310');
      expect(result.current.sortedPublications[2].sortableDate).toBe('20210515');
    });
  });

  describe('groupedPublications', () => {
    it('種類別に正しくグループ化する', () => {
      // ファクトリ関数を使用してテストデータを生成
      const filteredPublications = [
        createPublication({ id: 0, type: 'Journal paper：原著論文', year: 2022 }, 0),
        createPublication({ id: 1, type: 'Research paper (international conference)：国際会議', year: 2021 }, 1),
        createPublication({ id: 2, type: 'Journal paper：原著論文', year: 2020 }, 2),
      ];

      const { result } = renderHook(() => usePublications({
        sortOrder: 'type', 
        filteredPublications 
      }));
      
      expect(result.current.groupedPublications).toHaveLength(2);
      
      // 最初のグループは「Journal paper：原著論文」
      expect(result.current.groupedPublications[0].name).toBe('Journal paper：原著論文');
      expect(result.current.groupedPublications[0].items).toHaveLength(2);
      
      // 2番目のグループは「Research paper (international conference)：国際会議」
      expect(result.current.groupedPublications[1].name).toBe('Research paper (international conference)：国際会議');
      expect(result.current.groupedPublications[1].items).toHaveLength(1);
    });

    it('年別に正しくグループ化する', () => {
      // ファクトリ関数を使用してテストデータを生成
      const filteredPublications = [
        createPublication({ id: 0, type: 'Journal paper：原著論文', year: 2022 }, 0),
        createPublication({ id: 1, type: 'Research paper (international conference)：国際会議', year: 2021 }, 1),
        createPublication({ id: 2, type: 'Journal paper：原著論文', year: 2022 }, 2),
      ];

      const { result } = renderHook(() => usePublications({
        sortOrder: 'chronological', 
        filteredPublications 
      }));
      
      expect(result.current.groupedPublications).toHaveLength(2);
      
      // 最初のグループは「2022」
      expect(result.current.groupedPublications[0].name).toBe('2022');
      expect(result.current.groupedPublications[0].items).toHaveLength(2);
      
      // 2番目のグループは「2021」
      expect(result.current.groupedPublications[1].name).toBe('2021');
      expect(result.current.groupedPublications[1].items).toHaveLength(1);
    });
  });
});