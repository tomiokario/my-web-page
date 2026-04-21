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
- [repo ローカル agent 定義](../.codex/agents/README.md)
- [Issue 検証ループ](./technical/issue-validation-loop.md) には、role 境界、最小 state、対外コメントの書き方に加えて、issue 草案を question-agent で詰め、fresh review は合意済み Issue の実装差分に対して行う境界も含まれます

主な内容：
- Issue を小さく検証するための最小ループ
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
- **テストを実行したい** → [テスト戦略](./technical/testing-strategy.md)

## 運用の基準

- AI エージェント向けの作業ルールはリポジトリ直下の `AGENTS.md` を正本とします
- Git 運用の詳細は [開発ワークフロー](./technical/development-workflow.md) を参照してください
- デプロイ運用の詳細は [デプロイメント手順](./admin/deployment-guide.md) を参照してください
- ユーザーがローカル確認を希望する変更では、push より前に開発サーバーでの確認を優先します
- PR マージ後のローカル同期とブランチ削除も標準運用に含めます
- 重要な変更では、Codex 本体の確認に加えてサブエージェントによるレビューも併用します
- Issue 対応では、まず question-agent で issue 草案と不足仕様を詰め、そのうえで合意済み Issue の実装差分について、issue 本文・関連コメント・現在の差分が要求に沿っているかを、文脈を引き継がない新規サブエージェントで必ず確認し、`OK` が出るまで別個体で再レビューを繰り返します
- 質問フェーズは Human-in-the-loop、合意済み Issue の実装は Human-out-of-the-loop、fresh review の後に intent review を行い、その結果を踏まえた PR 上の最終判断を Human-on-the-loop として扱います
- fresh review の対象は合意済み Issue の実装差分です。issue 草案や質問フェーズは、質問担当で詰める前段として扱います
- 合意済み Issue の実装では、仕様の抜けや高リスクな分岐がない限り追加質問なしで実装・検証・fresh review まで進めます。`intent review` はその後、Human-on-the-loop 前の趣旨適合確認として扱います
- 進捗共有では、fresh review と intent review を実施したかを必ず明記し、未実施なら理由とブロッカーも併記します
- 親オーケストレータは implementation agent 起動後、仕様・受け入れ条件・review 結果・一次情報 handoff の保持に徹し、実装都合の詳細は必要時に最小 handoff で受け取ります
- 人間向けの PR / Issue コメントでは、内部 role 名や進行用語を出さず、変更内容・確認結果・残課題を自然文で共有します
- Issue / PR への追記は自律的に行わず、人間との合意がある新規 Issue 作成、レビュー段階で人間と調整が必要な補足、または検証結果を対応 PR に集約して人間レビューを受ける場合に限ります
- 運用ルールを変更した場合は、この索引ページと関連手順書の記述も同時に見直してください

## サポート

問題が発生した場合は、関連するドキュメントを参照してください：

- 管理・運用に関する問題 → [管理者向けドキュメント](./admin/README.md)
- 技術的な問題 → [技術者向けドキュメント](./technical/README.md)
