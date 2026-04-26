
# my web page

- 公開ページ: https://www.tomiokario.com/
- 仮ページ: https://my-web-page-fawn-seven.vercel.app/
- DeepWiki: https://deepwiki.com/tomiokario/my-web-page
  - 本リポジトリについての英語解説
  - AI への質問対応（日本語/英語）

## ドキュメント

プロジェクトの詳細なドキュメントは以下を参照してください：

- **[管理者向けドキュメント](docs/admin/README.md)** - コンテンツ管理・運用ガイド
- **[技術者向けドキュメント](docs/technical/README.md)** - 開発・技術仕様

## 運用ルール

- 変更作業は原則として `main` へ直接コミットせず、作業ブランチを切って進めます
- push 前には `git status` を確認し、PR は日本語で作成します
- ユーザーがローカル確認を希望した場合は、`npm start` で確認環境を用意し、確認完了までは push を行いません
- PR マージ後にユーザーから完了連絡があった場合は、`main` を `git pull --rebase` で最新化し、作業ブランチを削除してローカルを同期状態に戻します
- 開発・レビュー運用の詳細は [技術者向けドキュメント](docs/technical/README.md) を参照してください

## ローカル環境での使い方

- 依存関係のインストール（初回のみ）
  ```
  npm install
  ```
- 開発サーバ起動
  ```
  npm start
  ```
- テスト実行
  ```
  npm test
  ```
  - メモ: スクリプトのテストで一時的に`src/data/publications.json`が生成/上書きされます（テスト後に削除されます）。テストを中断した場合などは、必要に応じて変換スクリプトを再実行してください。

## テーマの変更方法

サイトの配色は `src/styles/variables.css` の CSS custom properties で管理します。未指定時は blue / ice accent テーマがデフォルトで、旧グレー系テーマは `html[data-theme="gray"]` の token として残しています。

テーマを追加・調整する場合は、React コンポーネントを分岐させず、`--header-bg`、`--footer-bg`、`--surface-alt`、`--accent` などの semantic token を更新してください。通常閲覧時の切り替え UI は Footer の小さなボタンで、選択値は `localStorage.theme` に保存されます。

## 出版物データの更新方法

出版物データの正本は `src/data/publication_master.json` です。日常更新は researchmap export JSONL の取り込みを使い、`publications.json` はそこから再生成します。

通常運用の本線は `researchmap export JSONL -> publication_master.json -> publications.json` で、公開側の tracked data 更新はここで完結します。

`tools/researchmap-private` は、必要なときだけ `publication_master.json` から researchmap へ安全に戻すための補助ツールです。`tmp/researchmap/**` や review / quarantine / archive の生成物は local-only で、公開リポジトリには含めません。

- `publication_master.json` は canonical schema の `fields` を正本とし、researchmap から取り込んだ結果と `sync.researchmap` の同期メタデータを保持します
- `publications.json` は `publication_master.json` から再生成される Web 表示用の生成物です

1. researchmap export (`rm_*.jsonl`) を master に取り込みます
   ```
   npm run import-publications-researchmap -- --input tmp/researchmap/rm_researchersYYYYMMDD.jsonl --dry-run
   npm run import-publications-researchmap -- --input tmp/researchmap/rm_researchersYYYYMMDD.jsonl
   ```
   - dry-run では `matched` / `added` / `review` / `invalid` を確認します
   - 自動 merge は `researchmap record id -> DOI -> canonical fingerprint` の strict match のみです
   - title だけ近い record や core field 競合は `review` に回り、1 件でも unresolved item があれば master は書き換えません
   - `localMeta` は import で上書きせず、成功した record だけ `sync.researchmap` を更新します
   - 既存 master / 入力 JSONL / 取り込み結果のどこかでタイトル重複が見つかった場合は hard error で停止します
   - 正常終了した JSONL は `archive/` へ移動し、同じ内容の再取り込みは履歴で防止します
2. 必要なら `publications.json` を再生成します
   ```
   npm run convert-publications
   ```
   - 通常は import コマンドがまとめて再生成します。`publication_master.json` を別手段で整えたときだけ使います

詳細は[管理者向けドキュメント - 出版物データ管理](docs/admin/publications-management.md)を参照してください。

researchmap 向け一括登録データの再生成や既存エクスポートとのマージ手順も、上記ドキュメントにまとめています。
