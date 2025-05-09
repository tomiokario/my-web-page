/**
 * PublicationItemコンポーネントのテスト
 *
 * このテストファイルでは、単一の出版物エントリを表示するPublicationItemコンポーネントの
 * 機能をテストします。
 *
 * テスト内容：
 * 1. コンポーネントが正しくレンダリングされること
 * 2. 出版物データが正しく表示されること
 * 3. 言語設定に応じて適切なテキストが表示されること
 * 4. 配列形式のデータ（authorship, presentationType）が正しく表示されること
 */

import React from 'react';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PublicationItem from '../components/publications/PublicationItem';
import { renderWithProviders } from '../test-utils/test-utils';
import { Publication } from '../types';
import { createPublication } from '../test-utils/factories/publicationFactory'; // ファクトリ関数をインポート

// ファクトリ関数を使用してテストデータを生成
const mockPublication = createPublication({
  id: 1,
  name: "Rio Tomioka and Masanori Takabayashi, \"Numerical simulations of neural network hardware based on self-referential holography,\"",
  japanese: "冨岡莉生, 高林正典, \"自己参照型ホログラフィに基づくニューラルネットワークハードウェアの数値シミュレーション,\"",
  type: "Research paper (international conference)：国際会議",
  review: "Reviewed",
  authorship: "Lead author", // 文字列として渡す
  presentationType: "Oral", // 文字列として渡す
  doi: "10.1234/example",
  webLink: "https://example.com",
  date: "2021年10月3日 → 2021年10月6日",
  startDate: "2021-10-03",
  endDate: "2021-10-06",
  sortableDate: "2021-10-03",
  year: 2021,
  others: "Best Paper Award",
  site: "online",
  journalConference: "ISOM21"
}, 0); // index 0

// 配列形式のauthorshipとpresentationTypeを持つモックデータ
const mockPublicationWithArrays = createPublication({
  ...mockPublication, // 基本データをコピー
  id: 2,
  authorship: ["Corresponding author", "Lead author"], // 配列で上書き
  presentationType: ["Oral", "Poster"] // 配列で上書き
}, 1); // index 1

describe('PublicationItem Component', () => {
  // 基本的なレンダリングテスト
  test('renders publication item correctly', () => {
    renderWithProviders(<PublicationItem publication={mockPublication} language="en" />);
    
    // タイトルが表示されていることを確認
    expect(screen.getByText(mockPublication.name)).toBeInTheDocument();
    
    // タグが表示されていることを確認
    const tagsContainer = screen.getByTestId('tags-container');
    expect(tagsContainer).toBeInTheDocument();
    
    // 年のタグが表示されていることを確認
    expect(screen.getByText('2021')).toBeInTheDocument();
    
    // authorshipのタグが表示されていることを確認
    expect(screen.getByText('Lead author')).toBeInTheDocument();
    
    // typeのタグが表示されていることを確認
    expect(screen.getByText(mockPublication.type)).toBeInTheDocument();
    
    // reviewのタグが表示されていることを確認
    expect(screen.getByText('Reviewed')).toBeInTheDocument();
    
    // presentationTypeのタグが表示されていることを確認
    expect(screen.getByText('Oral')).toBeInTheDocument();
    
    // ジャーナル名が表示されていることを確認
    expect(screen.getByText('ISOM21')).toBeInTheDocument();
    
    // 日付と場所が表示されていることを確認
    expect(screen.getByText(/Date:/)).toBeInTheDocument();
    expect(screen.getByText(/2021-10-03 → 2021-10-06/)).toBeInTheDocument();
    expect(screen.getByText(/Location:/)).toBeInTheDocument();
    expect(screen.getByText(/online/)).toBeInTheDocument();
    
    // DOIリンクが表示されていることを確認
    const doiLink = screen.getByText('10.1234/example');
    expect(doiLink).toBeInTheDocument();
    expect(doiLink.closest('a')).toHaveAttribute('href', 'https://doi.org/10.1234/example');
    
    // WebLinkが表示されていることを確認
    const webLink = screen.getByText('https://example.com');
    expect(webLink).toBeInTheDocument();
    expect(webLink.closest('a')).toHaveAttribute('href', 'https://example.com');
    
    // Othersが表示されていることを確認
    expect(screen.getByText('Best Paper Award')).toBeInTheDocument();
  });
  
  // 言語設定に応じたテキスト表示のテスト
  test('displays Japanese title when language is set to ja', () => {
    renderWithProviders(<PublicationItem publication={mockPublication} language="ja" />);
    
    // 日本語のタイトルが表示されていることを確認
    expect(screen.getByText(mockPublication.japanese)).toBeInTheDocument();
    
    // 日本語のラベルが表示されていることを確認
    expect(screen.getByText(/日付:/)).toBeInTheDocument();
    expect(screen.getByText(/場所:/)).toBeInTheDocument();
  });
  
  // 配列形式のデータ表示のテスト
  test('renders array-type authorship and presentationType correctly', () => {
    renderWithProviders(<PublicationItem publication={mockPublicationWithArrays} language="en" />);
    
    // 複数のauthorshipタグが表示されていることを確認
    expect(screen.getByText('Corresponding author')).toBeInTheDocument();
    expect(screen.getByText('Lead author')).toBeInTheDocument();
    
    // 複数のpresentationTypeタグが表示されていることを確認
    expect(screen.getByText('Oral')).toBeInTheDocument();
    expect(screen.getByText('Poster')).toBeInTheDocument();
  });
  
  // 省略可能なフィールドが欠けている場合のテスト
  test('handles missing optional fields gracefully', () => {
    // ファクトリ関数を使用して、省略可能なフィールドを空文字列で上書き
    const publicationWithMissingFields = createPublication({
      ...mockPublication, // 基本データをコピー
      id: 3, // IDを変更
      doi: '',
      webLink: '',
      site: '',
      others: ''
    }, 2); // index 2

    renderWithProviders(<PublicationItem publication={publicationWithMissingFields} language="en" />);
    
    // DOIリンクが表示されていないことを確認
    expect(screen.queryByText(/DOI:/)).not.toBeInTheDocument();
    
    // WebLinkが表示されていないことを確認
    expect(screen.queryByText('https://example.com')).not.toBeInTheDocument();
    
    // 場所が表示されていないことを確認
    expect(screen.queryByText(/Location:/)).not.toBeInTheDocument();
    
    // Othersが表示されていないことを確認
    expect(screen.queryByText('Best Paper Award')).not.toBeInTheDocument();
  });
});