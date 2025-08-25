# my-web-page ドキュメント

## 概要

my-web-pageプロジェクトのドキュメントです。技術者向けと管理者向けに分かれています。

- 仮公開ページ：https://my-web-page-fawn-seven.vercel.app/
- 本番サイト：https://www.tomiokario.com/

## ドキュメント構成

### 管理者向けドキュメント

Webサイトのコンテンツ管理や運用を行う方向けのドキュメントです。

**[管理者向けドキュメントへ](./admin/README.md)**

主な内容：
- コンテンツの更新方法
- 出版物データの管理
- デプロイメント手順
- サイト設定の変更

### 技術者向けドキュメント

開発者やエンジニア向けの技術仕様とアーキテクチャに関するドキュメントです。

**[技術者向けドキュメントへ](./technical/README.md)**

主な内容：
- システムアーキテクチャ
- 開発環境のセットアップ
- テスト戦略
- 技術的な実装詳細

## プロジェクト概要

my-web-pageは、個人のウェブサイトを構築するためのReactプロジェクトです。

### 主要機能

- 多言語対応（日本語/英語）
- マークダウンベースのコンテンツ管理
- 出版物データの表示と管理
- レスポンシブデザイン

### 技術スタック

- フロントエンド: React 18.3.1 + TypeScript
- UI: Mantine 7.17.4
- ルーティング: React Router 6
- マークダウン: react-markdown 6
- テスト: Jest, React Testing Library
- ホスティング: Vercel

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

## クイックアクセス

### よく使う操作

- **コンテンツを更新したい** → [Markdownコンテンツ管理](./admin/markdown-content.md)
- **出版物リストを更新したい** → [出版物データ管理](./admin/publications-management.md)
- **サイトをデプロイしたい** → [デプロイメント手順](./admin/deployment-guide.md)
- **開発環境を構築したい** → [開発ワークフロー](./technical/development-workflow.md)
- **テストを実行したい** → [テスト戦略](./technical/testing-strategy.md)

## サポート

問題が発生した場合は、関連するドキュメントを参照してください：

- 管理・運用に関する問題 → [管理者向けドキュメント](./admin/README.md)
- 技術的な問題 → [技術者向けドキュメント](./technical/README.md)