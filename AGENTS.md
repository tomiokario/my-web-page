# Codex Working Agreement

このリポジトリに対する AI エージェント向けの作業ルールは、この `AGENTS.md` を正本とします。
`CLAUDE.md` や `GEMINI.md` を前提にせず、Codex はこのファイルに従って作業してください。

## 応答ルール
- 思考とユーザーへの応答は日本語で行ってください
- ユーザーが「実行して」「進めて」などの実行許可を出した後は、破壊的操作や追加の意思決定が必要な場合を除き、途中確認で止まらず、必要な編集、検証、commit、push まで一気通貫で進めてください
- 人間の承認が必要な操作は、作業の最後にまとめて扱えるように進行を設計してください。調査、実装、ローカル検証、差分確認、commit など安全に進められる作業を先に行い、PR 作成、対外コメント、外部投稿、削除、権限変更、追加インストールなど承認が必要な操作は、実行直前に内容と送信先・影響をまとめて確認してください
- 権限や承認の結果によって後続作業が大きく分岐し、後ろに回すと手戻りが大きい場合は、計画段階で「途中で承認を挟む方が効率がよい理由」と「必要になる承認内容」を人間に示し、そのタイミングで確認を挟む方針でよいかを尋ねてください
- ユーザーがローカルでの確認を希望した場合は、push や PR 作成よりもローカル開発サーバーでの確認を優先し、確認完了までは push を行わないでください
- 今後も有効な repo 固有の運用指示をユーザーから受けた場合は、その場限りの口頭対応で終えず、必要に応じて `AGENTS.md`、`README.md`、`docs/README.md`、関連手順書へ反映して継続運用できる状態にしてください
- ユーザーから「merge しました」など PR マージ完了の連絡を受けたら、別指示がない限り `main` へ戻って `git pull --rebase` を行い、作業ブランチのローカル・リモート削除まで進めて、ローカルを最新の `main` と同期した状態にしてください
- 実装や内容変更のレビューでは、必要に応じてサブエージェントにもレビューを依頼し、Codex 本体の確認と合わせて往復しながら品質を上げてください
- Issue に取り組むときは、Issue 草案や質問フェーズは質問担当で詰め、合意済み Issue の実装差分に対して issue 本文・関連コメント・現在の差分が要求に沿っているかを、文脈を fork しない新規サブエージェントだけで確認してください。指摘を反映したら別の新規サブエージェントに再レビューさせ、`OK` が出るまで繰り返してください
- Issue の質問フェーズでは、質問担当が変更タイプ、validation profile、reference extraction、acceptance criteria も整理してください。UI / design 変更では、temp HTML/CSS や DesignSystem などの参照元を静的に読み、構造・token・状態・配置基準を acceptance criteria に落としてください
- 人間から「issue に対応して」と依頼された場合は、合意済み Issue について repo 既定の multi-agent フローを原則フルで実行してください。Codex 側の一般制約や上位指示で subagent 起動やフローの一部実行が妨げられる場合は、実装着手前に衝突内容と不足している許可を人間へ明示してください
- ユーザーとの対話窓口は親オーケストレータだけが持ち、質問担当・実装担当・review agent は人間へ直接質問しないでください
- 親オーケストレータは implementation agent 起動後、原則として自分でコードを読み進めて実装都合を抱え込まず、仕様・受け入れ条件・review 結果・一次情報 handoff・進捗要約の保持に徹してください
- 実装詳細の把握が必要になった場合は、親オーケストレータが code-level reasoning を引き取るのではなく、implementation agent へ handoff や要約を返させて必要最小限だけ受け取ってください
- Issue / PR への追記や更新は自律的に行わず、質問担当が質問案や Issue 草案を親オーケストレータへ返し、その内容で親オーケストレータが人間と合意して新しい Issue を作る場合、レビュー段階で既存 Issue だけでは人間の趣旨を十分に表せず人間と調整したうえで補足が必要な場合、または検証結果を対応 PR に集約して人間レビューを受ける場合に限ってください
- Issue 草案や質問フェーズは質問担当で詰め、fresh review の対象にしないでください。fresh review は合意済み Issue の実装差分に対して行います
- 合意済みの Issue は Human-out-of-the-loop の実装フェーズとして扱い、仕様の抜けや高リスクな分岐がない限り追加質問なしで実装・検証・fresh review まで進めてください。`intent review` はその後、Human-on-the-loop 前の趣旨適合確認として扱ってください
- 実装担当は validation profile に沿った evidence handoff を返してください。UI / design 変更では reference extraction の各項目、global CSS、theme token、hover / active / underline / focus、responsive への影響をコード上の evidence として示してください
- fresh review は validation profile と evidence handoff を確認し、変更タイプに必要な evidence が欠けている場合は `OK` を返さないでください
- intent review は人間から途中で追加された補正指示を acceptance criteria に昇格できているか確認し、最新の補正指示が profile / evidence / 差分に反映されていない場合は `OK` を返さないでください
- 完了報告では、fresh review と intent review を実施したかを必ず明記してください。未実施の場合は、その理由と残っているブロッカーも併記してください
- マルチエージェント Issue 運用で使う再利用用ロールは `.codex/agents/*.toml` を正本とし、質問担当・実装担当・fresh review 担当・intent review 担当の入出力契約を repo に残してください
- `.codex/agents/*.toml` は repo ローカルの再利用定義として扱い、実際の subagent 起動では親オーケストレータが role / model / instructions / 出力形式を同等設定へ写して使ってください
- PR / Issue コメントなど人間向けの対外コメントでは、内部の role 名や進行用語をそのまま出さず、読み手が分かる言葉で「何を直したか」「何を確認したか」「何が残っているか」を書いてください
- 運用ルールや手順書を更新するときは、求められていない確認手段や作業を先に持ち出して否定する書き方を避け、必要な入力・判断・evidence を肯定形で記述してください。既存の過剰ルールを明示的に緩和する場合だけ、否定形の記述を使ってよいです
- Wiki、docs、README、PR 本文、Issue / PR コメントなどの人間向け文書は、そのページ単体で読めるように書いてください。前版との比較だけに依存せず、現在の方針や結論を直接説明してください。変更履歴や比較が主題の場合だけ、前版との差分を補助として書いてよいです
- 人間向け文書では、独自用語や略語を本文より先に使わないでください。用語が必要な場合は最初に短く定義し、不要なら一般的な言葉へ置き換えてください
- 文書の詳細度は読者に合わせてください。Wiki や概要文では方針と全体像を中心にし、実装詳細や入出力契約は repo 内の手順書や定義ファイルに寄せます。PR 本文やコメントでは、変更内容、確認結果、残課題を簡潔に共有してください
- README や docs は、この Web サイトのプログラムや運用を見る人間向けに保ち、AI エージェントの作業方針は原則として `AGENTS.md` に分離して記述してください。人間向け手順そのものが変わる場合だけ、README や docs にも必要な内容を反映してください
- 図表や Mermaid 図を使う場合は、ライトモードとダークモードの両方で読めるコントラストを確保してください。色は既存の読みやすさや落ち着いた雰囲気を保ち、強すぎる配色や装飾で本文の理解を妨げないようにしてください

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
- GitHub Wiki (`https://github.com/tomiokario/my-web-page.wiki.git`) の更新では、旧記事が履歴として残り、新規ページに現行版の構成・見出し粒度・文体・読みやすさの意図が引き継がれているか確認する
- 出版物データ変更では、正本 `src/data/publication_master.json` と生成物 `src/data/publications.json` の整合、および `convert-publications` / `import-publications-researchmap` の手順反映漏れがないか確認する
- 実装変更では、ユーザー視点の挙動を守るテストや既存テストの更新が不足していないか確認する
- ドキュメントや運用ルールの変更では、`AGENTS.md` だけでなく `README` や関連手順書の更新漏れがないか確認する
- ドキュメントや運用ルールの変更では、過剰な否定形で不要な前提を増やしていないか確認する。原則として「何をしないか」より「何を入力・確認・evidence とするか」を書く
- Wiki、docs、README、PR 本文、Issue / PR コメントの変更では、単体で読めるか、未定義の独自用語が先に出ていないか、読者に対して具体化しすぎていないかを確認する
- 図表を含む文書では、ライトモードとダークモードの両方で文字と背景のコントラストが保たれ、既存の読みやすさや落ち着いた色味を損ねていないか確認する
- 人間向けコメントの文面では、`fresh review`、`intent review`、`検証ループを 1 周完了` のような内部運用語を避け、変更内容・確認結果・残課題を自然文で伝える

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
- Issue 対応では、合意済み仕様に入る前に変更タイプを分類し、validation profile と reference extraction を定義する。UI / design の場合は HTML/CSS 参照元や既存デザインから採用する構造、token、状態、配置基準を抽出する
- Issue 対応では、Issue 草案や質問フェーズは質問担当で詰め、push や PR 更新の前に、合意済み Issue の実装差分を対象に issue 本文・関連コメント・差分を入力にした fresh なサブエージェントレビューを必ず実施する。指摘を反映したら別個体で再レビューし、`OK` が出るまで完了扱いにしない
- Issue 対応の役割分担は、質問フェーズを Human-in-the-loop、合意済み Issue の実装を Human-out-of-the-loop、fresh review の後に intent review を行い、その結果を踏まえた PR 上の最終判断を Human-on-the-loop として扱う
- 親オーケストレータが保持する task state は、対象 Issue、合意済み仕様、受け入れ条件、review 結果、一次情報 handoff 参照、次の依頼先に絞り、実装都合の詳細を常時保持しない
- role 混線が起きた場合は、親オーケストレータが直接実装 reasoning を継続せず、implementation agent から最小 handoff を取り直して手順書どおりに立て直す
- Pull Request がマージされた後は、ユーザーから別指示がない限り `main` に戻って `git pull --rebase` し、マージ済みのローカルブランチを削除する。リモートブランチが残っている場合はあわせて削除する
- 複数 Issue を並列に進める場合は、`docs/technical/parallel-issue-workflow.md` に従い、進行管理スレッドが Issue の棚卸し、close 候補、依存関係、実行順序を整理し、各 Issue を専用 worktree、専用作業ブランチ、専用 Codex スレッドへ分ける
- 並列 Issue 対応を Codex skill として実行する場合は、`.codex/skills/parallel-issue-processing/SKILL.md` を正本とする `$parallel-issue-processing` を使う
- 並列 Issue 対応の worktree は、進行管理スレッドの Codex が repo 内の gitignored な `tmp/worktrees/` に作成する。sibling worktree が sandbox 外になる設定では、作業や削除ができなくなるため標準の置き場所にしない
- `git worktree remove` が `.git/worktrees/` の削除権限で止まる場合は、承認付きで同じコマンドを再実行して後片付けする
- close してよい Issue は、完了扱いでよい理由を Issue にコメントし、実際の close は人間が行う
- 並列 Issue 対応では、各作業スレッドは割り当てられた Issue と worktree の差分だけを扱い、進行管理スレッドは実装詳細を抱え込まず、依存関係、review 結果、Pull Request 状態を管理する。merge 後の worktree とブランチの後片付けは、各作業スレッドが担当する
- Codex の sandbox が sibling worktree や `.git` への書き込み、ネットワークアクセスを許可していない場合は、worktree 作成、push、Pull Request 作成、Wiki 更新、チェック確認を実行可能な環境へ分け、未実行の操作と必要な設定を完了報告で明記する
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
- researchmap export (`rm_*.jsonl`) を取り込む場合は `npm run import-publications-researchmap -- --input <path>` を使用し、最初に `--dry-run` で `matched` / `added` / `review` / `invalid` を確認する
- `publication_master.json` の修正が必要な場合は canonical `fields` を直接更新し、必要に応じて `npm run convert-publications` で `publications.json` を再生成する
- 正規化タイトル一致の重複は許容しない。researchmap import や手編集で重複タイトルを正本へ入れない
- researchmap import の自動 merge は `researchmap record id -> DOI -> canonical fingerprint` の strict match のみとし、title 近傍候補や core field 競合は review / quarantine 扱いで書き込みを止める
- `tools/researchmap-private` は repo 内の通常ディレクトリとして扱い、`tmp/researchmap/**` と review / quarantine / archive の生成物は local-only とする
- Web 表示用 JSON の再生成には `npm run convert-publications` を使用する
- 出版物データは日常運用で GUI 編集せず、researchmap export JSONL から取り込みます。公開用 SPA に editor route を追加しません

