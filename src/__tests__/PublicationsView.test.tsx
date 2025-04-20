import React from 'react';
import { screen, fireEvent, cleanup } from '@testing-library/react';
import PublicationsView from '../components/publications/PublicationsView';
import { renderWithProviders } from '../test-utils/test-utils';
import { Publication } from '../types';
import { SelectedFilters } from '../hooks/useFilters';
import { createPublication } from '../test-utils/factories/publicationFactory'; // ファクトリ関数をインポート

// モックデータ
const mockProps = {
  sortOrder: 'type' as 'type' | 'chronological',
  onSortOrderChange: jest.fn(),
  selectedFilters: {
    year: ['2022'],
    authorship: [],
    type: [],
    review: [],
    presentationType: []
  } as SelectedFilters,
  openDropdown: null,
  filterOptions: {
    year: ['2022', '2021', '2020'],
    authorship: ['First author', 'Co-author'],
    type: ['Journal paper：原著論文', 'Research paper (international conference)：国際会議'],
    review: ['Peer-reviewed', 'Non-peer-reviewed'],
    presentationType: ['Oral', 'Poster']
  },
  groupedPublications: [
    {
      name: 'Journal paper：原著論文',
      // ファクトリ関数を使用してアイテムを生成
      items: [
        createPublication({
          id: 1,
          name: 'Test Publication 1',
          japanese: 'テスト出版物1',
          year: 2022,
          type: 'Journal paper：原著論文'
        }, 0) // index 0 で生成
      ]
    }
  ],
  filterRefs: { current: {} } as React.MutableRefObject<Record<string, HTMLElement | null>>,
  toggleDropdown: jest.fn(),
  toggleFilter: jest.fn(),
  resetFilters: jest.fn(),
  language: 'en'
};

// PublicationGroupコンポーネントをモック
jest.mock('../components/publications/PublicationGroup', () => {
  return function MockPublicationGroup({ 
    name, 
    items, 
    language 
  }: { 
    name: string; 
    items: Publication[]; 
    language: string 
  }) {
    return (
      <div data-testid="publication-group">
        <div data-testid="group-name">{name}</div>
        <div data-testid="items-count">{items.length}</div>
        <div data-testid="language">{language}</div>
      </div>
    );
  };
});

// FilterDropdownコンポーネントをモック
jest.mock('../components/publications/FilterDropdown', () => {
  return function MockFilterDropdown({ 
    category, 
    label, 
    onToggleDropdown 
  }: { 
    category: string; 
    label: string; 
    onToggleDropdown: (category: string) => void 
  }) {
    return (
      <button 
        data-testid={`filter-dropdown-${category}`}
        onClick={() => onToggleDropdown(category)}
      >
        {label}
      </button>
    );
  };
});

// ActiveFiltersコンポーネントをモック
jest.mock('../components/publications/ActiveFilters', () => {
  return function MockActiveFilters({ 
    selectedFilters, 
    onResetFilters, 
    resetLabel 
  }: { 
    selectedFilters: SelectedFilters; 
    onResetFilters: () => void; 
    resetLabel: string 
  }) {
    return (
      <div data-testid="active-filters">
        <button 
          data-testid="reset-filters-button"
          onClick={onResetFilters}
        >
          {resetLabel}
        </button>
        <div data-testid="selected-filters-count">
          {Object.values(selectedFilters).flat().length}
        </div>
      </div>
    );
  };
});

describe('PublicationsView', () => {
  // 各テスト後にクリーンアップ
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  test('renders correctly with provided props', () => {
    renderWithProviders(<PublicationsView {...mockProps} />);
    
    // 並び順選択が正しくレンダリングされていることを確認
    expect(screen.getByTestId('sort-order-select')).toBeInTheDocument();
    expect(screen.getByTestId('sort-order-select')).toHaveValue('type');
    
    // フィルタードロップダウンが正しくレンダリングされていることを確認
    expect(screen.getByTestId('filter-dropdown-year')).toBeInTheDocument();
    expect(screen.getByTestId('filter-dropdown-authorship')).toBeInTheDocument();
    expect(screen.getByTestId('filter-dropdown-type')).toBeInTheDocument();
    expect(screen.getByTestId('filter-dropdown-review')).toBeInTheDocument();
    expect(screen.getByTestId('filter-dropdown-presentationType')).toBeInTheDocument();
    
    // アクティブフィルターが正しくレンダリングされていることを確認
    expect(screen.getByTestId('active-filters')).toBeInTheDocument();
    expect(screen.getByTestId('selected-filters-count')).toHaveTextContent('1'); // year: ['2022']
    
    // 出版物グループが正しくレンダリングされていることを確認
    expect(screen.getByTestId('publication-group')).toBeInTheDocument();
    expect(screen.getByTestId('group-name')).toHaveTextContent('Journal paper：原著論文');
    expect(screen.getByTestId('items-count')).toHaveTextContent('1');
    expect(screen.getByTestId('language')).toHaveTextContent('en');
  });
  
  test('calls onSortOrderChange when sort order is changed', () => {
    renderWithProviders(<PublicationsView {...mockProps} />);
    
    // 並び順を変更
    fireEvent.change(screen.getByTestId('sort-order-select'), { target: { value: 'chronological' } });
    
    // onSortOrderChangeが呼ばれたことを確認
    expect(mockProps.onSortOrderChange).toHaveBeenCalledWith('chronological');
  });
  
  test('calls toggleDropdown when filter dropdown is clicked', () => {
    renderWithProviders(<PublicationsView {...mockProps} />);
    
    // フィルタードロップダウンをクリック
    fireEvent.click(screen.getByTestId('filter-dropdown-year'));
    
    // toggleDropdownが呼ばれたことを確認
    expect(mockProps.toggleDropdown).toHaveBeenCalledWith('year');
  });
  
  test('calls resetFilters when reset button is clicked', () => {
    renderWithProviders(<PublicationsView {...mockProps} />);
    
    // リセットボタンをクリック
    fireEvent.click(screen.getByTestId('reset-filters-button'));
    
    // resetFiltersが呼ばれたことを確認
    expect(mockProps.resetFilters).toHaveBeenCalled();
  });
  
  test('displays correct labels based on language', () => {
    // 英語の場合
    renderWithProviders(<PublicationsView {...mockProps} />);
    expect(screen.getByText('By type')).toBeInTheDocument();
    expect(screen.getByText('By year')).toBeInTheDocument();
    
    // クリーンアップ
    cleanup();
    
    // 日本語の場合
    renderWithProviders(<PublicationsView {...{ ...mockProps, language: 'ja' }} />);
    expect(screen.getByText('種類別に表示')).toBeInTheDocument();
    expect(screen.getByText('年別に表示')).toBeInTheDocument();
  });
});