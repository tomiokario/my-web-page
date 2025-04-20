import { renderHook } from '@testing-library/react';
import usePublications from '../hooks/usePublications';
import { createPublication } from '../test-utils/factories/publicationFactory';
import mockPublications from '../data/__mocks__/publications.json'; // モックデータをインポート

// モックデータを直接定義
// 自動モック (src/data/__mocks__/publications.json.ts) を使用するため、
// ここでの手動モックは削除します。

describe('usePublications', () => {
  describe('extractYear', () => {
    it('日付文字列から年を正しく抽出する', () => {
      const { result } = renderHook(() => usePublications({ sortOrder: 'type', filteredPublications: [], publicationsData: mockPublications }));
      
      expect(result.current.extractYear('2022年10月1日')).toBe(2022);
      expect(result.current.extractYear('2021年5月15日 → 2021年5月20日')).toBe(2021);
      expect(result.current.extractYear(null)).toBeNull();
      expect(result.current.extractYear('')).toBeNull();
      expect(result.current.extractYear('No date')).toBeNull();
    });
  });

  describe('formattedPublications', () => {
    it('出版物データを正しく整形する', () => {
      const { result } = renderHook(() => usePublications({ sortOrder: 'type', filteredPublications: [], publicationsData: mockPublications }));
      
      // モックデータは5件ある
      expect(result.current.formattedPublications).toHaveLength(5);
      // 最初のデータの年を確認
      expect(result.current.formattedPublications[0].year).toBe(2023);
      // 他のデータの年も必要に応じて確認
      expect(result.current.formattedPublications[1].year).toBe(2022);
      expect(result.current.formattedPublications[2].year).toBe(2023);
      expect(result.current.formattedPublications[3].year).toBe(2022);
      expect(result.current.formattedPublications[4].year).toBe(2022);
    });
  });

  describe('sortedPublications', () => {
    it('種類順で正しくソートする', () => {
      const { result } = renderHook(() => usePublications({ sortOrder: 'type', filteredPublications: [], publicationsData: mockPublications }));
      
      // モックデータと TYPE_ORDER に基づく期待値
      expect(result.current.sortedPublications[0].type).toBe('Journal paper：原著論文'); // Pub 1
      expect(result.current.sortedPublications[1].type).toBe('Journal paper：原著論文'); // Pub 5
      expect(result.current.sortedPublications[2].type).toBe('Invited paper：招待論文'); // Pub 3
      expect(result.current.sortedPublications[3].type).toBe('Research paper (international conference)：国際会議'); // Pub 2
      expect(result.current.sortedPublications[4].type).toBe('Research paper (domestic conference)：国内会議'); // Pub 4
    });

    it('時系列順で正しくソートする', () => {
      const { result } = renderHook(() => usePublications({ sortOrder: 'chronological', filteredPublications: [], publicationsData: mockPublications }));
      
      // モックデータの sortableDate の降順（新しい順）
      expect(result.current.sortedPublications[0].sortableDate).toBe('20231001'); // Pub 1
      expect(result.current.sortedPublications[1].sortableDate).toBe('20230310'); // Pub 3
      expect(result.current.sortedPublications[2].sortableDate).toBe('20221120'); // Pub 4
      expect(result.current.sortedPublications[3].sortableDate).toBe('20220805'); // Pub 5
      expect(result.current.sortedPublications[4].sortableDate).toBe('20220515'); // Pub 2
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
        filteredPublications,
        publicationsData: mockPublications // モックデータを渡す
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
        filteredPublications,
        publicationsData: mockPublications // モックデータを渡す
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