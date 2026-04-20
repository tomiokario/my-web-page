# Repo Local Agent Definitions

このディレクトリには、issue 57 で整理した役割分担を次回以降も再利用できるようにするための repo ローカル定義を置きます。

- [question-agent.toml](./question-agent.toml): 質問担当
- [implementation-agent.toml](./implementation-agent.toml): 実装担当
- [fresh-review-agent.toml](./fresh-review-agent.toml): fresh review 担当

前提:

- ユーザー窓口は親オーケストレータだけが持ちます
- 各 agent は人間へ直接質問しません
- Issue / PR への書き込み権限は `AGENTS.md` と `docs/technical/issue-validation-loop.md` の条件に従います

使い方:

1. 親オーケストレータが対象 Issue と制約を整理する
2. 必要な role の TOML を参照し、その role / model / instructions / 入出力契約を実際の subagent 起動設定へ写して使う
3. 返答は親オーケストレータが統合し、人間への説明、実装、PR コメントへ反映する

この定義は repo 内で役割分担を再現するための正本です。実際の subagent 起動方法やモデル選択は Codex 側の機能に依存するため、現時点では親オーケストレータが同等設定へ写して使います。
