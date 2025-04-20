// 英語のリソースファイル
interface EnLocale {
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
}

const en: EnLocale = {
  // ヘッダーメニュー
  header: {
    home: 'Home',
    profileCV: 'Profile & CV',
    publications: 'Publications',
    works: 'Works'
  },
  // サブヘッダー
  subheader: {
    home: 'TOMIOKA Rio',
    profileCV: 'Profile & Curriculum Vitae (CV)',
    publications: 'Publications',
    works: 'Works',
    computerSystem2025: 'Computer System (2025)'
  },
  // フッター
  footer: {
    copyright: '© 2025 TOMIOKA Rio'
  },
  // 言語切り替えボタン
  languageSwitch: {
    switchTo: 'Switch to Japanese'
  }
};

export default en;