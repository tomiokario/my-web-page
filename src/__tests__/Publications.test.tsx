import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import Publications from '../pages/Publications';
import { renderWithProviders } from '../test-utils/test-utils';

jest.mock('../data/publications.json', () => ({
  __esModule: true,
  default: [
    {
      id: 1,
      hasEmptyFields: false,
      name: 'Alpha Journal Paper',
      japanese: 'アルファ原著論文',
      type: 'Journal paper：原著論文',
      review: 'Reviewed',
      authorship: 'Lead author',
      presentationType: '',
      doi: 'https://doi.org/10.1000/alpha',
      webLink: 'https://example.com/alpha',
      date: '2024年6月21日',
      startDate: '2024-06-21',
      endDate: '2024-06-21',
      sortableDate: '2024-06-21',
      others: 'SharedIt link',
      site: 'Tokyo',
      journalConference: 'Optical Review'
    },
    {
      id: 2,
      hasEmptyFields: false,
      name: 'Beta Conference Paper',
      japanese: '',
      type: 'Research paper (international conference)：国際会議',
      review: 'Reviewed',
      authorship: 'Co-author',
      presentationType: 'Poster',
      doi: '',
      webLink: 'https://example.com/beta',
      date: '2023年8月10日',
      startDate: '2023-08-10',
      endDate: '2023-08-12',
      sortableDate: '2023-08-10',
      others: '',
      site: 'Osaka',
      journalConference: 'IWH2023'
    },
    {
      id: 3,
      hasEmptyFields: false,
      name: 'Gamma Misc Talk',
      japanese: 'ガンマ発表',
      type: 'Miscellaneous',
      review: 'Not reviewed',
      authorship: 'Corresponding author',
      presentationType: 'Oral',
      doi: '',
      webLink: '',
      date: '2022年2月1日',
      startDate: '2022-02-01',
      endDate: '2022-02-01',
      sortableDate: '2022-02-01',
      others: '',
      site: 'Online',
      journalConference: 'Photonics Workshop'
    }
  ],
}), { virtual: true });

describe('Publications Component', () => {
  test('JSON から読み込んだ publication 情報を表示する', () => {
    renderWithProviders(<Publications />, { initialLanguage: 'en' });

    expect(screen.getByText('Alpha Journal Paper')).toBeInTheDocument();
    expect(screen.getAllByTestId('publication-item')).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'Journal paper：原著論文' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '10.1000/alpha' })).toHaveAttribute(
      'href',
      'https://doi.org/10.1000/alpha'
    );
    expect(screen.getByRole('link', { name: 'https://example.com/alpha' })).toHaveAttribute(
      'href',
      'https://example.com/alpha'
    );
    expect(screen.getByText('SharedIt link')).toBeInTheDocument();
  });

  test('フィルターで publication を絞り込み、リセットできる', () => {
    renderWithProviders(<Publications />, { initialLanguage: 'en' });

    fireEvent.click(screen.getByTestId('presentationType-filter-button'));
    fireEvent.click(screen.getByLabelText('Poster'));

    expect(screen.getByTestId('active-filters')).toBeInTheDocument();
    expect(screen.getByText('Beta Conference Paper')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Journal Paper')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma Misc Talk')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('reset-filters-button'));

    expect(screen.queryByTestId('active-filters')).not.toBeInTheDocument();
    expect(screen.getByText('Alpha Journal Paper')).toBeInTheDocument();
    expect(screen.getByText('Gamma Misc Talk')).toBeInTheDocument();
  });

  test('並び順の切り替えで type grouping から year grouping に変わる', () => {
    renderWithProviders(<Publications />, { initialLanguage: 'en' });

    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    ).toEqual([
      'Journal paper：原著論文',
      'Research paper (international conference)：国際会議',
      'Miscellaneous',
    ]);

    fireEvent.change(screen.getByTestId('sort-order-select'), {
      target: { value: 'chronological' }
    });

    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    ).toEqual(['2024', '2023', '2022']);
  });

  test('日本語設定では japanese title を優先し、無い場合は name にフォールバックする', () => {
    renderWithProviders(<Publications />, { initialLanguage: 'ja' });

    expect(screen.getByText('アルファ原著論文')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Journal Paper')).not.toBeInTheDocument();
    expect(screen.getByText('Beta Conference Paper')).toBeInTheDocument();
    expect(screen.getByText('ガンマ発表')).toBeInTheDocument();
  });
});
