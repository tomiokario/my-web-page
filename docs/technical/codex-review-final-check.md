# Codex Review 最終チェック

push 反応型の Codex Review が有効な Pull Request では、GitHub 上の Codex Review をローカルの fresh review と intent review の後に行う最終チェックとして扱います。ローカルで要求との整合と人間の意図との整合を確認し、その結果を push した後、PR 上で独立した確認を受けます。

## 位置付け

1. 実装、ローカル検証、必要なドキュメント更新を行う
2. fresh review で、合意済み Issue、関連コメント、現在差分、validation profile、evidence の整合を確認する
3. intent review で、一次情報 handoff と最新の補正指示に対する趣旨適合を確認する
4. fresh review と intent review が `OK` になった差分を push し、PR を作成または更新する
5. `.codex/skills/codex-review-watch/SKILL.md` に従って Codex Review を監視する

## コメントが届いた場合

Codex Review の問題コメントを検出したら、親オーケストレータが内容を判断します。

- 妥当な指摘: 該当 review comment に `+1` reaction を付け、修正、検証、fresh review、intent review、返信案作成、再 push、Codex Review 監視へ進む
- 妥当でない指摘: 該当 review comment に `-1` reaction を付け、修正せず人間へ相談する
- 判断に迷う指摘: reaction の前に根拠を整理し、人間へ相談する

妥当な指摘を修正した後は、PR 上の Codex Review だけで完了扱いにせず、再度 fresh review と intent review を通してから push します。Codex Review への対応内容は該当 review thread へ返信し、それとは別に見つけた独自の追加修正や補足は新規 PR コメントとして共有します。

## 完了条件

次の条件が揃ったときに、PR 作成と Codex Review 完了をユーザーへ報告します。

- 最新差分に対する fresh review が `OK`
- 最新差分に対する intent review が `OK`
- 最新 push 以降の Codex Review に `+1` reaction が付いている
- 未対応の妥当な Codex Review コメントが残っていない

監視スクリプトが GitHub events から対象 push を特定できない場合は、監視開始以降に付いた `+1` reaction だけを完了扱いにします。これにより、古い review cycle の reaction を最新 push の完了として扱わない状態を保ちます。

完了報告では、fresh review と intent review を実施したこと、Codex Review の最終チェック結果、実行したローカル検証を簡潔に示します。
