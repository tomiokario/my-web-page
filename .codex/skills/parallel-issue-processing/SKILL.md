---
name: parallel-issue-processing
description: Use when the user wants Codex to process multiple GitHub issues in parallel using a management thread, per-issue Codex threads, git worktrees, separate branches, pull requests, and post-merge cleanup. Applies to planning issue execution order, identifying close candidates, creating per-issue worktrees, delegating issue work, tracking PR status, and coordinating cleanup.
metadata:
  short-description: Run multiple issues in parallel with worktrees
---

# Parallel Issue Processing

この skill は、複数の GitHub Issue を同時に進めるときに使う。1 Issue につき 1 worktree、1 作業ブランチ、1 Codex スレッドを基本単位にし、進行管理スレッドが全体の順序と状態を管理する。

repo に `docs/technical/parallel-issue-workflow.md` がある場合は、それを正本として確認する。ここでは実行時に必要な手順だけを扱う。

## 基本方針

- 進行管理スレッドが Issue 一覧、close 候補、依存関係、並列グループ、Pull Request 状態を管理する
- 各作業スレッドは 1 Issue だけを担当し、自分の worktree、ブランチ、差分、検証、Pull Request、merge 後の worktree 削除を扱う
- 進行管理スレッドは merge 後のローカルブランチ削除、リモートブランチ削除、worktree prune、全体の完了確認を扱う
- worktree は repo 内の gitignored な `tmp/worktrees/issueNN` に作る
- close してよい Issue は、完了扱いでよい理由を Issue にコメントし、実際の close は人間が行う
- sibling worktree は sandbox 外になりやすいため標準の置き場所にしない
- `git worktree remove` が `.git/worktrees/` の権限で止まる場合は、同じコマンドを承認付きで再実行する

## 進行管理スレッドの手順

1. `git status --short --branch` と `git worktree list --porcelain` で現在状態を確認する
2. GitHub の open Issue を取得する
3. Issue を次に分ける
   - close 候補
   - 仕様確認が必要なもの
   - 並列実行候補
   - 順番待ち
4. close 候補は、対応済みと判断した理由を Issue にコメントし、人間に close を依頼する
5. 残った Issue は、変更対象、データ生成物、共通テスト、docs、UI 領域、merge 順序の依存関係を見る
6. 並列グループと単独実行 Issue を決める
7. 各 Issue に `codex/issueNN-short-topic` ブランチと `tmp/worktrees/issueNN` worktree を作る
8. 各作業スレッドへ、対象 Issue、受け入れ条件、validation profile、worktree、ブランチ、触ってよい範囲、検証コマンド、merge 順序を渡す
9. Pull Request 作成後は、チェック状態、レビュー状態、rebase 要否、merge 順序を一覧で管理する
10. 人間から merge 完了の連絡を受けたら、各作業スレッドに自分の worktree を後片付けさせ、進行管理スレッドがブランチ削除と完了状態の集約を行う

## worktree 作成

進行管理スレッドが作る。

```bash
git checkout main
git pull --rebase origin main
git worktree add tmp/worktrees/issue91 -b codex/issue91-publications-test-isolation main
git -C tmp/worktrees/issue91 status --short --branch
```

作成後、その worktree を担当する Codex スレッドへ渡す。作業スレッドは自分の Issue の worktree だけを扱う。

## 作業スレッドの完了条件

各作業スレッドは、repo の通常 Issue 対応フローに従う。

- 実装、検証、必要な review が完了している
- `git status` に意図しない差分がない
- commit 済みである
- 作業ブランチへ push 済みである
- Pull Request が作成されている
- Pull Request 本文に変更内容、確認結果、残課題、必要なら `close: #NN` がある

## merge 後の後片付け

各作業スレッドが、自分の担当 worktree を削除する。

```bash
git checkout main
git pull --rebase origin main
git worktree remove tmp/worktrees/issue91
```

進行管理スレッドが、merge 済みブランチを削除して全体を確認する。

```bash
git checkout main
git pull --rebase origin main
git branch -d codex/issue91-publications-test-isolation
git push origin --delete codex/issue91-publications-test-isolation
git worktree prune
```

未 merge の差分、未 push の変更、削除できない worktree がある場合は、作業スレッドが状態を進行管理スレッドへ報告して worktree 削除を止める。進行管理スレッドは、対象ブランチが merge 済みであることを確認してからブランチを削除する。
