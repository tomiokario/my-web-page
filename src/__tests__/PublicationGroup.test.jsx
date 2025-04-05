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
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PublicationGroup from '../components/publications/PublicationGroup';

// PublicationItemコンポーネントをモック
jest.mock('../components/publications/PublicationItem', () => {
  return function MockPublicationItem({ publication, language }) {
    return (
      <div data-testid="publication-item" data-publication-id={publication.id} data-language={language}>
        {publication.name}
      </div>
    );
  };
});

// テスト用のモックデータ
const mockItems = [
  {
    id: 1,
    name: "Publication 1",
    japanese: "出版物 1",
    year: 2021
  },
  {
    id: 2,
    name: "Publication 2",
    japanese: "出版物 2",
    year: 2021
  },
  {
    id: 3,
    name: "Publication 3",
    japanese: "出版物 3",
    year: 2021
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
    const items = screen.getAllByTestId('publication-item');
    expect(items).toHaveLength(3);
    
    // 各出版物アイテムが正しいデータを持っていることを確認
    expect(items[0]).toHaveAttribute('data-publication-id', '1');
    expect(items[1]).toHaveAttribute('data-publication-id', '2');
    expect(items[2]).toHaveAttribute('data-publication-id', '3');
    
    // 各出版物アイテムに正しい言語設定が渡されていることを確認
    items.forEach(item => {
      expect(item).toHaveAttribute('data-language', 'en');
    });
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
    const items = screen.getAllByTestId('publication-item');
    items.forEach(item => {
      expect(item).toHaveAttribute('data-language', 'ja');
    });
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