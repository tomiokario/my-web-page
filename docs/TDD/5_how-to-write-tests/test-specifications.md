# テストコード仕様書

このドキュメントでは、本プロジェクトのテストコードに関する仕様と標準を定義します。テストコードを書く際のガイドラインとして参照してください。

## 目次

1. [テスト仕様の概要](#テスト仕様の概要)
2. [テストファイルの構造と命名規則](#テストファイルの構造と命名規則)
3. [テストの記述スタイル](#テストの記述スタイル)
4. [テストの種類と実装方法](#テストの種類と実装方法)
5. [モックの使用ガイドライン](#モックの使用ガイドライン)
6. [テスト環境とツール](#テスト環境とツール)
7. [テストの実行方法](#テストの実行方法)

## テスト仕様の概要

### テスト哲学

本プロジェクトでは、テスト駆動開発（TDD）のアプローチを採用しています。TDDは「Red-Green-Refactor」サイクルに基づいて開発を進める手法です：

1. **Red**: まず、失敗するテストを書く
2. **Green**: テストが成功するように最小限のコードを実装する
3. **Refactor**: コードをリファクタリングする

このサイクルを繰り返すことで、テストによって裏付けられた高品質なコードを段階的に構築していきます。

### テストの目的

テストコードは以下の目的で作成されています：

1. **機能の正確性を確認する**: コンポーネントやユーティリティが期待通りに動作することを確認します。
2. **リグレッションを防止する**: 既存の機能が新しい変更によって壊れていないことを確認します。
3. **コードの品質を向上させる**: テストを書くことで、コードの設計や実装の問題を早期に発見できます。
4. **ドキュメントとして機能する**: テストコードは、コンポーネントの使用方法を示すドキュメントとしても機能します。

### テストカバレッジの目標

本プロジェクトでは、以下のテストカバレッジ目標を設定しています：

- **コンポーネント**: すべてのReactコンポーネントに対して、基本的なレンダリングテストと主要な機能テストを実装する。
- **ユーティリティ関数**: すべてのユーティリティ関数に対して、正常系と異常系のテストを実装する。
- **カバレッジ率**: カバレッジ100%を目指すのではなく、重要な機能や複雑なロジックのカバレッジを優先する。

## テストファイルの構造と命名規則

### テストファイルの配置

テストファイルは `src/__tests__` ディレクトリに配置します：

```
src/
├── __tests__/        # テストファイルを配置するディレクトリ
│   ├── App.test.jsx
│   ├── Footer.test.jsx
│   └── SubHeader.test.jsx
├── components/       # コンポーネントファイル
│   ├── Footer.jsx
│   └── SubHeader.jsx
└── App.jsx           # アプリケーションのルートコンポーネント
```

### 命名規則

テストファイルは、テスト対象のファイル名に `.test.jsx` または `.test.js` を付けて命名します：

- `App.jsx` → `App.test.jsx`
- `Footer.jsx` → `Footer.test.jsx`
- `markdownLoader.js` → `markdownLoader.test.js`

### テストファイルの構造

各テストファイルは以下の構造に従います：

1. **ヘッダーコメント**: テスト対象のコンポーネントや機能の説明、テスト内容の概要を記述します。
2. **インポート**: 必要なモジュールやコンポーネントをインポートします。
3. **モックの設定**: 必要に応じてモックを設定します。
4. **テストスイート**: `describe` ブロックでテストをグループ化します。
5. **個別のテスト**: `test` または `it` 関数で個別のテストケースを定義します。

例：

```jsx
/**
 * Footerコンポーネントのテスト
 *
 * このテストファイルでは、Footerコンポーネントの機能をテストします。
 * Footerコンポーネントは、言語設定に応じたコピーライト情報を表示する
 * シンプルなコンポーネントです。
 *
 * テスト内容：
 * 1. コンポーネントが正常にレンダリングされるか
 * 2. 日本語モードでのコピーライト表示
 * 3. 英語モードでのコピーライト表示
 * 4. footer要素の存在確認
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "../components/Footer";
import { LanguageProvider } from "../contexts/LanguageContext";
import locales from "../locales";

// テスト用のラッパーコンポーネント
const TestWrapper = ({ children, initialLanguage = "ja" }) => {
  // ...
};

// Footerコンポーネントのテスト
describe("Footer component", () => {
  // 基本的なレンダリングテスト
  test("renders without crashing", () => {
    // ...
  });

  // 日本語のコンテンツが正しく表示されるかテスト
  test("displays Japanese copyright text when language is ja", () => {
    // ...
  });

  // ...
});
```

## テストの記述スタイル

### テスト名の付け方

テスト名は「何をテストしているか」が明確にわかるように記述します。以下のパターンを推奨します：

- `"renders without crashing"`: 基本的なレンダリングテスト
- `"displays [something] when [condition]"`: 条件付きレンダリングのテスト
- `"calls [function] when [action] is performed"`: イベントハンドラのテスト
- `"toggles [state] when [action] is performed"`: 状態変更のテスト

### AAA（Arrange-Act-Assert）パターン

テストコードは、AAA（Arrange-Act-Assert）パターンに従って記述します：

1. **Arrange（準備）**: テストに必要な前提条件を設定します。
2. **Act（実行）**: テスト対象の機能を実行します。
3. **Assert（検証）**: 結果が期待通りであることを検証します。

例：

```jsx
test("displays Japanese copyright text when language is ja", () => {
  // Arrange: 日本語モードでコンポーネントをレンダリング
  render(
    <TestWrapper initialLanguage="ja">
      <Footer />
    </TestWrapper>
  );
  
  // Act: コピーライト要素を取得
  const copyrightElement = screen.getByText(locales.ja.footer.copyright);
  
  // Assert: 要素が存在することを確認
  expect(copyrightElement).toBeInTheDocument();
});
```

### テストコメント

テストコードには、テストの意図や重要なステップを説明するコメントを追加します。特に複雑なテストでは、各ステップの目的を明確にするためにコメントを活用します。

例：

```jsx
test("toggles language when language button is clicked", () => {
  // テスト内容: 言語切り替えボタンをクリックすると、表示言語が日本語から英語に切り替わることを確認
  render(
    <TestWrapper initialLanguage="ja">
      <Header />
    </TestWrapper>
  );
  
  // 言語切り替えボタンをクリック
  const languageButton = screen.getByRole("button", { name: locales.ja.languageSwitch.switchTo });
  fireEvent.click(languageButton);
  
  // 言語が英語に切り替わったか確認
  expect(screen.getByText(locales.en.header.home)).toBeInTheDocument();
  expect(screen.getByText(locales.en.header.profileCV)).toBeInTheDocument();
  expect(screen.getByText(locales.en.header.publications)).toBeInTheDocument();
});
```

## テストの種類と実装方法

### コンポーネントのレンダリングテスト

すべてのコンポーネントに対して、基本的なレンダリングテストを実装します。このテストでは、コンポーネントが正常にレンダリングされることを確認します。

```jsx
test("renders without crashing", () => {
  render(
    <TestWrapper>
      <Footer />
    </TestWrapper>
  );
});
```

### 要素の存在確認テスト

コンポーネントが特定の要素を正しくレンダリングしているかを確認するテストを実装します。

```jsx
test("contains footer element", () => {
  render(
    <TestWrapper>
      <Footer />
    </TestWrapper>
  );
  const footerElement = screen.getByRole("contentinfo");
  expect(footerElement).toBeInTheDocument();
});
```

### 条件付きレンダリングテスト

条件によって表示が変わるコンポーネントに対して、各条件での表示を確認するテストを実装します。

```jsx
test("displays Japanese copyright text when language is ja", () => {
  render(
    <TestWrapper initialLanguage="ja">
      <Footer />
    </TestWrapper>
  );
  const copyrightElement = screen.getByText(locales.ja.footer.copyright);
  expect(copyrightElement).toBeInTheDocument();
});

test("displays English copyright text when language is en", () => {
  render(
    <TestWrapper initialLanguage="en">
      <Footer />
    </TestWrapper>
  );
  const copyrightElement = screen.getByText(locales.en.footer.copyright);
  expect(copyrightElement).toBeInTheDocument();
});
```

### ユーザーインタラクションテスト

ユーザーインタラクション（クリック、入力など）に対するコンポーネントの動作をテストします。

```jsx
test("toggles language when language button is clicked", () => {
  render(
    <TestWrapper initialLanguage="ja">
      <Header />
    </TestWrapper>
  );
  
  // 言語切り替えボタンをクリック
  const languageButton = screen.getByRole("button", { name: locales.ja.languageSwitch.switchTo });
  fireEvent.click(languageButton);
  
  // 言語が英語に切り替わったか確認
  expect(screen.getByText(locales.en.header.home)).toBeInTheDocument();
});
```

### レスポンシブデザインテスト

レスポンシブデザインのコンポーネントに対して、デスクトップ表示とモバイル表示の両方をテストします。

```jsx
describe("desktop view", () => {
  beforeEach(() => {
    // ウィンドウサイズをデスクトップサイズに設定
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  test("displays navigation links", () => {
    // ...
  });
});

describe("mobile view", () => {
  beforeEach(() => {
    // ウィンドウサイズをモバイルサイズに設定
    global.innerWidth = 480;
    global.dispatchEvent(new Event('resize'));
  });

  test("displays hamburger menu button", () => {
    // ...
  });
});
```

### 非同期処理のテスト

非同期処理（APIリクエスト、データ読み込みなど）を行うコンポーネントやユーティリティに対して、非同期テストを実装します。

```jsx
test("loads markdown file with default language (ja)", async () => {
  // 成功レスポンスをモック
  fetch.mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve("# Japanese Content")
    })
  );

  const content = await loadMarkdown("/markdown/test.md");
  
  // 正しいパスでfetchが呼ばれたか確認
  expect(fetch).toHaveBeenCalledWith("/markdown/ja/test.md");
  expect(content).toBe("# Japanese Content");
});
```

## モックの使用ガイドライン

### モックを使うべき状況

以下の状況では、モックの使用が適切または必要となります：

1. **外部サービスとの通信**: APIリクエスト、データベースアクセス、ファイルシステム操作
2. **ブラウザ環境に依存する機能**: localStorage、sessionStorage、window、document、navigator
3. **テスト環境での制約**: テスト環境で利用できないライブラリやAPIがある場合
4. **特定のエッジケースやエラー状態のテスト**: エラーハンドリング、タイムアウト、ネットワークエラー

### モックの実装方法

#### 関数やモジュールのモック

```jsx
// fetchのモック
global.fetch = jest.fn();

test("loads markdown file with default language (ja)", async () => {
  // 成功レスポンスをモック
  fetch.mockImplementationOnce(() => 
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve("# Japanese Content")
    })
  );

  // ...
});
```

#### ブラウザAPIのモック

```jsx
// ローカルストレージのモック
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});
```

#### Reactコンポーネントやフックのモック

```jsx
// React RouterのuseLocationフックをモック
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: () => ({
    pathname: "/profile-cv" // テスト用のパス
  })
}));
```

### モックを最小限に保つための戦略

1. **テスト用のラッパーコンポーネントを使用する**: モックではなく、実際のコンポーネントをラップしたテスト用コンポーネントを使用します。

```jsx
const TestWrapper = ({ children, initialLanguage = "ja" }) => {
  // localStorage のモックは必要
  const localStorageMock = (() => {
    let store = { language: initialLanguage };
    return {
      getItem: jest.fn(key => store[key]),
      setItem: jest.fn((key, value) => {
        store[key] = value;
      })
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });

  // 実際のLanguageProviderを使用
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
};
```

2. **依存関係を注入する**: コンポーネントが依存関係を受け取れるようにし、テスト時に適切な値を注入します。

```jsx
// コンポーネント
const DataDisplay = ({ fetchData = defaultFetchData }) => {
  // ...
};

// テスト
test("displays data correctly", async () => {
  const mockFetchData = jest.fn().mockResolvedValue({ name: "Test Data" });
  render(<DataDisplay fetchData={mockFetchData} />);
  // ...
});
```

## テスト環境とツール

### Jest

本プロジェクトでは、Jestをテストフレームワークとして使用しています。Jestの設定は `jest.config.js` ファイルで行われています：

```javascript
module.exports = {
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-markdown|vfile|unist|unified|bail|is-plain-obj|trough|remark|mdast|micromark|decode-named-character-reference|character-entities|property-information|hast|space-separated-tokens|comma-separated-tokens|estree-walker)/)'
  ],
  testEnvironment: 'jsdom'
};
```

### React Testing Library

Reactコンポーネントのテストには、React Testing Libraryを使用しています。React Testing Libraryは、実際のユーザーがコンポーネントをどのように使用するかという観点からテストを書くことを促進するライブラリです。

主な機能：

- **要素の取得**: `getByText`, `getByRole`, `getByLabelText` などの関数で要素を取得
- **ユーザーイベントのシミュレーション**: `fireEvent` を使用してクリックや入力などのイベントをシミュレート
- **非同期テスト**: `waitFor`, `findByText` などの関数で非同期処理をテスト

### jest-dom

jest-domは、DOMに関する追加のマッチャーを提供するライブラリです。`toBeInTheDocument`, `toHaveClass`, `toHaveValue` などのマッチャーを使用して、DOM要素の状態を検証できます。

設定は `src/setupTests.js` ファイルで行われています：

```javascript
// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// テスト環境のグローバル設定をここに追加できます
```

## テストの実行方法

### すべてのテストを実行

```bash
npm test
```

### 特定のテストファイルを実行

```bash
npm test src/__tests__/Footer.test.jsx
```

### テストカバレッジを確認

```bash
npm test -- --coverage
```

### テストの監視モード

```bash
npm test -- --watch
```

## まとめ

本プロジェクトのテストコードは、TDDの原則に基づいて作成されています。テストコードを書く際は、以下のポイントを意識してください：

1. **ユーザー視点でテストを書く**: 実際のユーザーがコンポーネントをどのように使用するかという観点からテストを書きます。
2. **アクセシビリティを考慮する**: `getByRole` などのクエリを使用して、アクセシビリティを考慮したテストを書きます。
3. **実装の詳細ではなく、動作をテストする**: コンポーネントの内部実装ではなく、外部から観察可能な動作をテストします。
4. **テストを読みやすく保つ**: テストコードは、コンポーネントの使用方法を示すドキュメントとしても機能します。
5. **モックは最小限に**: モックは必要な部分だけにとどめ、可能な限り実際のコンポーネントを使用します。

これらの原則に従うことで、メンテナンスしやすく、信頼性の高いテストを書くことができます。

## 関連ドキュメント

- [テスト駆動開発（TDD）基本ガイド](../TDD/basic-guide.md)
- [Reactコンポーネントテストの書き方](../TDD/component-testing.md)
- [外部依存関係を持つコンポーネントのテスト](../TDD/testing-with-dependencies.md)
- [モックの適切な使用方法](../TDD/when-to-use-mocks.md)