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
 * 4. 配列形式の authorship が正しく表示されること
 */

import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PublicationItem from '../components/publications/PublicationItem';
import { renderWithProviders } from '../test-utils/test-utils';
import { createPublication } from '../test-utils/factories/publicationFactory'; // ファクトリ関数をインポート

// ファクトリ関数を使用してテストデータを生成
const mockPublication = createPublication({
  id: 1,
  name: "Rio Tomioka and Masanori Takabayashi, \"Numerical simulations of neural network hardware based on self-referential holography,\"",
  japanese: "冨岡莉生, 高林正典, \"自己参照型ホログラフィに基づくニューラルネットワークハードウェアの数値シミュレーション,\"",
  type: "Research paper (international conference)：国際会議",
  review: "Reviewed",
  authorship: "Lead author", // 文字列として渡す
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

// 配列形式のauthorshipを持つモックデータ
const mockPublicationWithArrays = createPublication({
  ...mockPublication, // 基本データをコピー
  id: 2,
  authorship: ["Corresponding author", "Lead author"], // 配列で上書き
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
  test('renders array-type authorship correctly without standalone presentation type tags', () => {
    renderWithProviders(<PublicationItem publication={mockPublicationWithArrays} language="en" />);
    
    // 複数のauthorshipタグが表示されていることを確認
    expect(screen.getByText('Corresponding author')).toBeInTheDocument();
    expect(screen.getByText('Lead author')).toBeInTheDocument();
    expect(screen.queryByText('Oral')).not.toBeInTheDocument();
    expect(screen.queryByText('Poster')).not.toBeInTheDocument();
  });

  test('renders presentation subtype through the type tag', () => {
    const presentation = createPublication({
      ...mockPublication,
      id: 7,
      type: 'presentations/poster_presentation',
    }, 6);

    renderWithProviders(<PublicationItem publication={presentation} language="ja" />);

    expect(screen.getByText('講演・口頭発表等 / ポスター')).toBeInTheDocument();
  });

  test('renders DOI URLs without duplicating the doi.org prefix', () => {
    const publicationWithDoiUrl = createPublication({
      ...mockPublication,
      id: 4,
      doi: 'https://doi.org/10.5678/example'
    }, 3);

    renderWithProviders(<PublicationItem publication={publicationWithDoiUrl} language="en" />);

    const doiLink = screen.getByText('10.5678/example');
    expect(doiLink).toBeInTheDocument();
    expect(doiLink.closest('a')).toHaveAttribute('href', 'https://doi.org/10.5678/example');
  });

  test('toggles abstract visibility when abstract exists', () => {
    const publicationWithAbstract = createPublication({
      ...mockPublication,
      id: 5,
      abstract: 'This paper evaluates the behavior of a self-referential holographic neural network.'
    }, 4);

    renderWithProviders(<PublicationItem publication={publicationWithAbstract} language="en" />);

    expect(screen.getByTestId('abstract-toggle')).toHaveTextContent('Show abstract');
    expect(screen.queryByTestId('abstract-content')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('abstract-toggle'));

    expect(screen.getByTestId('abstract-toggle')).toHaveTextContent('Hide abstract');
    expect(screen.getByTestId('abstract-content')).toBeVisible();
    expect(screen.getByTestId('abstract-content')).toHaveTextContent(publicationWithAbstract.abstract || '');

    fireEvent.click(screen.getByTestId('abstract-toggle'));

    expect(screen.getByTestId('abstract-toggle')).toHaveTextContent('Show abstract');
    expect(screen.queryByTestId('abstract-content')).not.toBeInTheDocument();
  });

  test('does not render abstract toggle when abstract is missing', () => {
    renderWithProviders(<PublicationItem publication={mockPublication} language="en" />);

    expect(screen.queryByTestId('abstract-toggle')).not.toBeInTheDocument();
  });

  test('allows long publication text and links to wrap inside the card', () => {
    const longTitle = 'C2026' + 'VeryLongUnbrokenPublicationTitle'.repeat(8);
    const longType = 'Research-' + 'LongTypeSegment'.repeat(8);
    const longJournal = 'ProceedingsOfTheInternationalSymposiumOnNeuromorphicAIHardware'.repeat(3);
    const longDoi = '10.1234/' + 'long-doi-segment'.repeat(8);
    const longWebLink = 'https://example.com/' + 'long-url-segment/'.repeat(8);
    const longOthers = 'Award-' + 'UnbrokenSupplement'.repeat(8);
    const longAbstract = 'Abstract-' + 'UnbrokenAbstractText'.repeat(8);
    const publicationWithLongText = createPublication({
      ...mockPublication,
      id: 6,
      name: longTitle,
      type: longType,
      doi: longDoi,
      webLink: longWebLink,
      journalConference: longJournal,
      others: longOthers,
      abstract: longAbstract,
    }, 5);

    renderWithProviders(<PublicationItem publication={publicationWithLongText} language="en" />);

    expect(screen.getByTestId('publication-item')).toHaveStyle({
      maxWidth: '100%',
      minWidth: '0',
    });
    expect(screen.getByTestId('publication-title')).toHaveStyle({
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
    });
    expect(screen.getByText(longType)).toHaveStyle({
      maxWidth: '100%',
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
    });
    expect(screen.getByText(longJournal)).toHaveStyle({
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
    });
    expect(screen.getByText(longDoi)).toHaveStyle({
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
    });
    expect(screen.getByText(longWebLink)).toHaveStyle({
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
    });
    expect(screen.getByText(longOthers)).toHaveStyle({
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
    });

    fireEvent.click(screen.getByTestId('abstract-toggle'));

    expect(screen.getByTestId('abstract-content')).toHaveStyle({
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
      whiteSpace: 'pre-wrap',
    });
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
