# my-web-page プロジェクトドキュメント

## 概要

このドキュメントは、my-web-pageプロジェクトの開発者向け技術ドキュメントです。プロジェクトの構造、主要機能、開発フロー、テスト戦略などについて説明しています。

- 仮公開ページ：https://my-web-page-fawn-seven.vercel.app/
- 本番サイト：https://www.tomiokario.com/

## プロジェクト概要

my-web-pageは、個人のウェブサイトを構築するためのReactプロジェクトです。以下の主要機能を提供しています：

- 多言語対応（日本語/英語）
- マークダウンベースのコンテンツ管理
- 出版物データの表示と管理
- レスポンシブデザイン

## 技術スタック

- フロントエンド: React 18.3.1 + TypeScript
- UI: Mantine 7.17.4（`@mantine/core`, `@mantine/hooks`, `@mantine/emotion`）
- ルーティング: React Router 6
- マークダウン: react-markdown 6
- テスト: Jest, React Testing Library
- スタイリング: CSS + Emotion（Mantine Emotion Provider + カスタム cache）
- アイコン: lucide-react

## 目次

1. [プロジェクト構造](./project-structure.md) - ディレクトリ構造と各ファイルの役割
2. [多言語対応](./multilingual-support.md) - 言語切り替え機能の実装と使用方法
3. [マークダウンコンテンツ](./markdown-content.md) - マークダウンファイルの管理と読み込み方法
4. [出版物データの管理](./publications-management.md) - CSVからJSONへの変換プロセスと表示方法
5. [テスト戦略](./testing-strategy.md) - テスト方針とテストの書き方
6. [開発ワークフロー](./development-workflow.md) - 開発環境のセットアップと開発フロー

## クイックスタート

### 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd my-web-page

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start

# テストの実行
npm test
```

### 主要なスクリプト

- `npm start` - 開発サーバーを起動（http://localhost:3000）
- `npm test` - テストを実行
- `npm run build` - 本番用ビルドを作成
- `npm run convert-publications` - 出版物データをCSVからJSONに変換

## 開発ルール

基本的にはドキュメント駆動開発（[DocDD](DocDD.md)）に沿って進行します。現状のコードに沿った実装ルールは以下です：

- React 関数コンポーネント + TypeScript を使用
- UI は Mantine を中心に構成（`createStyles`, MantineProvider, Emotion Provider）
- 多言語は `LanguageContext` と `src/locales` の静的リソースで管理
- 共通ロジックはカスタムフック（`usePublications`, `useFilters`）に分離
- コンテンツは Markdown（public/markdown）から読み込み
- 出版物データは CSV→JSON 変換を介して `src/data/publications.json` を利用

補足: ルールを強制する ESLint/Prettier 設定は未導入です（必要に応じて追加検討）。
