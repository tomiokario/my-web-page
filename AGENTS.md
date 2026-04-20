# Codex Working Agreement

このリポジトリに対する AI エージェント向けの作業ルールは、この `AGENTS.md` を正本とします。
`CLAUDE.md` や `GEMINI.md` を前提にせず、Codex はこのファイルに従って作業してください。

## 応答ルール
- 思考とユーザーへの応答は日本語で行ってください
- ユーザーが「実行して」「進めて」などの実行許可を出した後は、破壊的操作や追加の意思決定が必要な場合を除き、途中確認で止まらず、必要な編集、検証、commit、push まで一気通貫で進めてください
- ユーザーがローカルでの確認を希望した場合は、push や PR 作成よりもローカル開発サーバーでの確認を優先し、確認完了までは push を行わないでください
- 今後も有効な repo 固有の運用指示をユーザーから受けた場合は、その場限りの口頭対応で終えず、必要に応じて `AGENTS.md`、`README.md`、`docs/README.md`、関連手順書へ反映して継続運用できる状態にしてください
- ユーザーから「merge しました」など PR マージ完了の連絡を受けたら、別指示がない限り `main` へ戻って `git pull --rebase` を行い、作業ブランチのローカル・リモート削除まで進めて、ローカルを最新の `main` と同期した状態にしてください
- 実装や内容変更のレビューでは、必要に応じてサブエージェントにもレビューを依頼し、Codex 本体の確認と合わせて往復しながら品質を上げてください
- Issue に取り組むときは、実装前後を問わず issue 本文・関連コメント・現在の差分が要求に沿っているかを、文脈を fork しない新規サブエージェントだけで確認してください。指摘を反映したら別の新規サブエージェントに再レビューさせ、`OK` が出るまで繰り返してください
- ユーザーとの対話窓口は親オーケストレータだけが持ち、質問担当・実装担当・review agent は人間へ直接質問しないでください
- Issue / PR への追記や更新は自律的に行わず、質問担当が人間へのインタビューを経て新しい Issue を作る場合、レビュー段階で既存 Issue だけでは人間の趣旨を十分に表せず人間と調整したうえで補足が必要な場合、または検証結果を対応 PR に集約して人間レビューを受ける場合に限ってください
- 合意済みの Issue は Human-out-of-the-loop の実装フェーズとして扱い、仕様の抜けや高リスクな分岐がない限り追加質問なしで実装・検証・fresh review まで進めてください
- issue 57 で定義した再利用用ロールは `.codex/agents/*.toml` を正本とし、質問担当・実装担当・fresh review 担当の入出力契約を repo に残してください
- `.codex/agents/*.toml` は repo ローカルの再利用定義として扱い、実際の subagent 起動では親オーケストレータが role / model / instructions / 出力形式を同等設定へ写して使ってください

## セキュリティ

### 機密ファイル
- `.env` ファイル、API キー、トークン、認証情報を含むファイルの読み取りと変更を禁止
- 機密ファイルを絶対にコミットしない
- シークレット情報は環境変数を使用する
- ログや出力に認証情報を含めない

## Review guidelines
- 機密情報、個人情報、認証情報をソース、ログ、公開コンテンツに含めない
- `main` へ直接 push する前提の変更や手順を書かない。作業ブランチと PR を前提にする
- UI や文言の変更では、日本語と英語の両方で片側だけ更新漏れがないか確認する
- `public/markdown` の更新では、リンク切れ、画像参照切れ、言語切り替え時の導線崩れがないか確認する
- 出版物データ変更では、正本 `src/data/publication_master.json` と生成物 `src/data/publications.json` の整合、および `convert-publications` / `import-publications-csv` / `import-publications-researchmap` / `publications-editor` の手順反映漏れがないか確認する
- 実装変更では、ユーザー視点の挙動を守るテストや既存テストの更新が不足していないか確認する
- ドキュメントや運用ルールの変更では、`AGENTS.md` だけでなく `README` や関連手順書の更新漏れがないか確認する

