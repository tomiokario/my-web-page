# Reactコンポーネントテストの書き方

このドキュメントでは、React Testing Libraryを使用したReactコンポーネントのテスト方法について解説します。

## 基本的なコンポーネントテスト

Reactコンポーネントのテストでは、実際のユーザーがコンポーネントをどのように使用するかという観点からテストを書くことが重要です。React Testing Libraryは、このユーザー中心のアプローチを促進するために設計されています。

### テストの基本構造

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "../components/Footer";

// Footerコンポーネントのテスト
describe("Footer component", () => {
  // 基本的なレンダリングテスト
  test("renders without crashing", () => {
    render(<Footer />);
  });

  // コンテンツが正しく表示されるかテスト
  test("displays copyright text", () => {
    render(<Footer />);
    const copyrightElement = screen.getByText(/2025 TOMIOKA Rio/i);
    expect(copyrightElement).toBeInTheDocument();
  });
});
```

上記のコードでは：
- `describe`ブロックでテストをグループ化し、テスト対象を明確にしています
- `test`関数で個別のテストケースを定義しています
- `render`関数でコンポーネントをレンダリングします
- `screen`オブジェクトを使用して、レンダリングされた要素にアクセスします
- `expect`と`toBeInTheDocument`などのマッチャーを使用して、期待する結果を検証します

### 要素の取得方法

React Testing Libraryでは、実際のユーザーがページ上の要素を見つける方法に近い方法で要素を取得することを推奨しています。主な取得方法は以下の通りです：

1. **テキストで取得**：ユーザーが見るテキストで要素を取得します
   ```jsx
   const element = screen.getByText("表示されるテキスト");
   ```

2. **ロールで取得**：アクセシビリティのロールに基づいて要素を取得します
   ```jsx
   const button = screen.getByRole("button", { name: "送信" });
   const heading = screen.getByRole("heading", { name: "タイトル" });
   ```

3. **ラベルで取得**：フォーム要素をラベルテキストで取得します
   ```jsx
   const nameInput = screen.getByLabelText("名前");
   ```

4. **プレースホルダーで取得**：プレースホルダーテキストで要素を取得します
   ```jsx
   const searchInput = screen.getByPlaceholderText("検索...");
   ```

5. **テストIDで取得**：他の方法が適用できない場合に使用します
   ```jsx
   const specialElement = screen.getByTestId("special-element");
   ```

### クエリの種類

React Testing Libraryには、要素の存在や不在を確認するための異なるクエリタイプがあります：

- **getBy...**: 要素が見つからない場合はエラーを投げます。要素が存在することを確認する場合に使用します。
- **queryBy...**: 要素が見つからない場合は`null`を返します。要素が存在しないことを確認する場合に使用します。
- **findBy...**: 非同期で要素を探し、Promiseを返します。非同期で表示される要素を取得する場合に使用します。

```jsx
// 要素が存在することを確認
const existingElement = screen.getByText("存在するテキスト");

// 要素が存在しないことを確認
const nonExistingElement = screen.queryByText("存在しないテキスト");
expect(nonExistingElement).not.toBeInTheDocument();

// 非同期で表示される要素を取得
const asyncElement = await screen.findByText("非同期で表示されるテキスト");
```

## ユーザーインタラクションのテスト

ユーザーインタラクション（クリック、入力など）をテストするには、`fireEvent`または`userEvent`を使用します。`userEvent`は実際のユーザー操作により近い動作をシミュレートするため、可能な限り`userEvent`を使用することをお勧めします。

### クリックイベントのテスト

```jsx
import { render, screen, fireEvent } from "@testing-library/react";

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

このテストでは：
1. `jest.fn()`でモック関数を作成しています
2. モック関数をコンポーネントのプロップスとして渡しています
3. ボタン要素を取得しています
4. `fireEvent.click()`でクリックイベントをシミュレートしています
5. モック関数が呼び出されたことを確認しています

### フォーム入力のテスト

```jsx
test("updates input value when typed", () => {
  render(<SearchForm />);
  
  // 入力フィールドを取得
  const inputElement = screen.getByRole("textbox");
  
  // テキストを入力
  fireEvent.change(inputElement, { target: { value: "テスト検索" } });
  
  // 入力値が更新されたことを確認
  expect(inputElement).toHaveValue("テスト検索");
});
```

このテストでは：
1. 入力フィールドを取得しています
2. `fireEvent.change()`で入力イベントをシミュレートしています
3. 入力値が正しく更新されたことを確認しています

## まとめ

Reactコンポーネントのテストでは、以下の点を意識することが重要です：

1. **ユーザー視点でテストを書く**：実際のユーザーがコンポーネントをどのように使用するかという観点からテストを書きます。
2. **アクセシビリティを考慮する**：`getByRole`などのクエリを使用して、アクセシビリティを考慮したテストを書きます。
3. **実装の詳細ではなく、動作をテストする**：コンポーネントの内部実装ではなく、外部から観察可能な動作をテストします。
4. **テストを読みやすく保つ**：テストコードは、コンポーネントの使用方法を示すドキュメントとしても機能します。

これらの原則に従うことで、メンテナンスしやすく、信頼性の高いテストを書くことができます。