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
    expect(firstItem.textContent).not.toBe(' () - ');
    
    // 出版物の内容が表示されていることを確認
    // 注: 著者とタイトルの分離に依存せず、出版物データの一部が表示されていることを確認
    expect(firstItem.textContent).toContain('2021');
    expect(firstItem.textContent).toContain('ISOM21');
  });
  
  test('should filter publications by year', () => {
    // テスト内容: 年度フィルターが正しく機能することを確認
    renderWithLanguageProvider(<Publications />);
    
    // 年度フィルターを取得（言語に依存しない方法で）
    const yearSelect = screen.getByRole('combobox');
    
    // 現在選択されている年度を確認
    console.log('Current selected year:', yearSelect.value);
    
    // 利用可能な年度オプションを確認
    const yearOptions = Array.from(yearSelect.options).map(option => option.value);
    console.log('Available year options:', yearOptions);
    
    // テスト内容: 年度オプションが正しく抽出されることを確認
    expect(yearOptions).toContain('2021');
    expect(yearOptions).toContain('2022');
    
    // 年度フィルターが機能するか確認
    // 2021年を選択
    fireEvent.change(yearSelect, { target: { value: '2021' } });
    
    // 2021年の出版物のみが表示されていることを確認
    const items2021 = screen.getAllByRole('listitem');
    expect(items2021.length).toBe(1);
    expect(items2021[0].textContent).toContain('2021');
    expect(items2021[0].textContent).toContain('ISOM21');
    expect(items2021[0].textContent).not.toContain('MMS2022');
    
    // 2022年に変更
    fireEvent.change(yearSelect, { target: { value: '2022' } });
    
    // 2022年の出版物のみが表示されていることを確認
    const items2022 = screen.getAllByRole('listitem');
    expect(items2022.length).toBe(1);
    expect(items2022[0].textContent).toContain('2022');
    expect(items2022[0].textContent).toContain('MMS2022');
    expect(items2022[0].textContent).not.toContain('ISOM21');
  });
  
  test('should display publications in Japanese when language is set to Japanese', () => {
    // テスト内容: 言語設定が日本語の場合、出版物が日本語で表示されることを確認
    renderWithLanguageProvider(<Publications />, { language: 'ja' });
    
    // フィルターラベルが日本語になっていることを確認
    const filterLabel = screen.getByText(/絞り込み \(年度\)/i);
    expect(filterLabel).toBeInTheDocument();
    
    // 出版物リストを確認
    const publicationItems = screen.getAllByRole('listitem');
    console.log('Japanese publication items:', publicationItems.map(item => item.textContent));
    
    // テスト内容: 日本語の内容が表示されることを確認
    
    // 日本語の内容が含まれていることを確認
    // 注: 著者とタイトルの分離に依存せず、日本語の内容が表示されていることを確認
    const firstItem = publicationItems[0];
    expect(firstItem.textContent).toContain('2021');
    expect(firstItem.textContent).toContain('ISOM21');
    
    // 日本語の内容が表示されていることを確認
    expect(firstItem.textContent).toContain('自己参照型');
    expect(firstItem.textContent).toContain('冨岡');
  });
});