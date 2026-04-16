
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

- AI エージェント向けの正本ルールは `AGENTS.md` です
- 変更作業は原則として `main` へ直接コミットせず、作業ブランチを切って進めます
- push 前には `git status` を確認し、PR は日本語で作成します
- ユーザーがローカル確認を希望した場合は、`npm start` で確認環境を用意し、確認完了までは push を行いません
- PR マージ後にユーザーから完了連絡があった場合は、`main` を `git pull --rebase` で最新化し、作業ブランチを削除してローカルを同期状態に戻します
- 重要な変更では、Codex 本体の確認に加えてサブエージェントによるレビューも併用します
- 運用ルールを更新する場合は、`AGENTS.md` だけでなく関連する `README` や手順書も合わせて更新します

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

## 出版物データの更新方法

出版物データの正本は `src/data/publication_master.json` です。日常更新では、次のいずれかを使います。

1. ローカル editor を使う場合
   ```
   npm run publications-editor
   ```
   - `http://127.0.0.1:4318` を開いて保存すると、`publication_master.json` の検証と `publications.json` の再生成がまとめて行われます
2. `publication_master.json` を直接編集した場合
   ```
   npm run convert-publications
   ```
   - `src/data/publications.json` が再生成されます
3. CSV から再取り込みしたい場合
   ```
   npm run import-publications-csv
   npm run convert-publications
   ```
   - `src/data/publication_data.csv` は移行・再取り込み用で、日常運用の正本にはしません

詳細は[管理者向けドキュメント - 出版物データ管理](docs/admin/publications-management.md)を参照してください。

researchmap 向け一括登録データの再生成や既存エクスポートとのマージ手順も、上記ドキュメントにまとめています。
