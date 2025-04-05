import { renderHook, act } from '@testing-library/react';
import useFilters from '../hooks/useFilters';

describe('useFilters', () => {
  // テスト用の出版物データ
  const mockPublications = [
    {
      id: 0,
      name: 'Test Publication 1',
      year: 2022,
      type: 'Journal paper：原著論文',
      review: 'Peer-reviewed',
      authorship: ['First author'],
      presentationType: ['Oral']
    },
    {
      id: 1,
      name: 'Test Publication 2',
      year: 2021,
      type: 'Research paper (international conference)：国際会議',
      review: 'Non-peer-reviewed',
      authorship: 'Corresponding author',
      presentationType: 'Poster'
    },
    {
      id: 2,
      name: 'Test Publication 3',
      year: 2022,
      type: 'Invited paper：招待論文',
      review: 'Peer-reviewed',
      authorship: ['Co-author'],
      presentationType: ['Oral', 'Invited']
    }
  ];

  describe('filterOptions', () => {
    it('出版物データから利用可能なフィルターオプションを正しく抽出する', () => {
      const { result } = renderHook(() => useFilters({ publications: mockPublications }));
      
      expect(result.current.filterOptions.year).toContain('2022');
      expect(result.current.filterOptions.year).toContain('2021');
      expect(result.current.filterOptions.year).toHaveLength(2);
      
      expect(result.current.filterOptions.type).toContain('Journal paper：原著論文');
      expect(result.current.filterOptions.type).toContain('Research paper (international conference)：国際会議');
      expect(result.current.filterOptions.type).toContain('Invited paper：招待論文');
      expect(result.current.filterOptions.type).toHaveLength(3);
      
      expect(result.current.filterOptions.review).toContain('Peer-reviewed');
      expect(result.current.filterOptions.review).toContain('Non-peer-reviewed');
      expect(result.current.filterOptions.review).toHaveLength(2);
      
      expect(result.current.filterOptions.authorship).toContain('First author');
      expect(result.current.filterOptions.authorship).toContain('Corresponding author');
      expect(result.current.filterOptions.authorship).toContain('Co-author');
      expect(result.current.filterOptions.authorship).toHaveLength(3);
      
      expect(result.current.filterOptions.presentationType).toContain('Oral');
      expect(result.current.filterOptions.presentationType).toContain('Poster');
      expect(result.current.filterOptions.presentationType).toContain('Invited');
      expect(result.current.filterOptions.presentationType).toHaveLength(3);
    });
  });

  describe('filteredPublications', () => {
    it('年度フィルターが正しく機能する', () => {
      const { result } = renderHook(() => useFilters({ publications: mockPublications }));
      
      // 初期状態ではフィルターなし
      expect(result.current.filteredPublications).toHaveLength(3);
      
      // 2022年のみをフィルター
      act(() => {
        result.current.toggleFilter('year', '2022');
      });
      
      expect(result.current.filteredPublications).toHaveLength(2);
      expect(result.current.filteredPublications[0].year).toBe(2022);
      expect(result.current.filteredPublications[1].year).toBe(2022);
      
      // 2021年も追加
      act(() => {
        result.current.toggleFilter('year', '2021');
      });
      
      expect(result.current.filteredPublications).toHaveLength(3);
      
      // 2022年を解除
      act(() => {
        result.current.toggleFilter('year', '2022');
      });
      
      expect(result.current.filteredPublications).toHaveLength(1);
      expect(result.current.filteredPublications[0].year).toBe(2021);
    });

    it('タイプフィルターが正しく機能する', () => {
      const { result } = renderHook(() => useFilters({ publications: mockPublications }));
      
      act(() => {
        result.current.toggleFilter('type', 'Journal paper：原著論文');
      });
      
      expect(result.current.filteredPublications).toHaveLength(1);
      expect(result.current.filteredPublications[0].type).toBe('Journal paper：原著論文');
    });

    it('著者の役割フィルターが正しく機能する（配列と文字列の両方）', () => {
      const { result } = renderHook(() => useFilters({ publications: mockPublications }));
      
      act(() => {
        result.current.toggleFilter('authorship', 'First author');
      });
      
      expect(result.current.filteredPublications).toHaveLength(1);
      expect(result.current.filteredPublications[0].id).toBe(0);
      
      act(() => {
        result.current.toggleFilter('authorship', 'Corresponding author');
      });
      
      expect(result.current.filteredPublications).toHaveLength(2);
    });

    it('複数のフィルターが正しく組み合わさる', () => {
      const { result } = renderHook(() => useFilters({ publications: mockPublications }));
      
      // 2022年かつPeer-reviewedの出版物
      act(() => {
        result.current.toggleFilter('year', '2022');
        result.current.toggleFilter('review', 'Peer-reviewed');
      });
      
      expect(result.current.filteredPublications).toHaveLength(2);
      
      // さらにJournal paperに限定
      act(() => {
        result.current.toggleFilter('type', 'Journal paper：原著論文');
      });
      
      expect(result.current.filteredPublications).toHaveLength(1);
      expect(result.current.filteredPublications[0].id).toBe(0);
    });
  });

  describe('toggleDropdown', () => {
    it('ドロップダウンの開閉が正しく機能する', () => {
      const { result } = renderHook(() => useFilters({ publications: mockPublications }));
      
      // 初期状態ではドロップダウンは閉じている
      expect(result.current.openDropdown).toBeNull();
      
      // yearドロップダウンを開く
      act(() => {
        result.current.toggleDropdown('year');
      });
      
      expect(result.current.openDropdown).toBe('year');
      
      // 同じドロップダウンをクリックすると閉じる
      act(() => {
        result.current.toggleDropdown('year');
      });
      
      expect(result.current.openDropdown).toBeNull();
      
      // 別のドロップダウンを開くと前のは閉じる
      act(() => {
        result.current.toggleDropdown('type');
      });
      
      expect(result.current.openDropdown).toBe('type');
    });
  });

  describe('resetFilters', () => {
    it('フィルターのリセットが正しく機能する', () => {
      const { result } = renderHook(() => useFilters({ publications: mockPublications }));
      
      // いくつかのフィルターを設定
      act(() => {
        result.current.toggleFilter('year', '2022');
        result.current.toggleFilter('type', 'Journal paper：原著論文');
      });
      
      expect(result.current.selectedFilters.year).toContain('2022');
      expect(result.current.selectedFilters.type).toContain('Journal paper：原著論文');
      expect(result.current.filteredPublications).toHaveLength(1);
      
      // フィルターをリセット
      act(() => {
        result.current.resetFilters();
      });
      
      // すべてのフィルターが空になっている
      expect(result.current.selectedFilters.year).toHaveLength(0);
      expect(result.current.selectedFilters.type).toHaveLength(0);
      expect(result.current.selectedFilters.authorship).toHaveLength(0);
      expect(result.current.selectedFilters.review).toHaveLength(0);
      expect(result.current.selectedFilters.presentationType).toHaveLength(0);
      
      // すべての出版物が表示される
      expect(result.current.filteredPublications).toHaveLength(3);
    });
  });
});