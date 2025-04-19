// 日本語のリソースファイル
interface JaLocale {
  header: {
    home: string;
    profileCV: string;
    publications: string;
    works: string;
  };
  subheader: {
    home: string;
    profileCV: string;
    publications: string;
    works: string;
    computerSystem2025: string;
  };
  footer: {
    copyright: string;
  };
  languageSwitch: {
    switchTo: string;
  };
  publications: {
    year: string;
    authorship: string;
    type: string;
    review: string;
    presentationType: string;
    resetFilters: string;
    sortByType: string;
    sortByChronological: string;
  };
}

const ja: JaLocale = {
  // ヘッダーメニュー
  header: {
    home: 'ホーム',
    profileCV: 'プロフィール・CV',
    publications: '出版物',
    works: '仕事'
  },
  // サブヘッダー
  subheader: {
    home: '冨岡 莉生 (TOMIOKA Rio)',
    profileCV: 'プロフィール & 履歴書 (CV)',
    publications: '出版物',
    works: '仕事',
    computerSystem2025: 'コンピュータシステム(2025)'
  },
  // フッター
  footer: {
    copyright: '© 2025 冨岡 莉生'
  },
  // 言語切り替えボタン
  languageSwitch: {
    switchTo: '英語に切り替え'
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
    sortByChronological: '年で表示'
  }
};

export default ja;