import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import PublicationsView from '../components/publications/PublicationsView';
import { MantineProvider } from '@mantine/core'; // Import MantineProvider for context
import locales from '../locales'; // Import locales for labels

// モックデータ - 実際のコンポーネントを使うため、より詳細なデータが必要
// groupedPublications は PublicationGroup と PublicationItem が必要とするデータを含む
// filterOptions は FilterDropdown が必要とするデータを含む
const mockProps = {
  sortOrder: 'type',
  onSortOrderChange: jest.fn(),
  selectedFilters: {
    year: ['2022'],
    authorship: [],
    type: [],
    review: [],
    presentationType: []
  },
  openDropdown: null,
  filterOptions: {
    year: ['2022', '2021', '2020'],
    authorship: ['First author', 'Co-author'],
    type: ['Journal paper：原著論文', 'Research paper (international conference)：国際会議'],
    review: ['Peer-reviewed', 'Non-peer-reviewed'],
    presentationType: ['Oral', 'Poster']
  },
  groupedPublications: [
    { // Group 1
      name: 'Journal paper：原著論文',
      items: [
        { // Item 1 in Group 1
          id: 1,
          name: 'Test Publication 1',
          japanese: 'テスト出版物1',
          year: 2022,
          type: 'Journal paper：原著論文',
          review: "Reviewed",
          authorship: "Lead author",
          presentationType: "Oral",
          doi: "10.1234/pub1",
          webLink: "https://example.com/pub1",
          date: "2022年1月1日",
          startDate: "2022-01-01",
          endDate: "2022-01-01",
          sortableDate: "2022-01-01",
          others: "Award",
          site: "Site",
          journalConference: "Journal"
        }
      ]
    },
    { // Group 2
      name: 'Research paper (international conference)：国際会議',
      items: [
        { // Item 1 in Group 2
          id: 2,
          name: 'Test Publication 2',
          japanese: 'テスト出版物2',
          year: 2021,
          type: 'Research paper (international conference)：国際会議'
          // Add other necessary fields for PublicationItem if needed for rendering
        }
      ]
    }
  ],
  filterRefs: { current: {} },
  toggleDropdown: jest.fn(),
  toggleFilter: jest.fn(),
  resetFilters: jest.fn(),
  language: 'en'
};

// Helper to render with MantineProvider
const renderWithProvider = (ui) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('PublicationsView', () => {
  test('renders correctly with provided props', () => {
    renderWithProvider(<PublicationsView {...mockProps} />);
    
    // 並び順選択が正しくレンダリングされていることを確認
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('type');
    
    // フィルタードロップダウンが正しくレンダリングされていることを確認 (ボタンの存在を確認)
    expect(screen.getByRole('button', { name: /^Year\s*▼$/i })).toBeInTheDocument(); // More specific regex
    expect(screen.getByRole('button', { name: /^Authorship\s*▼$/i })).toBeInTheDocument(); // More specific regex
    expect(screen.getByRole('button', { name: /^Type\s*▼$/i })).toBeInTheDocument(); // More specific regex
    expect(screen.getByRole('button', { name: /Review/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Presentation Type/i })).toBeInTheDocument();
    
    // アクティブフィルターが正しくレンダリングされていることを確認
    // ActiveFilters コンポーネント内の要素を確認
    expect(screen.getByRole('button', { name: /Reset Filters/i })).toBeInTheDocument();
    // 選択されたフィルタータグが表示されていることを確認 (year: ['2022'])
    expect(screen.getByText('Year:')).toBeInTheDocument();
    expect(screen.getByText('2022 ✕')).toBeInTheDocument();
    
    // 出版物グループが正しくレンダリングされていることを確認
    // PublicationGroup コンポーネント内の要素を確認
    const groups = screen.getAllByRole('heading', { level: 3 });
    expect(groups[0]).toHaveTextContent('Journal paper：原著論文');
    expect(groups[1]).toHaveTextContent('Research paper (international conference)：国際会議');

    // 最初のグループ内の最初の PublicationItem の内容を確認
    const firstGroupItems = screen.getAllByRole('listitem'); // Get all items across groups initially
    // Find items within the first group more reliably if possible, or check the first item overall
    const firstItem = firstGroupItems[0];
    expect(within(firstItem).getByText('Test Publication 1')).toBeInTheDocument(); // Check title
    expect(within(firstItem).getByText('2022')).toBeInTheDocument(); // Check year tag
  });
  
  test('calls onSortOrderChange when sort order is changed', () => {
    renderWithProvider(<PublicationsView {...mockProps} />);
    
    // 並び順を変更
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'chronological' } });
    
    // onSortOrderChangeが呼ばれたことを確認
    expect(mockProps.onSortOrderChange).toHaveBeenCalledWith('chronological');
  });
  
  test('calls toggleDropdown when filter dropdown is clicked', () => {
    // FilterDropdown は内部状態を持つため、このテストは Publications.test.jsx のような統合テストで行う方が適切
    renderWithProvider(<PublicationsView {...mockProps} />);
    
    // フィルタードロップダウンをクリック
    fireEvent.click(screen.getByRole('button', { name: /Year/i }));
    
    // toggleDropdownが呼ばれたことを確認
    expect(mockProps.toggleDropdown).toHaveBeenCalledWith('year');
  });
  
  test('calls resetFilters when reset button is clicked', () => {
    // ActiveFilters は内部状態を持つため、このテストは Publications.test.jsx のような統合テストで行う方が適切
    renderWithProvider(<PublicationsView {...mockProps} />);
    
    // リセットボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: /Reset Filters/i }));
    
    // resetFiltersが呼ばれたことを確認
    expect(mockProps.resetFilters).toHaveBeenCalled();
  });
  
  test('displays correct labels based on language', () => {
    // 英語の場合
    const { rerender } = renderWithProvider(<PublicationsView {...mockProps} language="en" />); // Pass language prop
    expect(screen.getByText('By type')).toBeInTheDocument(); // Use hardcoded label from component
    expect(screen.getByText('By year')).toBeInTheDocument(); // Use hardcoded label from component
    
    // 日本語の場合
    rerender(<MantineProvider><PublicationsView {...mockProps} language="ja" /></MantineProvider>); // Pass language prop
    expect(screen.getByText('種類で表示')).toBeInTheDocument(); // Use hardcoded label from component
    expect(screen.getByText('年で表示')).toBeInTheDocument(); // Use hardcoded label from component
  });
});