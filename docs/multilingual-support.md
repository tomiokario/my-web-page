# 多言語対応

このドキュメントでは、my-web-pageプロジェクトの多言語対応（日本語/英語）の実装について説明します。

## 概要

my-web-pageは、日本語と英語の2つの言語をサポートしています。言語切り替え機能は以下のコンポーネントで構成されています：

1. **LanguageContext**: 言語状態を管理するReactコンテキスト
2. **useLanguage**: 言語コンテキストを使用するためのカスタムフック
3. **locales**: 各言語のテキストリソースを定義するファイル
4. **言語固有のマークダウンファイル**: 各言語のコンテンツを格納するマークダウンファイル

## 言語コンテキスト

言語コンテキストは、アプリケーション全体で言語設定を共有するために使用されます。

### LanguageContext.js

```jsx
// src/contexts/LanguageContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

// 言語コンテキストを作成
const LanguageContext = createContext();

// 言語プロバイダーコンポーネント
export const LanguageProvider = ({ children }) => {
  // ローカルストレージから言語設定を取得するか、デフォルトで日本語を使用
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'ja'; // デフォルトは日本語
  });

  // 言語が変更されたらローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // 言語を切り替える関数
  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'ja' ? 'en' : 'ja');
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// カスタムフック - 言語コンテキストを使用するためのフック
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
```

### 主な機能

- **言語状態の管理**: `language` 状態変数で現在の言語（'ja'または'en'）を管理します。
- **ローカルストレージとの連携**: ユーザーの言語設定をローカルストレージに保存し、ページ再読み込み後も設定を維持します。
- **言語切り替え機能**: `toggleLanguage` 関数で日本語と英語を切り替えます。
- **コンテキストプロバイダー**: アプリケーション全体で言語設定を共有するためのプロバイダーを提供します。
- **カスタムフック**: `useLanguage` フックでコンポーネントから言語設定にアクセスできます。

## 言語リソース

言語リソースは、`src/locales` ディレクトリ内の言語ファイルで定義されています。

### locales/index.js

```jsx
// src/locales/index.js
import en from './en';
import ja from './ja';

// 言語リソースをまとめたオブジェクト
const locales = {
  en,
  ja
};

export default locales;
```

### locales/ja.js（日本語リソース）

```jsx
// src/locales/ja.js
const ja = {
  // ヘッダーメニュー
  header: {
    home: 'ホーム',
    profileCV: 'プロフィール・CV',
    publications: '出版物',
    works: '業務'
  },
  // サブヘッダー
  subheader: {
    home: '冨岡 莉生 (TOMIOKA Rio)',
    profileCV: 'プロフィール & 履歴書 (CV)',
    publications: '出版物',
    works: '業務',
    computerSystem2025: 'コンピュータシステム(2025)'
  },
  // フッター
  footer: {
    copyright: '© 2025 冨岡 莉生'
  },
  // 言語切り替えボタン
  languageSwitch: {
    switchTo: '英語に切り替え'
  }
};

export default ja;
```

### locales/en.js（英語リソース）

```jsx
// src/locales/en.js
const en = {
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
```

## 言語リソースの使用方法

コンポーネント内で言語リソースを使用する方法は以下の通りです：

```jsx
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import locales from '../locales';

function MyComponent() {
  const { language } = useLanguage();
  const texts = locales[language];
  
  return (
    <div>
      <h1>{texts.header.home}</h1>
      <p>{texts.footer.copyright}</p>
    </div>
  );
}

export default MyComponent;
```

## 言語切り替えボタンの実装

ヘッダーコンポーネントには、言語を切り替えるためのボタンが実装されています：

```jsx
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import locales from '../locales';

function Header() {
  const { language, toggleLanguage } = useLanguage();
  const texts = locales[language];
  
  return (
    <header>
      {/* ナビゲーションメニュー等 */}
      <button onClick={toggleLanguage}>
        {texts.languageSwitch.switchTo}
      </button>
    </header>
  );
}

export default Header;
```

## 言語固有のマークダウンコンテンツ

マークダウンコンテンツも多言語対応しています。詳細は[マークダウンコンテンツ](./markdown-content.md)のドキュメントを参照してください。

## 多言語対応のテスト

多言語対応の機能は、`src/__tests__/LanguageContext.test.js`でテストされています。テストでは以下の点を確認しています：

- デフォルト言語が正しく設定されるか
- 言語切り替え機能が正しく動作するか
- ローカルストレージに言語設定が保存されるか

テストの詳細については、[テスト戦略](./testing-strategy.md)のドキュメントを参照してください。

## 多言語対応の拡張

新しい言語を追加する場合は、以下の手順に従ってください：

1. `src/locales` ディレクトリに新しい言語ファイル（例：`fr.js`）を作成します。
2. `src/locales/index.js` に新しい言語を追加します。
3. `public/markdown` ディレクトリに新しい言語のサブディレクトリ（例：`fr`）を作成し、マークダウンファイルを追加します。
4. `LanguageContext.js` の `toggleLanguage` 関数を修正して、複数の言語間で切り替えられるようにします。

## 注意点

- 言語切り替えはクライアントサイドで行われるため、SEO対策が必要な場合は追加の対応が必要です。
- 現在のシステムは2言語のみをサポートしていますが、3言語以上に拡張する場合は、`toggleLanguage` 関数の修正が必要です。