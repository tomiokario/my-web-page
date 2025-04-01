/**
 * Publicationsコンポーネントのテスト
 *
 * このテストファイルでは、Publicationsコンポーネントの機能をテストします。
 * Publicationsコンポーネントは、出版物データをリスト表示し、
 * 年度によるフィルタリングや言語切替に対応するコンポーネントです。
 *
 * テスト内容：
 * 1. 出版物リストの正常表示
 * 2. 年度フィルターの機能
 * 3. 言語切替（日本語/英語）の機能
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Publications from '../pages/Publications';
import { LanguageProvider } from '../contexts/LanguageContext';
import * as publicationsData from '../data/publications.json';

// モック用のLanguageProviderラッパー
const renderWithLanguageProvider = (ui, { language = 'en', ...options } = {}) => {
  const Wrapper = ({ children }) => (
    <LanguageProvider initialLanguage={language}>
      {children}
    </LanguageProvider>
  );
  return render(ui, { wrapper: Wrapper, ...options });
};

// publicationsDataをモック
jest.mock('../data/publications.json', () => [
  {
    "hasEmptyFields": false,
    "name": "Rio Tomioka and Masanori Takabayashi, \"Numerical simulations of neural network hardware based on self-referential holography\"",
    "japanese": "冨岡莉生, 高林正典, \"自己参照型ホログラフィを用いたニューラルネットワークハードウェアの数値シミュレーション\"",
    "type": "Research paper (international conference)",
    "review": "Reviewed",
    "authorship": "Lead author",
    "presentationType": "Oral",
    "doi": "",
    "webLink": "https://example.com/paper1",
    "date": "2021年10月3日 → 2021年10月6日",
    "others": "",
    "site": "online",
    "journalConference": "ISOM21"
  },
  {
    "hasEmptyFields": false,
    "name": "Rio Tomioka and Masanori Takabayashi, \"Improvement of learning process by transmission matrix\"",
    "japanese": "冨岡莉生, 高林正典, \"透過行列を用いた学習過程の改善\"",
    "type": "Research paper (domestic conference)",
    "review": "Not reviewed",
    "authorship": "Lead author",
    "presentationType": "Oral",
    "doi": "",
    "webLink": "https://example.com/paper2",
    "date": "2022年2月21日",
    "others": "",
    "site": "online",
    "journalConference": "MMS2022"
  }
]);

describe('Publications Component', () => {
  test('should render publications list', () => {
    // テスト内容: 出版物リストが正しくレンダリングされることを確認
    renderWithLanguageProvider(<Publications />);
    
    // 現在のコンポーネントが新しいJSONデータ構造でどのように動作しているかを確認
    const publicationItems = screen.getAllByRole('listitem');
    
    // 少なくとも1つの出版物アイテムが表示されていることを確認
    expect(publicationItems.length).toBeGreaterThan(0);
    
    // コンソールに出力して確認
    console.log('Publication Items:', publicationItems.map(item => item.textContent));
    
    // テスト内容: 出版物の内容が正しく表示されることを確認
    const firstItem = publicationItems[0];
    expect(firstItem.textContent).not.toBe('');
    
    // 出版物の内容が表示されていることを確認
    // 注: 著者とタイトルの分離に依存せず、出版物データの一部が表示されていることを確認
    expect(firstItem.textContent).toContain('ISOM21');
    
    // タグ（Year、Authorship、type、Review、Presentation）が表示されていることを確認
    const tags = firstItem.querySelectorAll('.tag');
    expect(tags.length).toBeGreaterThan(0);
    expect(firstItem.textContent).toContain('2021');
    expect(firstItem.textContent).toContain('Lead author');
    expect(firstItem.textContent).toContain('Research paper');
    expect(firstItem.textContent).toContain('Reviewed');
    expect(firstItem.textContent).toContain('Oral');
    
    // 一行目に年が表示されていないことを確認
    const firstLine = firstItem.querySelector('strong').textContent;
    expect(firstLine).not.toContain('2021');
    
    // タグが二行目に表示されていることを確認
    const secondLine = firstItem.querySelector('.tags-container');
    expect(secondLine).not.toBeNull();
    
    // ジャーナル名が三行目に表示されていることを確認
    expect(firstItem.textContent).toContain('ISOM21');
    
    // URLリンクが表示されていることを確認
    const link = firstItem.querySelector('a');
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('https://example.com/paper1');
  });
  
  test('should filter publications using dropdown filters', () => {
    // テスト内容: ドロップダウンフィルターが正しく機能することを確認
    renderWithLanguageProvider(<Publications />);
    
    // 初期状態では全ての出版物が表示されていることを確認
    const initialItems = screen.getAllByRole('listitem');
    expect(initialItems.length).toBe(2);
    
    // 年のフィルターボタンをクリック
    const yearFilterButton = screen.getByText('年度 ▼');
    fireEvent.click(yearFilterButton);
    
    // ドロップダウンメニューが表示されることを確認
    const yearDropdown = screen.getByTestId('year-dropdown');
    expect(yearDropdown).toBeInTheDocument();
    
    // 2021年のチェックボックスをクリック
    const year2021Checkbox = screen.getByLabelText('2021');
    fireEvent.click(year2021Checkbox);
    
    // 2021年でフィルタリングされた出版物が表示されていることを確認
    const yearFilteredItems = screen.getAllByRole('listitem');
    expect(yearFilteredItems.length).toBe(1);
    expect(yearFilteredItems[0].textContent).toContain('2021');
    expect(yearFilteredItems[0].textContent).not.toContain('2022');
    
    // 著者の役割のフィルターボタンをクリック
    const authorshipFilterButton = screen.getByText('著者の役割 ▼');
    fireEvent.click(authorshipFilterButton);
    
    // ドロップダウンメニューが表示されることを確認
    const authorshipDropdown = screen.getByTestId('authorship-dropdown');
    expect(authorshipDropdown).toBeInTheDocument();
    
    // Lead authorのチェックボックスをクリック
    const leadAuthorCheckbox = screen.getByLabelText('Lead author');
    fireEvent.click(leadAuthorCheckbox);
    
    // Lead authorでフィルタリングされた出版物が表示されていることを確認
    // 2021年のフィルターと組み合わせて、両方の条件に一致する出版物のみが表示される
    const combinedFilteredItems = screen.getAllByRole('listitem');
    expect(combinedFilteredItems.length).toBe(1);
    expect(combinedFilteredItems[0].textContent).toContain('2021');
    expect(combinedFilteredItems[0].textContent).toContain('Lead author');
    
    // フィルターをリセット
    const resetButton = screen.getByText('フィルターをリセット');
    fireEvent.click(resetButton);
    
    // リセット後は全ての出版物が表示されていることを確認
    const resetItems = screen.getAllByRole('listitem');
    expect(resetItems.length).toBe(2);
  });
  
  test('should show active filters with different color', () => {
    // テスト内容: アクティブなフィルターが異なる色で表示されることを確認
    renderWithLanguageProvider(<Publications />);
    
    // 年のフィルターボタンをクリック
    const yearFilterButton = screen.getByText('年度 ▼');
    fireEvent.click(yearFilterButton);
    
    // 2021年のチェックボックスをクリック
    const year2021Checkbox = screen.getByLabelText('2021');
    fireEvent.click(year2021Checkbox);
    
    // フィルターボタンの色が変わっていることを確認
    const activeYearFilter = screen.getByText('年度 ▼');
    expect(activeYearFilter).toHaveAttribute('style', expect.stringContaining('background-color: rgb(192, 224, 255)'));
    
    // 著者の役割のフィルターボタンをクリック
    const authorshipFilterButton = screen.getByText('著者の役割 ▼');
    fireEvent.click(authorshipFilterButton);
    
    // Lead authorのチェックボックスをクリック
    const leadAuthorCheckbox = screen.getByLabelText('Lead author');
    fireEvent.click(leadAuthorCheckbox);
    
    // フィルターボタンの色が変わっていることを確認
    const activeAuthorshipFilter = screen.getByText('著者の役割 ▼');
    expect(activeAuthorshipFilter).toHaveAttribute('style', expect.stringContaining('background-color: rgb(192, 224, 255)'));
    
    // フィルターをリセット
    const resetButton = screen.getByText('フィルターをリセット');
    fireEvent.click(resetButton);
    
    // フィルターボタンの色が元に戻っていることを確認
    const inactiveYearFilter = screen.getByText('年度 ▼');
    expect(inactiveYearFilter).toHaveAttribute('style', expect.stringContaining('background-color: rgb(240, 240, 240)'));
    
    const inactiveAuthorshipFilter = screen.getByText('著者の役割 ▼');
    expect(inactiveAuthorshipFilter).toHaveAttribute('style', expect.stringContaining('background-color: rgb(240, 240, 240)'));
  });
  
  test('should display publications in Japanese when language is set to Japanese', () => {
    // テスト内容: 言語設定が日本語の場合、出版物が日本語で表示されることを確認
    renderWithLanguageProvider(<Publications />, { language: 'ja' });
    
    // フィルターボタンが日本語になっていることを確認
    const yearFilterButton = screen.getByText('年度 ▼');
    expect(yearFilterButton).toBeInTheDocument();
    
    // 出版物リストを確認
    const publicationItems = screen.getAllByRole('listitem');
    console.log('Japanese publication items:', publicationItems.map(item => item.textContent));
    
    // テスト内容: 日本語の内容が表示されることを確認
    
    // 日本語の内容が含まれていることを確認
    // 注: 著者とタイトルの分離に依存せず、日本語の内容が表示されていることを確認
    const firstItem = publicationItems[0];
    expect(firstItem.textContent).toContain('ISOM21');
    
    // 日本語の内容が表示されていることを確認
    expect(firstItem.textContent).toContain('自己参照型');
    
    // 年のタグが表示されていることを確認
    expect(firstItem.textContent).toContain('2021');
    expect(firstItem.textContent).toContain('冨岡');
    
    // 一行目に年が表示されていないことを確認
    const firstLine = firstItem.querySelector('strong').textContent;
    expect(firstLine).not.toContain('2021');
    
    // タグが二行目に表示されていることを確認
    const secondLine = firstItem.querySelector('.tags-container');
    expect(secondLine).not.toBeNull();
    
    // URLリンクが表示されていることを確認
    const link = firstItem.querySelector('a');
    expect(link).not.toBeNull();
  });
});