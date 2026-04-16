import { LocaleMessages } from "./types";

const ja: LocaleMessages = {
  // ヘッダーメニュー
  header: {
    home: 'ホーム',
    profileCV: 'プロフィール・CV',
    profileCVShort: 'プロフィール',
    publications: '出版物',
    works: '仕事'
  },
  // サブヘッダー
  subheader: {
    home: '冨岡 莉生 (TOMIOKA Rio)',
    profileCV: 'プロフィール & 履歴書 (CV)',
    publications: '出版物',
    works: '仕事',
    computerSystem2025: 'コンピュータシステム(2025)',
    publicationAdmin: '出版物マスターデータ管理'
  },
  // フッター
  footer: {
    copyright: '© 2026 冨岡 莉生'
  },
  // 言語切り替えボタン
  languageSwitch: {
    switchTo: '英語に切り替え'
  },
  common: {
    loading: '読み込み中...',
    back: '戻る',
    backToWorks: '← 仕事一覧へ戻る'
  },
  // 出版物
  publications: {
    year: '出版年',
    authorship: '著者の役割',
    type: '種類',
    review: 'レビュー',
    presentationType: '発表タイプ',
    resetFilters: 'フィルターをリセット',
    sortByType: '種類で表示',
    sortByChronological: '年で表示',
    showAbstract: '要旨を表示',
    hideAbstract: '要旨を隠す',
    abstractLabel: '要旨'
  },
  publicationAdmin: {
    title: '出版物マスターデータ管理',
    description: 'researchmap 準拠の master data を一覧し、ローカルの JSON ファイルへ保存できます。',
    localOnly: 'この画面はローカル開発時のみ有効です。',
    openFile: 'master JSON を開く',
    selectedFile: '選択中のファイル',
    openFileHint: '保存するには `src/data/publication_master.json` を開いてください。',
    unsupported: 'このブラウザではファイルへの直接保存に対応していません。',
    search: 'ID・タイトル・誌名で検索',
    listTitle: '業績一覧',
    editTitle: '選択中の業績',
    save: 'JSON に保存',
    saveDisabled: '保存先ファイルを開くと保存できます。',
    saveSuccess: 'master data を保存しました。',
    saveError: '保存に失敗しました。',
    openSuccess: 'master data を読み込みました。',
    openError: 'master data の読み込みに失敗しました。',
    regenHint: '保存後に `npm run convert-publications` を実行すると web 表示用 JSON を再生成できます。',
    noResults: '一致する業績がありません。',
    noSelection: '業績を選択してください。',
    rawCitation: 'raw citation / 補助情報',
    compatibility: '既存表示との互換ヒント'
  }
};

export default ja;
