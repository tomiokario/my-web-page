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

補助資料：
- [researchmap 出力ツール](../tools/researchmap-private/README.md) - `publication_master.json` から researchmap へ安全に戻すための補助ツール。`tmp/researchmap/**` と review / quarantine / archive の生成物は local-only です

主な内容：
- システムアーキテクチャ
- 開発環境のセットアップ
- 複数 Issue を worktree と複数スレッドで同時に進める手順
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
- `npm run import-publications-researchmap -- --input <rm_jsonl> --dry-run` - researchmap export JSONL の `matched` / `added` / `review` / `invalid` を先に確認する
- `npm run import-publications-researchmap -- --input <rm_jsonl>` - researchmap export JSONL を `publication_master.json` へ strict match + review 付きで安全に取り込む
- `npm run convert-publications` - `publication_master.json` から `publications.json` を再生成

出版物データでは、正規化タイトル一致の重複を許容しません。日常運用は `researchmap export JSONL -> dry-run -> import -> publications.json 再生成` を主導線にし、`publication_master.json` を researchmap 取り込み結果を保持する正本、`publications.json` をそこから再生成される生成物として扱います。researchmap import でもタイトル重複・review・invalid が 1 件でも見つかれば書き込みを停止します。

## クイックアクセス

### よく使う操作

- **コンテンツを更新したい** → [Markdownコンテンツ管理](./admin/markdown-content.md)
- **出版物リストを更新したい** → [出版物データ管理](./admin/publications-management.md)
- **researchmap 用の一括登録データを更新したい** → [出版物データ管理](./admin/publications-management.md)
- **サイトをデプロイしたい** → [デプロイメント手順](./admin/deployment-guide.md)
- **開発環境を構築したい** → [開発ワークフロー](./technical/development-workflow.md)
- **複数 Issue を並列に進めたい** → [並列 Issue 対応ワークフロー](./technical/parallel-issue-workflow.md)
- **テストを実行したい** → [テスト戦略](./technical/testing-strategy.md)

## 運用の基準

- Git 運用の詳細は [開発ワークフロー](./technical/development-workflow.md) を参照してください
- デプロイ運用の詳細は [デプロイメント手順](./admin/deployment-guide.md) を参照してください
- ユーザーがローカル確認を希望する変更では、push より前に開発サーバーでの確認を優先します
- PR マージ後のローカル同期とブランチ削除も標準運用に含めます
- 開発・レビュー運用の詳細は [技術者向けドキュメント](./technical/README.md) を参照してください

## サポート

問題が発生した場合は、関連するドキュメントを参照してください：

- 管理・運用に関する問題 → [管理者向けドキュメント](./admin/README.md)
- 技術的な問題 → [技術者向けドキュメント](./technical/README.md)