## 多言語対応
- `LanguageContext` と `useLanguage` フックを使用して言語状態を管理
- `locales` ディレクトリの言語ファイル（`ja.js`, `en.js`）で翻訳を管理
- マークダウンコンテンツは `public/markdown/{言語コード}/` ディレクトリで言語別に管理

## コンテンツ管理
- マークダウンコンテンツは `public/markdown` ディレクトリで管理
- コンテンツ更新後は開発サーバーで表示を確認してからコミット
- ユーザー確認が必要な更新では、可能な限りローカル開発サーバーを起動した状態で確認を依頼し、確認完了までは push を保留する
- GitHub Wiki (`https://github.com/tomiokario/my-web-page.wiki.git`) で古い記事に更新が必要な場合は、古い記事を履歴として残し、新しいページを追加する。新しいページは現行版の構成、見出し粒度、文体、読みやすさを参照し、その意図を保つ
- `publication_master.json` を別手段で整えた場合は `npm run convert-publications` を実行して `publications.json` を再生成する

## ドキュメント
- コードの変更に伴い、必要に応じてドキュメントを更新
- 新機能の追加時は、対応するテストとドキュメントを作成
- 複雑なロジックには、コメントでその意図と動作を説明
- Wiki や概要ドキュメントでは、大まかな理解をしたい読者を想定し、方針、全体像、役割分担を中心に書く。詳細な実装手順、入出力契約、検証 evidence は必要な手順書や定義ファイルへ寄せる
- 運用ルールを更新する場合は、正本ファイルだけで完了扱いにせず、少なくとも `AGENTS.md`、`README.md`、`docs/README.md`、影響する手順書まで対象を列挙して整合確認する
