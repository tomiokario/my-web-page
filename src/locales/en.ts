import { LocaleMessages } from "./types";

const en: LocaleMessages = {
  // ヘッダーメニュー
  header: {
    home: 'Home',
    profileCV: 'Profile & CV',
    profileCVShort: 'Profile',
    publications: 'Publications',
    works: 'Works'
  },
  // サブヘッダー
  subheader: {
    home: 'TOMIOKA Rio',
    profileCV: 'Profile & Curriculum Vitae (CV)',
    publications: 'Publications',
    works: 'Works',
    computerSystem2025: 'Computer System (2025)',
    publicationAdmin: 'Publication Master Data'
  },
  // フッター
  footer: {
    copyright: '© 2026 TOMIOKA Rio'
  },
  // 言語切り替えボタン
  languageSwitch: {
    switchTo: 'Switch to Japanese'
  },
  common: {
    loading: 'Loading...',
    back: 'Back',
    backToWorks: '← Back to Works'
  },
  publications: {
    year: 'Year',
    authorship: 'Authorship',
    type: 'Type',
    review: 'Review',
    presentationType: 'Presentation Type',
    resetFilters: 'Reset Filters',
    sortByType: 'By type',
    sortByChronological: 'By year',
    showAbstract: 'Show abstract',
    hideAbstract: 'Hide abstract',
    abstractLabel: 'Abstract'
  },
  publicationAdmin: {
    title: 'Publication Master Data',
    description: 'Browse researchmap-aligned master data and save it back to the local JSON file.',
    localOnly: 'This screen is available only during local development.',
    openFile: 'Open master JSON',
    selectedFile: 'Selected file',
    openFileHint: 'Open `src/data/publication_master.json` before saving.',
    unsupported: 'This browser does not support direct file saving.',
    search: 'Search by ID, title, or venue',
    listTitle: 'Publications',
    editTitle: 'Selected publication',
    save: 'Save JSON',
    saveDisabled: 'Open a destination file to enable saving.',
    saveSuccess: 'Saved the master data.',
    saveError: 'Failed to save the master data.',
    openSuccess: 'Loaded the master data.',
    openError: 'Failed to load the master data.',
    regenHint: 'Run `npm run convert-publications` after saving to regenerate the web JSON.',
    noResults: 'No matching publications were found.',
    noSelection: 'Select a publication to edit.',
    rawCitation: 'Raw citation / auxiliary fields',
    compatibility: 'Compatibility hints for the current web view'
  }
};

export default en;
