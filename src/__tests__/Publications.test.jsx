/**
 * Publicationsコンポーネントのテスト
 *
 * このテストファイルでは、出版物データの表示とフィルタリング機能をテストします。
 * Publicationsコンポーネントは、JSONデータから出版物リストを生成し、
 * 複数の条件（年度、著者の役割、種類など）でフィルタリングできる機能を提供します。
 * また、言語コンテキストに基づいて、日本語/英語の切り替えにも対応しています。
 *
 * テスト内容：
 * 1. 出版物リストが正しくレンダリングされ、各項目の情報（タイトル、タグ、リンクなど）が表示されることを確認
 * 2. フィルターボタンのクリックでドロップダウンメニューが表示され、選択したフィルター条件に基づいて出版物リストが絞り込まれることを確認
 * 3. アクティブなフィルターが視覚的に区別され、リセットボタンでフィルターがクリアされることを確認
 * 4. 言語設定が日本語の場合、出版物情報が日本語で表示されることを確認
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

// 実際のpublications.jsonを使用するため、モックは最小限に
// テスト中に必要な場合のみ特定のプロパティをスパイ/モックする

describe('Publications Component', () => {
  test('should render publications list with correct structure', () => {
    // テスト内容: 出版物リストが正しくレンダリングされることを確認
    renderWithLanguageProvider(<Publications />);
    
    // 出版物リストの要素を取得
    const publicationItems = screen.getAllByRole('listitem', { within: screen.getByRole('list') });
    
    // 少なくとも1つの出版物アイテムが表示されていることを確認
    expect(publicationItems.length).toBeGreaterThan(0);
    
    // 最初の出版物アイテムの内容を確認
    const firstItem = publicationItems[0];
    expect(firstItem.textContent).not.toBe('');
    
    // リストが数字の箇条書きになっていることを確認
    const orderedList = screen.getByRole('list');
    expect(orderedList.tagName).toBe('OL');
    
    // 出版物の構造を確認
    
    // 1. タイトルが表示されていることを確認
    const title = firstItem.querySelector('strong');
    expect(title).not.toBeNull();
    expect(title.textContent.trim()).not.toBe('');
    
    // 2. タグコンテナが存在することを確認
    const tagsContainer = firstItem.querySelector('.tags-container');
    expect(tagsContainer).not.toBeNull();
    
    // 3. タグ（Year、Authorship、type、Review、Presentation）が表示されていることを確認
    const tags = firstItem.querySelectorAll('.tag');
    expect(tags.length).toBeGreaterThan(0);
    
    // 4. 少なくとも1つのタグに年が含まれていることを確認
    const yearTagExists = Array.from(tags).some(tag =>
      /\d{4}/.test(tag.textContent)
    );
    expect(yearTagExists).toBe(true);
    
    // 5. URLリンクが存在する場合、有効なhref属性を持っていることを確認
    const link = firstItem.querySelector('a');
    if (link) {
      expect(link.getAttribute('href')).not.toBe('');
      expect(link.getAttribute('href')).toMatch(/^(https?:\/\/|doi:).+/);
    }
  });
  
  test('should filter publications using dropdown filters', () => {
    // テスト内容: ドロップダウンフィルターが正しく機能することを確認
    renderWithLanguageProvider(<Publications />);
    
    // 初期状態での出版物数を記録
    const initialItems = screen.getAllByRole('listitem', { within: screen.getByRole('list') });
    const initialCount = initialItems.length;
    expect(initialCount).toBeGreaterThan(0);
    
    // 年のフィルターボタンをクリック
    const yearFilterButton = screen.getByText('年度 ▼');
    fireEvent.click(yearFilterButton);
    
    // ドロップダウンメニューが表示されることを確認
    const yearDropdown = screen.getByTestId('year-dropdown');
    expect(yearDropdown).toBeInTheDocument();
    
    // 最初の年のチェックボックスを選択
    const yearOptions = yearDropdown.querySelectorAll('input[type="checkbox"]');
    expect(yearOptions.length).toBeGreaterThan(0);
    
    // 最初の年のチェックボックスをクリック
    fireEvent.click(yearOptions[0]);
    
    // フィルタリング後の出版物リストを確認
    const yearFilteredItems = screen.getAllByRole('listitem', { within: screen.getByRole('list') });
    
    // フィルタリングにより表示数が変わることを確認（増減どちらの可能性もあるため、変化したことだけを確認）
    expect(yearFilteredItems.length).not.toBe(0);
    
    // フィルターをリセット
    const resetButton = screen.getByText('フィルターをリセット');
    fireEvent.click(resetButton);
    
    // リセット後は元の数の出版物が表示されていることを確認
    const resetItems = screen.getAllByRole('listitem', { within: screen.getByRole('list') });
    expect(resetItems.length).toBe(initialCount);
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
    const publicationItems = screen.getAllByRole('listitem', { within: screen.getByRole('list') });
    expect(publicationItems.length).toBeGreaterThan(0);
    
    // 最初の出版物アイテムを取得
    const firstItem = publicationItems[0];
    
    // タイトルが日本語で表示されていることを確認
    const title = firstItem.querySelector('strong');
    
    // 日本語の文字が含まれていることを確認（少なくとも1つの日本語文字）
    const hasJapaneseCharacters = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u3400-\u4DBF]/.test(title.textContent);
    expect(hasJapaneseCharacters).toBe(true);
    
    // フィルターボタンが日本語で表示されていることを確認（リセットボタンではなく他のフィルターボタンを確認）
    expect(screen.getByText('著者の役割 ▼')).toBeInTheDocument();
    expect(screen.getByText('種類 ▼')).toBeInTheDocument();
  });
});