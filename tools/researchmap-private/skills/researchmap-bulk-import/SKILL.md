---
name: researchmap-bulk-import
description: Convert publication_master.json into researchmap bulk-import JSONL, then use the generated manual-review file to ask only for missing or ambiguous fields before regenerating the import file.
---

# Researchmap Bulk Import

この skill は `publication_master.json` から researchmap 用の一括登録 JSONL を作る repo 内ツールです。`tmp/researchmap/**` や review / quarantine の生成物は local-only で扱います。

## 位置づけ

- 通常運用の本線は `researchmap -> publication_master.json -> publications.json` で、公開側の tracked data 更新はここで完結します
- この skill は、必要なときだけ `publication_master.json` から researchmap へ安全に戻すための補助です
- `researchmapMerge` / `researchmapReversibleExport` / `researchmapConsistency` は、既存 researchmap 側の情報を壊しにくくし、生成結果の由来や整合を追えるようにする補助として扱います
- canonical `fields` を持つ `publication_master.json` を入力にし、researchmap payload はそこから直接組み立てます
- local-only に残すのは `tmp/researchmap/**`、review / quarantine / archive の生成物、将来のローカル補助メモです

## 手順

1. `node scripts/exportResearchmapJson.mjs --input <path-to-publication_master.json> --output-dir <path-to-output> --researchmap-user-id R...` を実行します。
2. `import.jsonl` と `manual-review.json` を確認します。`--existing-jsonl` を使った場合は `merge-review.json` と `quarantine.jsonl` も確認し、quarantine 行はそのまま再 import しません。
3. 曖昧な項目だけを対話で確認します。

## 既定ルール

- `IWH` は査読付きの国際会議プロシーディングスとして扱う
- `Optical Review` は査読付き学術雑誌論文として扱い、招待論文にはしない
- `Technical Digest` `Program and Abstracts` `Program and Proceedings` などの国際会議予稿集は `論文` に寄せる
- `ITE Tech. Rep. / 映情学技報 / MMS` 系は `MISC` に寄せる
- `test/fixtures/current-export.jsonl` は synthetic fixture として扱い、実データの export をそのまま残さない
- reversible sidecar は再現に必要な情報だけを持ち、`localMeta.notes` は含めない

## 判定順

1. まず canonical `fields` を正とし、`publication_master.json` から researchmap payload を直接組み立てる本線を確認する
2. 既存の Web サイト用データは、reversible sidecar や比較確認が必要なときだけ参照する
3. 共著者本人や所属機関の公開業績を確認する
4. それでも曖昧なら researchmap マニュアルの定義に寄せる
