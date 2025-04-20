import { renderHook } from '@testing-library/react';
import usePublications from '../hooks/usePublications';

// モックデータ
jest.mock('../data/publications.json', () => [
  {
    name: 'Test Publication 1',
    japanese: 'テスト出版物 1',
    date: '2022年10月1日',
    type: 'Journal paper：原著論文',
    authorship: ['First author'],
    sortableDate: '20221001'
  },
  {
    name: 'Test Publication 2',
    japanese: 'テスト出版物 2',
    date: '2021年5月15日',
    type: 'Research paper (international conference)：国際会議',
    authorship: ['Corresponding author'],
    sortableDate: '20210515'
  },
  {
    name: 'Test Publication 3',
    japanese: 'テスト出版物 3',
    date: '2022年3月10日',
    type: 'Invited paper：招待論文',
    authorship: ['Co-author'],
    sortableDate: '20220310'
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
      const filteredPublications = [
        {
          id: 0,
          name: 'Test Publication 1',
          type: 'Journal paper：原著論文',
          year: 2022
        },
        {
          id: 1,
          name: 'Test Publication 2',
          type: 'Research paper (international conference)：国際会議',
          year: 2021
        },
        {
          id: 2,
          name: 'Test Publication 3',
          type: 'Journal paper：原著論文',
          year: 2020
        }
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
      const filteredPublications = [
        {
          id: 0,
          name: 'Test Publication 1',
          type: 'Journal paper：原著論文',
          year: 2022
        },
        {
          id: 1,
          name: 'Test Publication 2',
          type: 'Research paper (international conference)：国際会議',
          year: 2021
        },
        {
          id: 2,
          name: 'Test Publication 3',
          type: 'Journal paper：原著論文',
          year: 2022
        }
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