---
name: codex-review-watch
description: Use after pushing a Pull Request branch when the repository has push-triggered Codex Review enabled. Poll the PR reactions and review comments until Codex Review either reports issues to address or marks the PR reviewed with a thumbs-up reaction.
metadata:
  short-description: Watch push-triggered Codex Review on PRs
---

# Codex Review Watch

この skill は、push 後に GitHub 上で動く Codex Review の完了状態を監視し、問題コメントが届いたらローカル Codex の通常フローへ戻すために使う。

## 役割

- PR の先頭メッセージにつく `eyes` / `+1` reaction を監視する
- Codex Review 由来の Issue comment / PR review / review thread comment を検出する
- 問題コメントが見つかったら、コメント本文と URL を Markdown または JSON で出力して停止する
- `+1` reaction が確認できたら成功として停止する

この script は GitHub の状態監視だけを担当する。コメント修正、マルチエージェント実装、再 push、返信投稿は親オーケストレータがこの skill の手順に沿って行う。

## 監視 script

```bash
node .codex/skills/codex-review-watch/scripts/watch-codex-review.mjs --pr <PR番号>
```

主な option:

- `--pr <number>`: 監視する PR 番号。省略時は現在ブランチの PR を `gh pr view` で取得する
- `--repo <owner/name>`: 対象 repo。省略時は `gh repo view` で取得する
- `--interval <seconds>`: polling 間隔。既定は 30 秒
- `--timeout <seconds>`: timeout。既定は 1800 秒
- `--author-pattern <regex>`: Codex Review の投稿者判定。既定は `codex|openai`
- `--state <path>`: 既読 comment ID を保存する state file。既定は `tmp/codex-review-watch/pr-<number>.json`
- `--once`: 1 回だけ確認して終了する
- `--json`: 結果を JSON で出力する

終了コード:

- `0`: 最新 push 以降の `+1` reaction を確認し、Codex Review が完了した
- `1`: `--once` で確認した時点では pending / reviewing だった
- `2`: Codex Review の問題コメントを検出した
- `3`: timeout した
- `4`: PR / repo / GitHub API の取得に失敗した

## push 後の運用

1. 作業ブランチへ push する
2. `watch-codex-review.mjs` を実行する
3. exit code `2` の場合は、出力された comment URL と本文を確認し、妥当な指摘には `+1` reaction を付けて修正へ進む。妥当でない指摘には `-1` reaction を付け、その時点で人間へ相談する
4. 修正後に commit / push する
5. script を再実行する
6. exit code `0` になるまで繰り返す
7. `+1` reaction が確認できたら、人間へ PR 作成と Codex Review 完了を報告する

## 妥当性リアクション

Codex Review の問題コメントを検出したら、親オーケストレータが内容を判断する。妥当な指摘は該当 review comment に `+1` reaction を付け、修正、検証、返信、再 push へ進む。妥当でない指摘は該当 review comment に `-1` reaction を付け、修正せず人間へ相談する。判断に迷う場合も、その時点で人間へ相談する。

## コメント返信

Codex Review コメントへ返信する場合は、親オーケストレータが内容、送信先、影響をまとめて人間確認を挟む。対外コメントでは内部の role 名や進行用語を出さず、何を直したか、何を確認したか、残課題があるかを自然文で伝える。

## 注意

- `.env` や token file は読まない。GitHub 認証は `gh` の既存ログインを使う
- state file は `tmp/codex-review-watch/` に置き、repo へコミットしない
- approval 判定は PR の最新 push 以降の `+1` reaction だけを使い、古い push に対する thumbs-up を新しい push の完了扱いにしない