## 開発フロー
- **ドキュメント駆動開発 (DocDD)** を基本とし、人間はドキュメントの作成とレビューに責任を持つ。実装はテスト駆動開発 (TDD) に従う
- 変更前にテストが通ることを確認し、変更後も全テストが通ることを確認する
- この repo で変更作業を始めるときは、原則 `main` へ直接コミットせず、先に作業ブランチを作成する。ユーザーが別ブランチ名を指定した場合のみそれに従う
- 作業ブランチを作る前後で `git status` を確認し、意図しない差分がある場合は巻き戻さずに内容を把握してから進める
- `pull` を行う場合は原則 `git pull --rebase` を使う
- push 前には `git status` で意図しない差分やローカル専用設定ファイルの混入がないか確認する
- 変更後はコミットし、原則として作業ブランチへ push する。`main` への直接 push はユーザーが明示的に許可した場合に限る
- PR を作成する場合は、タイトルと本文を日本語で記述する
- Pull Request で対応する Issue をマージ時に閉じたい場合は、本文に `close: #20` のようなクローズ記法を明記する
- Pull Request 作成後に補足や修正内容を伝える場合、既存コメントや本文を安易に更新せず、新規コメントとして投稿する
- Issue 対応中の実装前方針や構成案は、まず親オーケストレータがこの会話で人間と合意し、Issue / PR への追記が必要かどうかもその合意に従って判断する
- Issue 対応では、push や PR 更新の前に、issue 本文・関連コメント・差分を入力にした fresh なサブエージェントレビューを必ず実施する。指摘を反映したら別個体で再レビューし、`OK` が出るまで完了扱いにしない
- Issue 対応の役割分担は、質問フェーズを Human-in-the-loop、合意済み Issue の実装を Human-out-of-the-loop、PR 上の最終確認を Human-on-the-loop として扱う
- Pull Request がマージされた後は、ユーザーから別指示がない限り `main` に戻って `git pull --rebase` し、マージ済みのローカルブランチを削除する。リモートブランチが残っている場合はあわせて削除する
- 改行コードは `.gitattributes` を正本とし、不要な `CRLF` 差分を持ち込まない

## テスト規約
- テストファイルは `src/__tests__` ディレクトリに配置し、`.test.jsx` または `.test.js` の拡張子を使用
- AAA（Arrange-Act-Assert）パターンに従い、ユーザー視点でテストを書く
- 実装の詳細ではなく、動作をテストし、モックは必要最小限に留める
- テストは独立させ、他のテストに依存しないようにする
- 単体テストと統合テストを適切に使い分ける

## コーディング規約
- ESLint / Prettier の標準的なルールに準拠
- React の関数コンポーネントを使用し、Mantine コンポーネントライブラリを活用
- コンポーネントは単一責任の原則に従い、データ取得と表示の関心を分離する
- パフォーマンス最適化には `useMemo`、`useCallback`、`React.memo` を適切に使用
- ファイル命名規則: コンポーネントは `PascalCase.jsx`、フックは `useHookName.js`、ユーティリティは `camelCase.js`

## データ管理
- 出版物データの唯一の正本は `src/data/publication_master.json` とする
- `publication_master.json` は canonical schema の `fields` を正本とし、researchmap 固有の同期メタデータは `sync.researchmap` に保持する
- `src/data/publications.json` は `publication_master.json` から再生成される Web 表示用の生成物とする
- `src/data/publication_data.csv` は移行・再取り込み用の入力としてのみ扱い、日常運用の正本に戻さない
- CSV ファイルを更新する場合は Notion での操作をユーザーに依頼し、必要に応じて `npm run import-publications-csv` で master data を再生成する
- researchmap export (`rm_*.jsonl`) を取り込む場合は `npm run import-publications-researchmap -- --input <path>` を使用し、最初に `--dry-run` で `matched` / `added` / `review` / `invalid` を確認する
- 正規化タイトル一致の重複は許容しない。researchmap import、手編集、CSV 再生成のいずれでも重複タイトルを正本へ入れない
- researchmap import の自動 merge は `researchmap record id -> DOI -> canonical fingerprint` の strict match のみとし、title 近傍候補や core field 競合は review / quarantine 扱いで書き込みを止める
- Web 表示用 JSON の再生成には `npm run convert-publications` を使用する
- ローカル GUI 編集が必要な場合は `npm run publications-editor` を使用し、公開用 SPA に editor route を追加しない

## 多言語対応
- `LanguageContext` と `useLanguage` フックを使用して言語状態を管理
- `locales` ディレクトリの言語ファイル（`ja.js`, `en.js`）で翻訳を管理
- マークダウンコンテンツは `public/markdown/{言語コード}/` ディレクトリで言語別に管理

## コンテンツ管理
- マークダウンコンテンツは `public/markdown` ディレクトリで管理
- コンテンツ更新後は開発サーバーで表示を確認してからコミット
- ユーザー確認が必要な更新では、可能な限りローカル開発サーバーを起動した状態で確認を依頼し、確認完了までは push を保留する
- `publication_master.json` を直接編集した場合は `npm run convert-publications` を実行して `publications.json` を再生成する

## ドキュメント
- コードの変更に伴い、必要に応じてドキュメントを更新
- 新機能の追加時は、対応するテストとドキュメントを作成
- 複雑なロジックには、コメントでその意図と動作を説明
- 運用ルールを更新する場合は、正本ファイルだけで完了扱いにせず、少なくとも `AGENTS.md`、`README.md`、`docs/README.md`、影響する手順書まで対象を列挙して整合確認する
