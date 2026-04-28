# 並列 Issue 対応ワークフロー

このドキュメントは、複数の Issue を同時に進めるときの全体設計、実行順序の決め方、`git worktree` を使った作業分離、Pull Request 作成後の後片付けをまとめます。

ここでの並列対応は、「1 つの Issue につき 1 つの作業ブランチ、1 つの worktree、1 つの Codex スレッド」を基本単位にします。親となる進行管理スレッドは Issue の棚卸し、依存関係の整理、実行順序の決定、進捗の集約、merge 後の worktree 削除、ローカルブランチ削除、リモートブランチ削除を担当し、各作業スレッドは割り当てられた Issue の実装、検証、Pull Request 作成までを担当します。

Codex からこの運用を呼び出す場合は、repo 内の `.codex/skills/parallel-issue-processing/SKILL.md` を正本とする `$parallel-issue-processing` skill を使います。

## 実行可能性

この運用は実行可能です。ただし、Codex の sandbox とネットワーク設定によって、できる範囲が変わります。

### 必要な前提

- GitHub の Issue、Pull Request、チェック結果を取得できること
- 作業ブランチを作成できること
- `git worktree add` で worktree を作成できること
- 各 worktree が Codex の書き込み可能範囲に入っていること
- push と Pull Request 作成ができること
- Wiki を更新する場合は `https://github.com/tomiokario/my-web-page.wiki.git` を clone / pull / push できること

### Codex 設定ごとの注意点

`承認ポリシー: Never`、`サンドボックス: Workspace write`、`ネットワークアクセス: 無効` の設定では、ローカルファイル編集を進められます。ただし、次の操作は環境により止まります。

- GitHub からの最新 Issue 取得
- Wiki の clone / pull / push
- 作業ブランチ作成、commit、worktree 作成など `.git` への書き込み
- リモートへの push
- Pull Request 作成
- GitHub Actions や Vercel のチェック結果確認

この repo の標準手順として、進行管理スレッドの Codex が worktree と作業ブランチを作成し、その後に各作業スレッドへ渡します。

worktree は Codex の書き込み可能範囲内に置きます。sibling ディレクトリが sandbox 外になる設定では削除や後片付けができなくなるため、repo 内の gitignored な `tmp/worktrees/` を標準の置き場所にします。

ネットワークアクセスを必要とする push、Pull Request 作成、チェック確認、Wiki 更新は、Codex のネットワークアクセスが有効な環境で Codex が行います。ネットワークアクセスが無効な場合は、進行管理スレッドが未実行の操作と必要な設定を人間へまとめて報告します。

## 推奨構成

### ディレクトリ構成

worktree は本体 repo 内の `tmp/worktrees/` に置きます。`tmp/` は gitignore 済みなので、親 worktree の差分へ混ざりません。

```text
my-web-page/
  tmp/
    worktrees/
      issue89/              # Issue 89 用 worktree
      issue90/              # Issue 90 用 worktree
      issue91/              # Issue 91 用 worktree
```

この置き方なら、Codex の writable root が本体 repo だけでも、作業スレッドが自分の worktree を編集でき、進行管理スレッドが merge 後に削除できます。親 worktree の `git status` で `tmp/` が出ないことを確認してから使います。

ただし、`git worktree remove` は worktree ディレクトリだけでなく `.git/worktrees/` も更新します。sandbox 設定によっては通常実行で削除が止まるため、その場合は `git worktree remove` の承認を取って後片付けします。

### スレッド構成

- 進行管理スレッド: Issue 一覧取得、close 候補の整理、依存関係と並列グループの決定、各作業スレッドへの handoff 作成、Pull Request 状態の集約
- 作業スレッド: 1 Issue だけを担当し、専用 worktree と専用ブランチで実装、検証、Pull Request 作成を行う
- 必要な review agent: 各作業スレッド内で、repo 既定の Issue 対応フローに沿って実装差分を確認する

進行管理スレッドは各 Issue の実装詳細を抱え込まず、対象 Issue、受け入れ条件、依存関係、現在の状態、次の判断だけを管理します。

## 手順

### 1. Issue 一覧を取得する

進行管理スレッドは、open Issue を取得し、次の情報を一覧化します。

- Issue 番号、タイトル、ラベル、最終更新日時
- close してよい候補
- 実装が必要な候補
- 仕様確認が必要な候補
- 他 Issue の完了を待つ候補

close してよい候補は、Issue 本文、関連コメント、現在の repo 状態から「対応済み」と判断できるものに限ります。判断理由を短く整理して Issue にコメントし、実際の close は人間が行います。

### 2. 依存関係を整理する

各 Issue を次の観点で分類します。

- 変更対象ファイルが重なっているか
- データ生成物や共通テストに影響するか
- 片方の完了後にもう片方の判断が変わるか
- 同じドキュメントや同じ UI 領域を更新するか
- 片方が先に merge されると rebase が必要になるか

同じファイルや同じ仕様境界を触る Issue は、原則として同じ並列グループに入れません。並列化する場合でも、先に merge する順番と rebase 担当を決めます。

### 3. 実行順序を作る

進行管理スレッドは、Issue を次のように並べます。

- `close 候補`: 実装せず、完了扱いでよい理由をコメントし、人間が close する
- `第 1 並列グループ`: 互いに変更対象が重ならず、merge 順序の制約が弱い Issue
- `第 2 並列グループ`: 第 1 グループの結果を受けてから着手する Issue
- `単独実行`: 変更範囲が広い、または他 Issue への影響が強い Issue

