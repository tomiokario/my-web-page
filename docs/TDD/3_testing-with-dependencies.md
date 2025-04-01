# 外部依存関係を持つコンポーネントのテスト

このドキュメントでは、React Router、APIリクエスト、コンテキストなどの外部依存関係を持つReactコンポーネントのテスト方法について解説します。

## 外部依存関係とテストの課題

Reactアプリケーションでは、コンポーネントが以下のような外部依存関係を持つことがよくあります：

- **React Router**: ルーティング関連のフック（`useParams`、`useLocation`など）
- **APIクライアント**: データフェッチングのためのライブラリやカスタムフック
- **グローバルステート**: Redux、Context APIなどのステート管理ソリューション
- **サードパーティライブラリ**: UIコンポーネントライブラリ（Mantine、Material-UIなど）

これらの依存関係は、テスト時に以下の課題を引き起こす可能性があります：

1. テスト環境でエラーが発生する（例：React Routerのコンテキストが見つからない）
2. テストが複雑になり、メンテナンスが難しくなる
3. テストの実行が遅くなる

これらの課題を解決するために、いくつかのアプローチを紹介します。

## React Routerに依存するコンポーネントのテスト

React Routerを使用するコンポーネントをテストする場合、以下の2つの主なアプローチがあります：

### 1. モックアプローチ

React Routerのフックをモックする方法です。このアプローチは、コンポーネントの内部実装に依存しますが、シンプルで効果的です。

```jsx
// SubHeader.jsxのテスト例
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SubHeader from "../components/SubHeader";

// React RouterのuseLocationフックをモック
jest.mock("react-router-dom", () => ({
  useLocation: () => ({
    pathname: "/profile-cv" // テスト用のパス
  })
}));

test("displays correct page name for profile-cv path", () => {
  render(<SubHeader />);
  const headingElement = screen.getByText("Profile & Curriculum Vitae (CV)");
  expect(headingElement).toBeInTheDocument();
});
```

このアプローチの利点：
- シンプルで実装が容易
- テストが高速に実行される

欠点：
- コンポーネントの内部実装に依存する
- 複数のテストで異なるモック値が必要な場合、管理が複雑になる可能性がある

### 2. ラッパーアプローチ

本プロジェクトで採用しているアプローチです。テスト対象のコンポーネントをRouter関連のコンポーネントでラップする方法です。

```jsx
// SubHeader.jsxのテスト例
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import SubHeader from "../components/SubHeader";

// ラッパーアプローチを使用したテスト
describe("SubHeader component", () => {
  // Profile & CVページの場合のテスト
  test("displays correct page name for profile-cv path", () => {
    render(
      <MemoryRouter initialEntries={["/profile-cv"]}>
        <SubHeader />
      </MemoryRouter>
    );
    const headingElement = screen.getByText("Profile & Curriculum Vitae (CV)");
    expect(headingElement).toBeInTheDocument();
  });

  // ホームページの場合のテスト
  test("displays correct page name for home path", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <SubHeader />
      </MemoryRouter>
    );
    const headingElement = screen.getByText("冨岡 莉生 (TOMIOKA Rio)");
    expect(headingElement).toBeInTheDocument();
  });
});
```

このアプローチの利点：
- 実際のRouter動作に近いテストができる
- コンポーネントの内部実装への依存が少ない
- 実際のコンポーネントをテストできる

欠点：
- テストのセットアップがやや複雑
- テストの実行が若干遅くなる可能性がある
- 依存関係のバージョン管理が必要な場合がある

### 3. テスト用の簡易版コンポーネントを作成する

コンポーネントのロジックを抽出した簡易版を作成し、外部依存関係を取り除きます。

