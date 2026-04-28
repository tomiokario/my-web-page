import { renderHook, act } from '@testing-library/react';
import useFilters from '../hooks/useFilters';
import { createPublications } from '../test-utils/factories/publicationFactory'; // ファクトリ関数をインポート

describe('useFilters', () => {
  // ファクトリ関数を使用してテストデータを生成
  const mockPublications = createPublications(3, [
    {
      id: 0,
      year: 2022,
      type: 'published_papers/scientific_journal',
      review: 'peer_reviewed',
      authorship: ['lead']
    },
    {
      id: 1,
      year: 2021,
      type: 'published_papers/international_conference_proceedings',
      review: 'not_peer_reviewed',
      authorship: 'corresponding' // 文字列も許容
    },
    {
      id: 2,
      year: 2022,
      type: 'misc/introduction_scientific_journal',
      review: 'peer_reviewed',
      authorship: ['coauthor']
    }
  ]);

  describe('filterOptions', () => {
    it('出版物データから利用可能なフィルターオプションを正しく抽出する', () => {
      const { result } = renderHook(() => useFilters({ publications: mockPublications }));
      
      expect(result.current.filterOptions.year).toContain('2022');
      expect(result.current.filterOptions.year).toContain('2021');
      expect(result.current.filterOptions.year).toHaveLength(2);
      
      expect(result.current.filterOptions.type).toContain('published_papers/scientific_journal');
      expect(result.current.filterOptions.type).toContain('published_papers/international_conference_proceedings');
      expect(result.current.filterOptions.type).toContain('misc/introduction_scientific_journal');
      expect(result.current.filterOptions.type).toHaveLength(3);
      
      expect(result.current.filterOptions.review).toContain('peer_reviewed');
      expect(result.current.filterOptions.review).toContain('not_peer_reviewed');
      expect(result.current.filterOptions.review).toHaveLength(2);
      
      expect(result.current.filterOptions.authorship).toContain('lead');
      expect(result.current.filterOptions.authorship).toContain('corresponding');
      expect(result.current.filterOptions.authorship).toContain('coauthor');
      expect(result.current.filterOptions.authorship).toHaveLength(3);
      expect(result.current.filterOptions).not.toHaveProperty('presentationType');
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

    it('年度フィルター時は year 未設定の出版物を含めない', () => {
      const publicationsWithUnknownYear = createPublications(4, [
        ...mockPublications,
        {
          id: 3,
          year: undefined,
          type: 'Misc',
          review: '',
          authorship: ''
        }
      ]);
      const { result } = renderHook(() =>
        useFilters({ publications: publicationsWithUnknownYear })
      );

      act(() => {
        result.current.toggleFilter('year', '2022');
      });

      expect(result.current.filteredPublications).toHaveLength(2);
      expect(
        result.current.filteredPublications.every((publication) => publication.year === 2022)
      ).toBe(true);
    });

    it('タイプフィルターが正しく機能する', () => {
      const { result } = renderHook(() => useFilters({ publications: mockPublications }));
      
      act(() => {
        result.current.toggleFilter('type', 'published_papers/scientific_journal');
      });
      
      expect(result.current.filteredPublications).toHaveLength(1);
      expect(result.current.filteredPublications[0].type).toBe('published_papers/scientific_journal');
    });

    it('著者の役割フィルターが正しく機能する（配列と文字列の両方）', () => {
      const { result } = renderHook(() => useFilters({ publications: mockPublications }));
      
      act(() => {
        result.current.toggleFilter('authorship', 'lead');
      });
      
      expect(result.current.filteredPublications).toHaveLength(1);
      expect(result.current.filteredPublications[0].id).toBe(0);
      
      act(() => {
        result.current.toggleFilter('authorship', 'corresponding');
      });
      
      expect(result.current.filteredPublications).toHaveLength(2);
    });

    it('複数のフィルターが正しく組み合わさる', () => {
      const { result } = renderHook(() => useFilters({ publications: mockPublications }));
      
      // 2022年かつpeer_reviewedの出版物
      act(() => {
        result.current.toggleFilter('year', '2022');
        result.current.toggleFilter('review', 'peer_reviewed');
      });
      
      expect(result.current.filteredPublications).toHaveLength(2);
      
      // さらにJournal paperに限定
      act(() => {
        result.current.toggleFilter('type', 'published_papers/scientific_journal');
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
        result.current.toggleFilter('type', 'published_papers/scientific_journal');
      });
      
      expect(result.current.selectedFilters.year).toContain('2022');
      expect(result.current.selectedFilters.type).toContain('published_papers/scientific_journal');
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
      expect(result.current.selectedFilters).not.toHaveProperty('presentationType');
      
      // すべての出版物が表示される
      expect(result.current.filteredPublications).toHaveLength(3);
    });
  });
});
