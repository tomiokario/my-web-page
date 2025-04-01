# テストコード仕様書

このディレクトリには、本プロジェクトのテストコードに関する仕様と標準を定義するドキュメントが含まれています。

## ドキュメント一覧

- [テストコード仕様書](./test-specifications.md) - テストコードの基本仕様と標準を定義
- [テストパターン集](./test-patterns.md) - 主要なテストパターンとその実装例を紹介
- [モックの使用ガイドライン](./mocking-guidelines.md) - モックの適切な使用方法について解説

## テスト仕様の概要

### テスト哲学

本プロジェクトでは、テスト駆動開発（TDD）のアプローチを採用しています。TDDは「Red-Green-Refactor」サイクルに基づいて開発を進める手法です：

1. **Red**: まず、失敗するテストを書く
2. **Green**: テストが成功するように最小限のコードを実装する
3. **Refactor**: コードをリファクタリングする

### テストファイルの構造

テストファイルは `src/__tests__` ディレクトリに配置し、テスト対象のファイル名に `.test.jsx` または `.test.js` を付けて命名します：

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

### テストの基本構造

```jsx
/**
 * コンポーネント名のテスト
 *
 * このテストファイルでは、〇〇の機能をテストします。
 *
 * テスト内容：
 * 1. 〇〇の確認
 * 2. △△の確認
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Component from "../components/Component";

// テスト用のラッパーコンポーネント（必要に応じて）
const TestWrapper = ({ children }) => {
  // ...
};

// コンポーネントのテスト
describe("Component", () => {
  // 基本的なレンダリングテスト
  test("renders without crashing", () => {
    render(<Component />);
  });

  // 他のテストケース
  test("displays expected content", () => {
    // ...
  });
});
```

### 主要なテストパターン

1. **基本的なレンダリングテスト**: コンポーネントが正常にレンダリングされることを確認
2. **要素の存在確認テスト**: 特定の要素が存在することを確認
3. **条件付きレンダリングテスト**: 条件によって表示が変わることを確認
4. **ユーザーインタラクションテスト**: クリックなどのイベントに対する動作を確認
5. **非同期処理のテスト**: データ読み込みなどの非同期処理を確認

### モックの使用ガイドライン

モックは以下の状況で使用します：

1. **外部サービスとの通信**: APIリクエスト、ファイルシステム操作など
2. **ブラウザ環境に依存する機能**: localStorage、window、documentなど
3. **テスト環境での制約**: テスト環境で利用できないライブラリやAPI
4. **特定のエッジケースやエラー状態のテスト**: エラーハンドリング、タイムアウトなど

モックは必要最小限に留め、可能な限り実際のコンポーネントを使用することを推奨します。

### テスト環境とツール

- **Jest**: テストフレームワーク
- **React Testing Library**: Reactコンポーネントのテストユーティリティ
- **jest-dom**: DOMに関する追加のマッチャー

### テストの実行方法

```bash
# すべてのテストを実行
npm test

# 特定のテストファイルを実行
npm test src/__tests__/Footer.test.jsx

# テストカバレッジを確認
npm test -- --coverage
```

## 関連ドキュメント

- [テスト駆動開発（TDD）基本ガイド](../TDD/basic-guide.md)
- [Reactコンポーネントテストの書き方](../TDD/component-testing.md)
- [外部依存関係を持つコンポーネントのテスト](../TDD/testing-with-dependencies.md)
- [モックの適切な使用方法](../TDD/when-to-use-mocks.md)