```jsx
// テスト用の簡易版SubHeaderコンポーネント
const TestSubHeader = ({ pathname }) => {
  let pageName = "";
  switch (pathname) {
    case "/":
      pageName = "冨岡 莉生 (TOMIOKA Rio)";
      break;
    case "/profile-cv":
      pageName = "Profile & Curriculum Vitae (CV)";
      break;
    case "/publications":
      pageName = "Publications";
      break;
    default:
      pageName = "";
  }

  // ページ名が無ければサブヘッダー自体を表示しない
  if (!pageName) return null;

  return (
    <div className="subheader">
      <h2>{pageName}</h2>
    </div>
  );
};

// テスト
describe("SubHeader component (Test Version)", () => {
  test("displays correct page name for profile-cv path", () => {
    render(<TestSubHeader pathname="/profile-cv" />);
    const headingElement = screen.getByText("Profile & Curriculum Vitae (CV)");
    expect(headingElement).toBeInTheDocument();
  });
  
  // 他のパスに対するテストも同様に実装
});
```

このアプローチの利点：
- 外部依存関係に左右されない安定したテストが可能
- コンポーネントのロジックを集中的にテストできる
- テストが高速に実行される

欠点：
- 実際のコンポーネントとテスト用コンポーネントの同期を維持する必要がある
- 実際のコンポーネントの完全な動作をテストしているわけではない

## APIリクエストを行うコンポーネントのテスト

APIリクエストを行うコンポーネントをテストする場合、以下のアプローチが有効です：

### APIクライアントのモック

```jsx
// APIクライアントをモック
jest.mock("../api/client", () => ({
  fetchData: jest.fn()
}));

import { render, screen, waitFor } from "@testing-library/react";
import { fetchData } from "../api/client";
import DataComponent from "../components/DataComponent";

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
```

## コンテキストを使用するコンポーネントのテスト

コンテキストを使用するコンポーネントをテストする場合、以下のアプローチが有効です：

### カスタムレンダラーの作成

```jsx
// テスト用のラッパーを作成
const renderWithThemeContext = (ui, { theme = "light", ...options } = {}) => {
  const Wrapper = ({ children }) => (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
  
  return render(ui, { wrapper: Wrapper, ...options });
};

// テスト
test("displays correct theme based on context", () => {
  // ライトテーマでレンダリング
  renderWithThemeContext(<ThemedButton />);
  expect(screen.getByRole("button")).toHaveClass("light-theme");
  
  // ダークテーマでレンダリング
  renderWithThemeContext(<ThemedButton />, { theme: "dark" });
  expect(screen.getByRole("button")).toHaveClass("dark-theme");
});
```

## 複雑な依存関係を持つコンポーネントのテスト

複数の外部依存関係を持つコンポーネント（例：App.jsx）をテストする場合、ラッパーアプローチが特に有効です：

```jsx
// App.jsxのテスト例
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../App";

// ラッパーアプローチを使用したテスト
describe("App component", () => {
  // 基本的なレンダリングテスト
  test("renders without crashing", () => {
    render(<App />);
  });

  // 主要コンポーネントが存在するかテスト
  test("renders main components", () => {
    render(<App />);
    
    // ヘッダーが存在するか確認
    const headerElement = screen.getByRole("banner");
    expect(headerElement).toBeInTheDocument();
    
    // メインコンテンツが存在するか確認
    const mainElement = screen.getByRole("main");
    expect(mainElement).toBeInTheDocument();
    
    // フッターが存在するか確認
    const footerElement = screen.getByRole("contentinfo");
    expect(footerElement).toBeInTheDocument();
  });
});
```

## まとめ

外部依存関係を持つコンポーネントをテストする際は、以下のポイントを考慮することが重要です：

1. **テストの目的を明確にする**：コンポーネントのどの側面をテストしたいのかを明確にし、それに最適なアプローチを選択します。

2. **適切な分離レベルを選択する**：
   - 完全な統合テスト（実際の依存関係を使用）
   - 部分的なモック（一部の依存関係をモック）
   - 完全な分離（テスト用の簡易版コンポーネントを作成）

3. **テストの保守性を考慮する**：テストが壊れやすくならないよう、実装の詳細ではなく、コンポーネントの動作に焦点を当てます。

4. **テストのパフォーマンスを意識する**：テストが高速に実行されるよう、不必要な依存関係を避けます。

適切なアプローチを選択することで、外部依存関係を持つコンポーネントでも、信頼性が高く、メンテナンスしやすいテストを作成することができます。