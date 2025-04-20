/**
 * PublicationGroupコンポーネントのテスト
 *
 * このテストファイルでは、出版物グループを表示するPublicationGroupコンポーネントの
 * 機能をテストします。
 *
 * テスト内容：
 * 1. コンポーネントが正しくレンダリングされること
 * 2. グループ名が正しく表示されること
 * 3. 出版物アイテムのリストが正しく表示されること
 * 4. 言語設定が子コンポーネント（PublicationItem）に正しく渡されること
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react'; // Import within
import '@testing-library/jest-dom';
import PublicationGroup from '../components/publications/PublicationGroup';
import PublicationItem from '../components/publications/PublicationItem'; // Import the actual component

// テスト用のモックデータ
const mockItems = [
  {
    id: 1,
    name: "Publication 1",
    japanese: "出版物 1",
    type: "Research paper (international conference)：国際会議",
    review: "Reviewed",
    authorship: "Lead author",
    presentationType: "Oral",
    doi: "10.1234/pub1",
    webLink: "https://example.com/pub1",
    date: "2021年10月3日",
    startDate: "2021-10-03",
    endDate: "2021-10-03",
    sortableDate: "2021-10-03",
    year: 2021,
    others: "Award 1",
    site: "Site 1",
    journalConference: "Conf 1"
  },
  {
    id: 2,
    name: "Publication 2",
    japanese: "出版物 2",
    type: "Journal paper：原著論文",
    review: "Reviewed",
    authorship: ["Corresponding author", "Lead author"],
    presentationType: ["Poster"],
    doi: "10.1234/pub2",
    webLink: "", // No web link
    date: "2021年5月15日",
    startDate: "2021-05-15",
    endDate: "2021-05-15",
    sortableDate: "2021-05-15",
    year: 2021,
    others: "",
    site: "Site 2",
    journalConference: "Journal 1"
  },
  {
    id: 3,
    name: "Publication 3",
    japanese: "出版物 3",
    year: 2021 // Minimal data for testing rendering
  }
];

describe('PublicationGroup Component', () => {
  // 基本的なレンダリングテスト
  test('renders publication group correctly', () => {
    render(
      <PublicationGroup
        name="Test Group"
        items={mockItems}
        language="en"
      />
    );
    
    // グループ名が表示されていることを確認
    expect(screen.getByText('Test Group')).toBeInTheDocument();
    
    // グループ名がh3要素内にあることを確認
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Test Group');
    
    // 出版物リストがol要素として表示されていることを確認
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    
    // 出版物アイテムが正しい数だけ表示されていることを確認
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    
    // 最初の出版物アイテムの内容が正しく表示されていることを確認 (英語)
    const firstItem = items[0];
    expect(within(firstItem).getByText(mockItems[0].name)).toBeInTheDocument(); // English title
    expect(within(firstItem).getByText('2021')).toBeInTheDocument(); // Year tag
    expect(within(firstItem).getByText('Lead author')).toBeInTheDocument(); // Authorship tag
    expect(within(firstItem).getByText('10.1234/pub1')).toBeInTheDocument(); // DOI link text
  });
  
  // 言語設定のテスト
  test('passes correct language prop to PublicationItem', () => {
    render(
      <PublicationGroup
        name="Test Group"
        items={mockItems}
        language="ja"
      />
    );
    
    // 各出版物アイテムに正しい言語設定が渡されていることを確認
    // 最初のアイテムのタイトルが日本語になっていることを確認
    const items = screen.getAllByRole('listitem');
    const firstItem = items[0];
    expect(within(firstItem).getByText(mockItems[0].japanese)).toBeInTheDocument(); // Japanese title
    expect(within(firstItem).queryByText(mockItems[0].name)).not.toBeInTheDocument(); // English title should not be present
  });
  
  // 空のアイテムリストのテスト
  test('renders empty list when no items are provided', () => {
    render(
      <PublicationGroup
        name="Empty Group"
        items={[]}
        language="en"
      />
    );
    
    // グループ名が表示されていることを確認
    expect(screen.getByText('Empty Group')).toBeInTheDocument();
    
    // 出版物リストが空であることを確認
    const list = screen.getByRole('list');
    expect(list.children).toHaveLength(0);
  });
});