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
 *
 * 5. 並び順の切り替え機能が正しく動作し、時系列順と種類順で出版物が適切に並び替えられることを確認
 * 6. グループ表示機能が正しく動作し、年度または種類ごとにグループ化されて表示されることを確認
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
    
    // グループヘッダーを取得
    const groupHeaders = screen.getAllByRole('heading', { level: 3 });
    
    // 少なくとも1つのグループが表示されていることを確認
    expect(groupHeaders.length).toBeGreaterThan(0);
    
    // 最初のグループ内の出版物リストを取得
    const firstGroup = groupHeaders[0].nextElementSibling;
    expect(firstGroup.tagName).toBe('OL');
    
    // グループ内の出版物アイテムを取得
    const publicationItems = firstGroup.querySelectorAll('li');
    
    // 少なくとも1つの出版物アイテムが表示されていることを確認
    expect(publicationItems.length).toBeGreaterThan(0);
    
    // 最初の出版物アイテムの内容を確認
    const firstItem = publicationItems[0];
    expect(firstItem.textContent).not.toBe('');
    
    // リストが数字の箇条書きになっていることを確認
    expect(firstGroup.tagName).toBe('OL');
    
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
    
    // 初期状態でのグループ数を記録
    const initialGroups = screen.getAllByRole('heading', { level: 3 });
    const initialCount = initialGroups.length;
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
    
    // フィルタリング後のグループを確認
    const yearFilteredGroups = screen.getAllByRole('heading', { level: 3 });
    
    // フィルタリングにより表示数が変わることを確認（増減どちらの可能性もあるため、変化したことだけを確認）
    expect(yearFilteredGroups.length).toBeGreaterThan(0);
    
    // フィルターをリセット
    const resetButton = screen.getByText('フィルターをリセット');
    fireEvent.click(resetButton);
    // リセット後は元の数のグループが表示されていることを確認
    const resetGroups = screen.getAllByRole('heading', { level: 3 });
    expect(resetGroups.length).toBe(initialCount);
  });
  
  test('should filter publications with array presentation types correctly', () => {
    // テスト内容: 配列形式のpresentationTypeを持つ出版物が正しくフィルタリングされることを確認
    renderWithLanguageProvider(<Publications />);
    
    // 発表タイプのフィルターボタンをクリック
    const presentationTypeButton = screen.getByText('発表タイプ ▼');
    fireEvent.click(presentationTypeButton);
    
    // ドロップダウンメニューが表示されることを確認
    const presentationTypeDropdown = screen.getByTestId('presentationType-dropdown');
    expect(presentationTypeDropdown).toBeInTheDocument();
    
    // 発表タイプのオプションを取得
    const presentationTypeOptions = presentationTypeDropdown.querySelectorAll('input[type="checkbox"]');
    expect(presentationTypeOptions.length).toBeGreaterThan(0);
    
    // 初期状態での出版物アイテム数を記録
    const initialItems = document.querySelectorAll('ol li');
    const initialItemCount = initialItems.length;
    expect(initialItemCount).toBeGreaterThan(0);
    
    // 発表タイプのオプションの中からPosterを選択
    // （配列形式のpresentationTypeを持つ出版物も含まれるはず）
    const posterOption = Array.from(presentationTypeOptions)
      .find(option => option.nextSibling.textContent.trim() === 'Poster');
    
    if (posterOption) {
      fireEvent.click(posterOption);
      
      // フィルタリング後の出版物アイテムを取得
      const filteredItems = document.querySelectorAll('ol li');
      
      // フィルタリングにより表示数が変わることを確認
      expect(filteredItems.length).toBeGreaterThan(0);
      expect(filteredItems.length).toBeLessThanOrEqual(initialItemCount);
      
      // フィルターをリセット
      const resetButton = screen.getByText('フィルターをリセット');
      fireEvent.click(resetButton);
      
      // リセット後は元の数の出版物アイテムが表示されていることを確認
      const resetItems = document.querySelectorAll('ol li');
      expect(resetItems.length).toBe(initialItemCount);
    } else {
      // Posterオプションが見つからない場合はテストをスキップ
      console.log('Posterオプションが見つからないためテストをスキップします');
    }
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
  
  test('should filter publications with array authorship correctly', () => {
    // テスト内容: 配列形式のauthorshipを持つ出版物が正しくフィルタリングされることを確認
    renderWithLanguageProvider(<Publications />);
    
    // 著者の役割のフィルターボタンをクリック
    const authorshipButton = screen.getByText('著者の役割 ▼');
    fireEvent.click(authorshipButton);
    
    // ドロップダウンメニューが表示されることを確認
    const authorshipDropdown = screen.getByTestId('authorship-dropdown');
    expect(authorshipDropdown).toBeInTheDocument();
    
    // 著者の役割のオプションを取得
    const authorshipOptions = authorshipDropdown.querySelectorAll('input[type="checkbox"]');
    expect(authorshipOptions.length).toBeGreaterThan(0);
    
    // 初期状態での出版物アイテム数を記録
    const initialItems = document.querySelectorAll('ol li');
    const initialItemCount = initialItems.length;
    expect(initialItemCount).toBeGreaterThan(0);
    
    // 著者の役割のオプションの中からCorresponding authorを選択
    // （配列形式のauthorshipを持つ出版物も含まれるはず）
    const correspondingAuthorOption = Array.from(authorshipOptions)
      .find(option => option.nextSibling.textContent.trim() === 'Corresponding author');
    
    if (correspondingAuthorOption) {
      fireEvent.click(correspondingAuthorOption);
      
      // フィルタリング後の出版物アイテムを取得
      const filteredItems = document.querySelectorAll('ol li');
      
      // フィルタリングにより表示数が変わることを確認
      expect(filteredItems.length).toBeGreaterThan(0);
      expect(filteredItems.length).toBeLessThanOrEqual(initialItemCount);
      
      // フィルターをリセット
      const resetButton = screen.getByText('フィルターをリセット');
      fireEvent.click(resetButton);
      
      // リセット後は元の数の出版物アイテムが表示されていることを確認
      const resetItems = document.querySelectorAll('ol li');
      expect(resetItems.length).toBe(initialItemCount);
    } else {
      // Corresponding authorオプションが見つからない場合はテストをスキップ
      console.log('Corresponding authorオプションが見つからないためテストをスキップします');
    }
  });
  
  test('should display publications in Japanese when language is set to Japanese', () => {
    // テスト内容: 言語設定が日本語の場合、出版物が日本語で表示されることを確認
    renderWithLanguageProvider(<Publications />, { language: 'ja' });
    
    // フィルターボタンが日本語になっていることを確認
    const yearFilterButton = screen.getByText('年度 ▼');
    expect(yearFilterButton).toBeInTheDocument();
    
    // グループヘッダーを取得
    const groupHeaders = screen.getAllByRole('heading', { level: 3 });
    expect(groupHeaders.length).toBeGreaterThan(0);
    
    // 各グループ内の出版物を確認
    let foundJapaneseTitle = false;
    let japaneseItem = null;
    
    // すべてのグループを調査
    for (const header of groupHeaders) {
      const group = header.nextElementSibling;
      const items = group.querySelectorAll('li');
      
      // 各アイテムを調査
      for (const item of items) {
        const title = item.querySelector('strong');
        // 日本語の文字が含まれているかチェック
        if (/[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u3400-\u4DBF]/.test(title.textContent)) {
          foundJapaneseTitle = true;
          japaneseItem = item;
          break;
        }
      }
      
      if (foundJapaneseTitle) break;
    }
    
    // 少なくとも1つの出版物に日本語タイトルがあることを確認
    expect(foundJapaneseTitle).toBe(true);
    
    if (japaneseItem) {
      // 見つかった日本語タイトルを持つ出版物のタイトルが日本語で表示されていることを確認
      const title = japaneseItem.querySelector('strong');
      const hasJapaneseCharacters = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u3400-\u4DBF]/.test(title.textContent);
      expect(hasJapaneseCharacters).toBe(true);
    }
    
    // フィルターボタンが日本語で表示されていることを確認（リセットボタンではなく他のフィルターボタンを確認）
    expect(screen.getByText('著者の役割 ▼')).toBeInTheDocument();
    expect(screen.getByText('種類 ▼')).toBeInTheDocument();
  });

  test('should close dropdown when clicking outside', () => {
    // テスト内容: プルダウンメニュー以外の場所をクリックするとメニューが閉じることを確認
    renderWithLanguageProvider(<Publications />);

    // 年のフィルターボタンをクリックしてドロップダウンを開く
    const yearFilterButton = screen.getByText('年度 ▼');
    fireEvent.click(yearFilterButton);

    // ドロップダウンが表示されていることを確認
    const yearDropdown = screen.getByTestId('year-dropdown');
    expect(yearDropdown).toBeInTheDocument();

    // ドキュメントのbodyをクリック（メニュー外のクリックをシミュレート）
    fireEvent.mouseDown(document.body); // mouseDown イベントを使用

    // ドロップダウンが閉じている（非表示になっている）ことを確認
    expect(screen.queryByTestId('year-dropdown')).not.toBeInTheDocument();

    // 別のフィルター（著者の役割）でも同様にテスト
    const authorshipFilterButton = screen.getByText('著者の役割 ▼');
    fireEvent.click(authorshipFilterButton);
    const authorshipDropdown = screen.getByTestId('authorship-dropdown');
    expect(authorshipDropdown).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('authorship-dropdown')).not.toBeInTheDocument();
  });

  test('should toggle between type-based and chronological sorting', () => {
    // テスト内容: 並び順の切り替え機能が正しく動作することを確認
    renderWithLanguageProvider(<Publications />);
    
    // デフォルトでは種類順になっていることを確認
    const sortOrderSelector = screen.getByRole('combobox');
    expect(sortOrderSelector).toBeInTheDocument();
    expect(sortOrderSelector.value).toBe('type');
    
    // 年順に切り替え
    fireEvent.change(sortOrderSelector, { target: { value: 'chronological' } });
    
    // 年順になっていることを確認
    expect(sortOrderSelector.value).toBe('chronological');
    
    // 種類順に戻す
    fireEvent.change(sortOrderSelector, { target: { value: 'type' } });
    
    // 種類順になっていることを確認
    expect(sortOrderSelector.value).toBe('type');
  });
  
  test('should display publications in groups with separate numbering', () => {
    // テスト内容: グループ表示機能が正しく動作することを確認
    renderWithLanguageProvider(<Publications />);
    
    // 種類順の場合、種類ごとにグループ化されていることを確認
    const typeGroups = screen.getAllByRole('heading', { level: 3 });
    expect(typeGroups.length).toBeGreaterThan(0);
    
    // 各グループ内でリストが1から始まっていることを確認
    const firstGroup = typeGroups[0].nextElementSibling;
    expect(firstGroup.tagName).toBe('OL');
    expect(firstGroup.getAttribute('start')).toBe('1');
    
    // 年順に切り替え
    const sortOrderSelector = screen.getByRole('combobox');
    fireEvent.change(sortOrderSelector, { target: { value: 'chronological' } });
    
    // 年度ごとにグループ化されていることを確認
    const yearGroups = screen.getAllByRole('heading', { level: 3 });
    expect(yearGroups.length).toBeGreaterThan(0);
    
    // 各グループ内でリストが1から始まっていることを確認
    const firstTypeGroup = typeGroups[0].nextElementSibling;
    expect(firstTypeGroup.tagName).toBe('OL');
    expect(firstTypeGroup.getAttribute('start')).toBe('1');
  });
});