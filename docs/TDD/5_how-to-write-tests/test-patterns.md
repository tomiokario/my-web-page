# テストパターン集

このドキュメントでは、本プロジェクトで使用されている主要なテストパターンとその実装例を紹介します。新しいテストを書く際の参考にしてください。

## 目次

1. [コンポーネントテストパターン](#コンポーネントテストパターン)
2. [ユーティリティ関数テストパターン](#ユーティリティ関数テストパターン)
3. [コンテキストテストパターン](#コンテキストテストパターン)
4. [レスポンシブデザインテストパターン](#レスポンシブデザインテストパターン)
5. [非同期処理テストパターン](#非同期処理テストパターン)

## コンポーネントテストパターン

### 基本的なレンダリングテスト

すべてのコンポーネントに対して、最低限の基本的なレンダリングテストを実装します。

```jsx
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "../components/Footer";

test("renders without crashing", () => {
  render(<Footer />);
});
```

### 要素の存在確認テスト

コンポーネントが特定の要素を正しくレンダリングしているかを確認するテストです。

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "../components/Footer";

test("contains footer element", () => {
  render(<Footer />);
  const footerElement = screen.getByRole("contentinfo");
  expect(footerElement).toBeInTheDocument();
});
```

### テキスト内容の確認テスト

コンポーネントが正しいテキストを表示しているかを確認するテストです。

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "../components/Footer";

test("displays copyright text", () => {
  render(<Footer />);
  const copyrightElement = screen.getByText(/2025 TOMIOKA Rio/i);
  expect(copyrightElement).toBeInTheDocument();
});
```

### クリックイベントのテスト

ボタンなどのクリック可能な要素のイベントハンドリングをテストします。

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Button from "../components/Button";

test("calls onClick when button is clicked", () => {
  // モック関数を作成
  const handleClick = jest.fn();
  
  // コンポーネントをレンダリング
  render(<Button onClick={handleClick}>クリックしてください</Button>);
  
  // ボタン要素を取得
  const button = screen.getByRole("button", { name: /クリックしてください/i });
  
  // クリックイベントを発火
  fireEvent.click(button);
  
  // モック関数が呼び出されたことを確認
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### 条件付きレンダリングのテスト

条件によって表示が変わるコンポーネントのテストです。

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ConditionalComponent from "../components/ConditionalComponent";

test("renders content when showContent is true", () => {
  render(<ConditionalComponent showContent={true} />);
  const content = screen.getByText(/表示コンテンツ/i);
  expect(content).toBeInTheDocument();
});

test("does not render content when showContent is false", () => {
  render(<ConditionalComponent showContent={false} />);
  const content = screen.queryByText(/表示コンテンツ/i);
  expect(content).not.toBeInTheDocument();
});
```

### プロップスのテスト

コンポーネントが受け取ったプロップスを正しく使用しているかをテストします。

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Greeting from "../components/Greeting";

test("displays name from props", () => {
  render(<Greeting name="冨岡 莉生" />);
  const greeting = screen.getByText(/こんにちは、冨岡 莉生さん/i);
  expect(greeting).toBeInTheDocument();
});
```

## ユーティリティ関数テストパターン

### 正常系のテスト

ユーティリティ関数が正常な入力に対して期待通りの結果を返すことをテストします。

```jsx
import { formatDate } from "../utils/dateUtils";

test("formats date correctly", () => {
  const date = new Date("2025-04-01");
  const formattedDate = formatDate(date);
  expect(formattedDate).toBe("2025年4月1日");
});
```

### 異常系のテスト

ユーティリティ関数が異常な入力に対して適切に処理することをテストします。

```jsx
import { formatDate } from "../utils/dateUtils";

test("returns error message for invalid date", () => {
  const formattedDate = formatDate("invalid date");
  expect(formattedDate).toBe("無効な日付");
});
```

### 境界値のテスト

ユーティリティ関数が境界値に対して正しく動作することをテストします。

```jsx
import { calculateDiscount } from "../utils/priceUtils";

test("applies maximum discount for large amounts", () => {
  const discount = calculateDiscount(100000);
  expect(discount).toBe(20000); // 最大割引額
});

test("applies no discount for small amounts", () => {
  const discount = calculateDiscount(999);
  expect(discount).toBe(0); // 最小割引額
});
```

## コンテキストテストパターン

### コンテキストプロバイダーのテスト

コンテキストプロバイダーが正しい初期値を提供することをテストします。

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LanguageProvider, useLanguage } from "../contexts/LanguageContext";

// テスト用のコンポーネント
const TestComponent = () => {
  const { language } = useLanguage();
  return <div data-testid="language">{language}</div>;
};

test("provides default language as ja", () => {
  render(
    <LanguageProvider>
      <TestComponent />
    </LanguageProvider>
  );
  
  expect(screen.getByTestId("language").textContent).toBe("ja");
});
```

### コンテキスト更新のテスト

コンテキストの値が正しく更新されることをテストします。

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LanguageProvider, useLanguage } from "../contexts/LanguageContext";

// テスト用のコンポーネント
const TestComponent = () => {
  const { language, toggleLanguage } = useLanguage();
  return (
    <div>
      <div data-testid="language">{language}</div>
      <button onClick={toggleLanguage} data-testid="toggle-button">
        Toggle Language
      </button>
    </div>
  );
};

test("toggles language when toggle function is called", () => {
  render(
    <LanguageProvider>
      <TestComponent />
    </LanguageProvider>
  );
  
  // 初期値は日本語
  expect(screen.getByTestId("language").textContent).toBe("ja");
  
  // 言語を切り替え
  fireEvent.click(screen.getByTestId("toggle-button"));
  
  // 英語に切り替わる
  expect(screen.getByTestId("language").textContent).toBe("en");
});
```

### コンテキストの永続化テスト

コンテキストの値がローカルストレージなどに永続化されることをテストします。

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LanguageProvider, useLanguage } from "../contexts/LanguageContext";

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

// テスト用のコンポーネント
const TestComponent = () => {
  const { language, toggleLanguage } = useLanguage();
  return (
    <div>
      <div data-testid="language">{language}</div>
      <button onClick={toggleLanguage} data-testid="toggle-button">
        Toggle Language
      </button>
    </div>
  );
};

test("saves language to localStorage when changed", () => {
  render(
    <LanguageProvider>
      <TestComponent />
    </LanguageProvider>
  );
  
  // 言語を切り替え
  fireEvent.click(screen.getByTestId("toggle-button"));
  
  // ローカルストレージに保存されたか確認
  expect(localStorageMock.setItem).toHaveBeenCalledWith("language", "en");
});
```

## レスポンシブデザインテストパターン

### デスクトップ表示のテスト

デスクトップサイズでのコンポーネントの表示をテストします。

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Header from "../components/Header";

describe("desktop view", () => {
  beforeEach(() => {
    // ウィンドウサイズをデスクトップサイズに設定
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  test("displays navigation links", () => {
    render(<Header />);
    
    // ナビゲーションリンクが表示されているか確認
    expect(screen.getByText(/ホーム/i)).toBeInTheDocument();
    expect(screen.getByText(/プロフィール/i)).toBeInTheDocument();
    expect(screen.getByText(/出版物/i)).toBeInTheDocument();
  });
});
```

### モバイル表示のテスト

モバイルサイズでのコンポーネントの表示をテストします。

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Header from "../components/Header";

describe("mobile view", () => {
  beforeEach(() => {
    // ウィンドウサイズをモバイルサイズに設定
    global.innerWidth = 480;
    global.dispatchEvent(new Event('resize'));
  });

  test("displays hamburger menu button", () => {
    render(<Header />);
    
    // ハンバーガーメニューボタンが表示されているか確認
    const hamburgerButton = screen.getByRole("button", { name: /open menu/i });
    expect(hamburgerButton).toBeInTheDocument();
  });

  test("opens side menu when hamburger button is clicked", () => {
    render(<Header />);
    
    // ハンバーガーメニューボタンをクリック
    const hamburgerButton = screen.getByRole("button", { name: /open menu/i });
    fireEvent.click(hamburgerButton);
    
    // サイドメニューが表示されているか確認
    const closeButton = screen.getByRole("button", { name: /close menu/i });
    expect(closeButton).toBeInTheDocument();
    
    // メニュー項目が表示されているか確認
    expect(screen.getByText(/ホーム/i)).toBeInTheDocument();
    expect(screen.getByText(/プロフィール/i)).toBeInTheDocument();
    expect(screen.getByText(/出版物/i)).toBeInTheDocument();
  });
});
```

## 非同期処理テストパターン

### APIリクエストのテスト

APIリクエストを行うコンポーネントやユーティリティのテストです。

```jsx
import { fetchData } from "../utils/api";

// fetchのモック
global.fetch = jest.fn();

beforeEach(() => {
  fetch.mockClear();
});

test("fetches data successfully", async () => {
  // 成功レスポンスをモック
  fetch.mockImplementationOnce(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ name: "テストデータ" })
    })
  );

  const data = await fetchData("/api/data");
  
  // 正しいURLでfetchが呼ばれたか確認
  expect(fetch).toHaveBeenCalledWith("/api/data");
  expect(data).toEqual({ name: "テストデータ" });
});

test("handles fetch error", async () => {
  // エラーレスポンスをモック
  fetch.mockImplementationOnce(() => 
    Promise.resolve({
      ok: false,
      status: 404
    })
  );

  try {
    await fetchData("/api/data");
  } catch (error) {
    expect(error.message).toBe("データの取得に失敗しました（404）");
  }
});
```

### 非同期コンポーネントのテスト

データを非同期で読み込むコンポーネントのテストです。

```jsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import DataComponent from "../components/DataComponent";
import { fetchData } from "../utils/api";

// APIクライアントをモック
jest.mock("../utils/api", () => ({
  fetchData: jest.fn()
}));

test("displays data after successful API call", async () => {
  // モックの戻り値を設定
  fetchData.mockResolvedValue({ name: "テストデータ" });
  
  render(<DataComponent />);
  
  // 初期状態では読み込み中のメッセージが表示される
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  
  // データが表示されるのを待つ
  await waitFor(() => {
    expect(screen.getByText("テストデータ")).toBeInTheDocument();
  });
  
  // APIが正しく呼び出されたことを確認
  expect(fetchData).toHaveBeenCalledTimes(1);
});

test("displays error message after failed API call", async () => {
  // モックがエラーを投げるように設定
  fetchData.mockRejectedValue(new Error("API error"));
  
  render(<DataComponent />);
  
  // エラーメッセージが表示されるのを待つ
  await waitFor(() => {
    expect(screen.getByText(/エラーが発生しました/i)).toBeInTheDocument();
  });
});
```

### タイムアウトのテスト

タイムアウト処理を持つコンポーネントやユーティリティのテストです。

```jsx
import { fetchWithTimeout } from "../utils/api";

// fetchのモック
global.fetch = jest.fn();

beforeEach(() => {
  jest.useFakeTimers();
  fetch.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

test("throws error when request times out", async () => {
  // タイムアウトするfetchをモック
  fetch.mockImplementationOnce(() => new Promise(resolve => {
    // タイムアウト時間より長く待機するプロミス
    setTimeout(resolve, 6000);
  }));

  const fetchPromise = fetchWithTimeout("/api/data", { timeout: 5000 });
  
  // タイマーを進める
  jest.advanceTimersByTime(5000);
  
  await expect(fetchPromise).rejects.toThrow("Request timed out");
});
```

## まとめ

このドキュメントで紹介したテストパターンは、本プロジェクトで実際に使用されているパターンの一部です。新しいテストを書く際は、これらのパターンを参考にしつつ、テスト対象の特性に合わせて適切なテスト戦略を選択してください。

テストを書く際は、以下のポイントを意識することが重要です：

1. **テストの目的を明確にする**: 何をテストしたいのかを明確にし、それに最適なテストパターンを選択します。
2. **シンプルなテストを心がける**: 1つのテストで1つの機能や動作をテストします。
3. **テストの可読性を高める**: テスト名やコメントを使って、テストの意図を明確にします。
4. **テストの独立性を保つ**: 各テストは他のテストに依存せず、独立して実行できるようにします。

これらの原則に従うことで、メンテナンスしやすく、信頼性の高いテストを書くことができます。

## 関連ドキュメント

- [テストコード仕様書](./test-specifications.md)
- [テスト駆動開発（TDD）基本ガイド](../TDD/basic-guide.md)
- [Reactコンポーネントテストの書き方](../TDD/component-testing.md)
- [外部依存関係を持つコンポーネントのテスト](../TDD/testing-with-dependencies.md)
- [モックの適切な使用方法](../TDD/when-to-use-mocks.md)