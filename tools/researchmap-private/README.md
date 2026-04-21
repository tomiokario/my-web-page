# my-web-page to researchmap

`my-web-page` の `publication_master.json` から researchmap 一括登録用 JSONL を生成する repo 内ツールです。canonical `fields` を正規入力として、researchmap payload を直接構築します。

## このツールの位置づけ

- 通常運用の本線は `researchmap -> publication_master.json -> publications.json` で、公開側の tracked data 更新はここで完結します
- このディレクトリは、必要なときだけ `publication_master.json` から researchmap へ安全に戻すための補助ツールをまとめています
- `researchmapMerge` / `researchmapReversibleExport` / `researchmapConsistency` は、既存 researchmap 情報を壊しにくくし、生成結果の由来や整合を確認しやすくするための補助機能です
- `CSV -> master` の移行経路は残しますが、日常運用の本線ではない移行専用の補助です
- 旧 `researchmapFields` 形式の master は受け付けません。`publication_master.json` は canonical `fields` を持つ record を正本として扱います
- local-only に残すのは `tmp/researchmap/**`、review / quarantine / archive の生成物、将来のローカル補助メモで、`publication_master.json` 自体は public 側の tracked canonical data として扱います

## 使い方

```bash
node scripts/exportResearchmapJson.mjs \
  --input ../../src/data/publication_master.json \
  --output-dir ../../tmp/researchmap \
  --researchmap-user-id R000000000
```

既存の researchmap エクスポート `jsonl` を使って安全に再投入する場合は、`--existing-jsonl` を追加します。

```bash
node scripts/exportResearchmapJson.mjs \
  --input ../../src/data/publication_master.json \
  --output-dir ../../tmp/researchmap \
  --researchmap-user-id R000000000 \
  --existing-jsonl ../../tmp/researchmap/rm_researchers20260416.jsonl
```

## 主なファイル

- `scripts/exportResearchmapJson.mjs`
  - `publication_master.json` から researchmap 用 JSONL を生成する入口です
- `src/researchmapExport.mjs`
  - canonical `fields` から researchmap payload を直接組み立てる本体です
- `src/researchmapMerge.mjs` / `src/researchmapReversibleExport.mjs` / `src/researchmapConsistency.mjs`
  - 既存 researchmap 情報を壊しにくくし、生成結果の由来や整合を確認する補助です
- `scripts/importPublicationMasterFromCsv.ts`
  - CSV から canonical master を作る移行専用スクリプトです
- `skills/researchmap-bulk-import/SKILL.md`
  - このツールの使い方と判断順をまとめています

## 現在の運用メモ

- `tools/researchmap-private` は repo 内の通常ディレクトリとして扱います
- `tmp/researchmap/**` と `review` / `quarantine` / `archive` の生成物は local-only で、git に載せません
- `test/fixtures/current-export.jsonl` は synthetic fixture として扱い、実データの raw export は置きません
- `reversible-export.json` は再現に必要な master/publication 情報だけを保持し、`localMeta.notes` は含めません
- `src/researchmapClassificationRules.mjs` は、Publication 由来の補助入力を読むときの手動分類ルールです。canonical master からの出力本線を置き換えるものではありません

- merge policy の全体像
  - identity field は `researchmap record id -> DOI -> canonical fingerprint` の順で strict match し、既存側の identity が非空なら既存側を優先します
  - 既存 record の `insert.id` が空でも、strict match 後は generated 側の id を backfill します。ただし予約・照合の内部キーは effective key で管理し、id-less record が複数あっても衝突しないようにします
  - `volume` `number` `starting_page` `ending_page` `location` `description` `referee` `invited` `published_paper_owner_roles` `is_international_*` などの core field は、existing と generated の両方が non-empty で差分がある場合は review / quarantine に送ります
  - strict match を通過したあとに merge する canonical field は generated を正としつつ、`internal_note` など generated 側に無い researchmap-only field は existing から保持します
  - localized object は generated の non-empty locale を優先し、generated 側に無い locale だけ existing を fallback として残します

- `IWH` は査読付きの国際会議プロシーディングスとして出力する
- `Optical Review` は査読付き学術雑誌論文として出力し、招待論文フラグは立てない
- `Technical Digest` `Program and Abstracts` `Program and Proceedings` などの国際会議予稿集は `published_papers` に寄せる
- 既存の researchmap 側編集を保持したい場合は、researchmap からエクスポートした `jsonl` を `--existing-jsonl` に渡す
- 既存 JSONL との merge は `record id -> DOI -> canonical fingerprint` の deterministic match のみを使い、title 近傍候補や core field 競合は review に残す
- strict match 後に merge まで進んだ canonical field は generated を正とし、`internal_note` など generated 側に存在しない researchmap-only field だけ existing から保持する
- ただし localized object では generated の non-empty subkey を優先し、generated 側に無い locale だけ existing を fallback として残す
- `--existing-jsonl` 付きの merge で review / quarantine になった行は `import.jsonl` に入れず `quarantine.jsonl` に分離し、`merge-review.json` には generated input の行番号も残す
- 現在は `volume` `number` `starting_page` `ending_page` を citation 文字列から抽出して再生成する
- `publication_master.json` を編集したあとは、必要に応じて `npm run convert-publications` で `publications.json` も再生成しておく
- `publication_master.json` の `localMeta.notes` はローカル補助情報として扱い、researchmap export の判定や書誌情報抽出には使わない
