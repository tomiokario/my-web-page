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

役割ごとの入出力契約:

- `question-agent`: Issue 本文と関連コメントから不足仕様を抽出し、質問案と Issue 草案を親オーケストレータへ返す
- `implementation-agent`: 合意済み仕様、対象ファイル、完了条件を受け取り、差分と検証結果を返す
- `fresh-review-agent`: Issue 本文、関連コメント、現在差分だけを受け取り、二次情報ベースの findings を返す
- `intent-review-agent`: fresh review が `OK` になった後に、親オーケストレータが保持する `handoff_id`、一次情報メモ、参照元つき引用または決定ログ、現在差分を受け取り、いずれかが欠ける場合は `OK` を返さず差し戻す

使い方:

1. 親オーケストレータが対象 Issue と制約を整理する
2. 必要な role の TOML を参照し、その role / model / instructions / 入出力契約を実際の subagent 起動設定へ写して使う
3. `question-agent` は質問案、`fresh-review-agent` は二次情報ベースの指摘、`intent-review-agent` は一次情報ベースの趣旨適合確認を返す
4. 返答は親オーケストレータが統合し、人間への説明、実装、PR コメントへ反映する

この定義は repo 内で役割分担を再現するための正本です。実際の subagent 起動方法やモデル選択は Codex 側の機能に依存するため、現時点では親オーケストレータが同等設定へ写して使います。
