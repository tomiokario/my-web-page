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

- **フロントエンド**: React 19.0.0
- **UIライブラリ**: Mantine 5.10.5
- **ルーティング**: React Router 6.3.0
- **マークダウン**: React Markdown 6.0.3
- **テスト**: Jest, React Testing Library
- **スタイリング**: CSS, Emotion

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
- `ts-node scripts/convertPublications.ts` - 出版物データをCSVからJSONに変換

## 開発ルール

基本的にはドキュメント駆動開発（[DocDD](DocDD.md)）に沿って進行する．

プロジェクトの開発ルールは[.clinerules](./../.clinerules)ファイルに定義されています。主なルールは以下の通りです：

- ESLint/Prettierの標準的なルールに準拠
- Reactの関数コンポーネントを使用
- Mantineコンポーネントライブラリを活用したUI設計
- 関数やコンポーネントには適切なコメントを含める
- 言語設定（ja/en）に応じて、適切な言語でコンテンツを表示する
- コンポーネントは責務を明確に分離する
- 再利用可能なコードはユーティリティ関数として抽出する

詳細なルールについては、[.clinerules](./../.clinerules)ファイルを参照してください。