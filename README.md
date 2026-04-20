
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
- **[Issue 検証ループ](docs/technical/issue-validation-loop.md)** - 小さな題材で AI 開発ループを固める実践手順と、role 境界・対外コメントのルール
- **[Repo Local Agent Definitions](.codex/agents/README.md)** - 質問担当・実装担当・fresh review 担当・intent review 担当の再利用用定義と情報境界

## 運用ルール

- AI エージェント向けの正本ルールは `AGENTS.md` です
- 変更作業は原則として `main` へ直接コミットせず、作業ブランチを切って進めます
- push 前には `git status` を確認し、PR は日本語で作成します
- ユーザーがローカル確認を希望した場合は、`npm start` で確認環境を用意し、確認完了までは push を行いません
- PR マージ後にユーザーから完了連絡があった場合は、`main` を `git pull --rebase` で最新化し、作業ブランチを削除してローカルを同期状態に戻します
- 重要な変更では、Codex 本体の確認に加えてサブエージェントによるレビューも併用します
- Issue 対応では、合意済み Issue については既定の multi-agent フローを原則フルで回し、issue 本文・関連コメント・現在の差分が要求に沿っているかを、文脈を引き継がない新規サブエージェントで必ず確認し、`OK` が出るまで別個体で再レビューを繰り返します
- Human-on-the-loop に入る前には、fresh review とは別に、一次情報 handoff と現在差分を入力にした intent review で趣旨適合を確認します
- 進捗共有では、fresh review と intent review を実施したかを必ず明記し、未実施なら理由とブロッカーも添えます
- 親オーケストレータは implementation agent 起動後、仕様・受け入れ条件・review 結果・一次情報 handoff の保持に徹し、実装詳細は必要時に最小 handoff で受け取ります
- PR / Issue コメントでは、内部 role 名や進行用語をそのまま出さず、何を直したか・何を確認したか・何が残っているかを自然文で共有します
- Issue や PR への追記は自律的に行わず、質問担当が質問案や Issue 草案を親オーケストレータへ返し、その内容で親オーケストレータが人間と合意した場合、レビュー段階で人間と調整が必要な場合、または検証結果を対応 PR に集約して人間レビューを受ける場合に限ります
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

出版物データの正本は `src/data/publication_master.json` です。日常更新は、まずローカル editor か researchmap export JSONL の取り込みを使います。

- `publication_master.json` は canonical schema の `fields` を正本とし、`sync.researchmap` に researchmap record id / 同期メタデータを保持します

1. ローカル editor を使う場合
   ```
   npm run publications-editor
   ```
   - `http://127.0.0.1:4318` を開いて保存すると、`publication_master.json` の検証と `publications.json` の再生成がまとめて行われます
2. researchmap export (`rm_*.jsonl`) を master に取り込みたい場合
   ```
   npm run import-publications-researchmap -- --input tmp/researchmap/rm_researchersYYYYMMDD.jsonl --dry-run
   npm run import-publications-researchmap -- --input tmp/researchmap/rm_researchersYYYYMMDD.jsonl
   ```
   - この repo ではタイトル一致の重複を許容しません
   - dry-run では `matched` / `added` に加えて `review` / `invalid` を確認します
   - 自動 merge は `researchmap record id -> DOI -> canonical fingerprint` の strict match のみです
   - title だけ近い record や core field 競合は `review` に回り、1 件でも unresolved item があれば master は書き換えません
   - `localMeta` は import で上書きせず、成功した record だけ `sync.researchmap` を更新します
   - 既存 master / 入力 JSONL / 取り込み結果のどこかでタイトル重複が見つかった場合は hard error で停止します
   - 正常終了した JSONL は `archive/` へ移動し、同じ内容の再取り込みは履歴で防止します
3. `publication_master.json` を直接編集した場合
   ```
   npm run convert-publications
   ```
   - `src/data/publications.json` が再生成されます

詳細は[管理者向けドキュメント - 出版物データ管理](docs/admin/publications-management.md)を参照してください。

researchmap 向け一括登録データの再生成や既存エクスポートとのマージ手順も、上記ドキュメントにまとめています。