実行順序には、各 Issue の validation profile、想定される検証、衝突しそうなファイル、作業ブランチ名を含めます。

### 4. worktree とブランチを用意する

作業ブランチ名は `codex/issueNN-short-topic` の形式にします。worktree は `tmp/worktrees/issueNN` に作成します。

```bash
git checkout main
git pull --rebase origin main
git worktree add tmp/worktrees/issue91 -b codex/issue91-publications-test-isolation main
```

すでに worktree がある場合は、次を確認します。

```bash
git worktree list
git -C tmp/worktrees/issue91 status --short --branch
```

worktree に未完了差分がある場合は、そのスレッドの作業として扱い、進行管理スレッドが巻き戻しません。

### 5. 作業スレッドへ handoff する

各作業スレッドには、次の情報だけを渡します。

- 対象 Issue
- 合意済み仕様と受け入れ条件
- 変更タイプと validation profile
- 対象 worktree とブランチ
- 触ってよい範囲、触らない範囲
- 必要な検証コマンド
- 依存している Issue と merge 順序

作業スレッドは、割り当てられていない Issue や他 worktree の差分を変更しません。

### 6. 各作業スレッドで実装・検証・レビューする

各作業スレッドは、repo 既定の Issue 対応フローに沿って進めます。

- 変更前の状態を確認する
- 必要なテストや確認手順を先に決める
- 実装する
- validation profile に沿った evidence を残す
- 実装差分に対する確認を行う
- `git status` で意図しない差分がないことを確認する
- commit する

UI やコンテンツ変更では、ローカル確認が必要かを Pull Request 作成前に判断します。人間がローカル確認を希望した場合は、push と Pull Request 作成を待ちます。

### 7. Pull Request を作成する

作業スレッドは、作業ブランチを push し、日本語のタイトルと本文で Pull Request を作成します。

本文には次を含めます。

- 対応した Issue
- 変更内容
- 確認したこと
- 残っている注意点
- merge 時に Issue を閉じる場合の `close: #NN`

Pull Request 作成後の補足は、既存コメントや本文を安易に更新せず、必要に応じて新規コメントで共有します。

### 8. チェックと merge 順序を管理する

進行管理スレッドは、各 Pull Request の状態を一覧化します。

- CI / Vercel / テストの状態
- レビュー待ち
- rebase 必要
- merge 可能
- merge 後に後続 Issue へ影響する内容

同じ領域を触る Pull Request が複数ある場合は、先に merge するものを決めます。後続 Pull Request は、先行 Pull Request の merge 後に `main` を取り込み、必要な再検証を行います。

### 9. merge 後に worktree とブランチを後片付けする

ユーザーから「merge しました」と連絡があったら、進行管理スレッドが primary repo worktree で担当 worktree の状態を確認し、main の最新化、worktree 削除、ローカルブランチ削除、リモートブランチ削除、worktree prune、全体の完了確認を行います。対象 Issue の worktree 内では後片付けコマンドを実行しません。

```bash
cd /path/to/my-web-page
git checkout main
git pull --rebase origin main
git worktree remove tmp/worktrees/issue91
git branch -d codex/issue91-publications-test-isolation
git push origin --delete codex/issue91-publications-test-isolation
git worktree prune
```

`git worktree remove`、`git branch -d`、`git push origin --delete`、`git worktree prune` は進行管理スレッドが primary repo worktree で実行します。`git worktree remove` が `.git/worktrees/` の削除権限で止まる場合は、承認付きで同じコマンドを再実行します。リモートブランチがすでに削除済みの場合は、その結果を確認して次へ進みます。未 merge の worktree や未 push の差分が残っている場合は、進行管理スレッドが状態を報告して削除を止めます。

## 並列化の判断基準

並列化しやすい Issue:

- 変更対象ファイルが重ならない
- 片方の仕様判断がもう片方に影響しない
- 検証コマンドを独立して実行できる
- 片方が merge されても、もう片方の rebase が軽い

単独実行が向く Issue:

- 共通データモデル、生成物、共通ユーティリティを大きく変更する
- 同じ docs や同じ UI 領域を広く編集する
- 先に close / 方針確認が必要な Issue と強く結びついている
- 外部サービスや Wiki 更新など、ネットワークと人間確認が多い

## Wiki 更新時の扱い

GitHub Wiki は `https://github.com/tomiokario/my-web-page.wiki.git` で管理します。Wiki に並列 Issue 対応の説明を追加する場合は、既存の multi-agent 開発ページは残し、別ケースの新規ページとして追加します。このドキュメントのうち、方針、全体像、役割分担、代表的な流れを中心に書きます。

Wiki では細かなコマンドや validation profile の詳細を増やしすぎず、具体的な入出力契約や検証 evidence は repo 内の `AGENTS.md`、`.codex/agents/*.toml`、この手順書へ誘導します。

Wiki を更新できる環境では、次の順序で進めます。

```bash
git clone https://github.com/tomiokario/my-web-page.wiki.git
cd my-web-page.wiki
git pull --rebase
```

既存の multi-agent 開発ページがある場合は、そのページをそのまま残し、新しいページとして「複数 Issue の並列対応」を追加します。更新後は、新規ページ単体で方針が読めること、既存ページから導線があること、repo 内手順書への参照が自然であることを確認します。
