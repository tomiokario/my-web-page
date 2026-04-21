# Repo Local Agent Definitions

このディレクトリには、マルチエージェント Issue 運用で使う役割分担を次回以降も再利用できるようにするための repo ローカル定義を置きます。

この運用は issue 57 で初めて整理しましたが、運用名そのものは issue 番号ではなく内容ベースで扱います。

- [question-agent.toml](./question-agent.toml): 質問担当
- [implementation-agent.toml](./implementation-agent.toml): 実装担当
- [fresh-review-agent.toml](./fresh-review-agent.toml): fresh review 担当
- [intent-review-agent.toml](./intent-review-agent.toml): 一次情報ベースの趣旨適合確認担当

前提:

- ユーザー窓口は親オーケストレータだけが持ちます
- 各 agent は人間へ直接質問しません
- Issue / PR への書き込み権限は `AGENTS.md` と `docs/technical/issue-validation-loop.md` の条件に従います
- 親オーケストレータは implementation agent 起動後、仕様・受け入れ条件・review 結果・一次情報 handoff の保持に徹し、実装詳細は必要時に最小 handoff で受け取ります
- 人間向けコメントでは、内部 role 名や進行用語をそのまま出さず、変更内容・確認結果・残課題を自然文で共有します
- 合意済み Issue を「対応してほしい」と依頼されたときは、原則として question -> implementation -> fresh review -> intent review の流れを一通り回します。issue 草案や質問フェーズは question-agent で詰め、fresh review の対象にはしません。一般制約や上位指示で一部の役割実行ができない場合だけ、開始前に衝突内容と不足している許可を人間へ明示します

役割ごとの入出力契約:

- `question-agent`: Issue 本文と関連コメントから不足仕様を抽出し、質問案と Issue 草案を親オーケストレータへ返す
- `implementation-agent`: 合意済み仕様、対象ファイル、完了条件を受け取り、差分と検証結果を返す
- `fresh-review-agent`: 合意済み Issue の本文、関連コメント、現在の実装差分だけを受け取り、二次情報ベースの findings を返す
- `intent-review-agent`: fresh review が `OK` になった後に、親オーケストレータが保持する `handoff_id`、一次情報メモ、参照元つき引用または決定ログ、現在差分を受け取り、いずれかが欠ける場合は `OK` を返さず差し戻す
- 完了報告では、fresh review と intent review を実施したかを必ず示し、未実施なら理由とブロッカーを添える

役割ごとの「持ってよい情報 / 持ち込まない情報」:

- `question-agent`
  - 持ってよい情報: Issue 本文、関連コメント、人間から追加でもらった制約、今回の論点
  - 持ち込まない情報: 実装都合の詳細、現在差分の細かい読み解き、対外コメントの文責
- `implementation-agent`
  - 持ってよい情報: 合意済み仕様、受け入れ条件、対象ファイル、必要なコード文脈、修正すべき findings
  - 持ち込まない情報: ユーザー窓口、不要に広い会話履歴、親オーケストレータが保持すべき運用 state 全体
- `fresh-review-agent`
  - 持ってよい情報: 合意済み Issue 本文、関連コメント、現在の実装差分
  - 持ち込まない情報: 以前の review 結果、一次情報 handoff、実装担当の自己説明
- `intent-review-agent`
  - 持ってよい情報: fresh review の `OK`、一次情報 handoff、決定ログ、現在差分
  - 持ち込まない情報: fresh review の代わりになる実装探索、ユーザーとの直接対話、未整理の長い会話ログ

親オーケストレータが常時保持する最小 state:

- 対象 Issue / PR と今回の目的
- 合意済み仕様と受け入れ条件
- 最新の review 結果と未解決事項
- 一次情報 handoff と implementation handoff の参照先
- 次に依頼する role と停止条件

親オーケストレータは、この最小 state を超えて code-level reasoning を抱え込まないことを原則にします。実装詳細が必要になった場合は、implementation agent に最小 handoff を返させてから参照します。

使い方:

1. 親オーケストレータが対象 Issue と制約を整理する
2. 必要な role の TOML を参照し、その role / model / instructions / 入出力契約を実際の subagent 起動設定へ写して使う
3. `question-agent` は質問案、`fresh-review-agent` は二次情報ベースの指摘、`intent-review-agent` は一次情報ベースの趣旨適合確認を返す
4. 返答は親オーケストレータが統合し、人間への説明、実装、PR コメントへ反映する

この定義は repo 内で役割分担を再現するための正本です。実際の subagent 起動方法やモデル選択は Codex 側の機能に依存するため、現時点では親オーケストレータが同等設定へ写して使います。
