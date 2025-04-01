# 出版物データの表示プロセス

このドキュメントでは、CSVファイルの出版物データがウェブサイト上でどのように処理され表示されるかについて説明します。

## データフロー概要

出版物データは以下のプロセスを経て、ウェブサイト上に表示されます：

1. CSVファイル（`data/publication_data.csv`）に出版物データを記録
2. 変換スクリプト（`scripts/convertPublications.js`）を実行してJSONファイルに変換
3. 変換されたJSONデータ（`src/data/publications.json`）をReactコンポーネントで読み込み
4. Publicationsコンポーネント（`src/pages/Publications.jsx`）でデータを整形して表示

## CSVファイルの構造

出版物データのCSVファイルは以下の列を含みます：

| 列番号 | 列名 | 説明 |
|-------|------|------|
| 1 | 未入力項目有り | 空の項目があるかどうか（Yes/No） |
| 2 | 名前 | 著者名と論文タイトル（英語） |
| 3 | Japanese（日本語） | 著者名と論文タイトル（日本語） |
| 4 | type | 論文の種類（Research paper, Journal paperなど） |
| 5 | Review | 査読の有無（Reviewed, Not reviewedなど） |
| 6 | Authorship | 著者の役割（Lead author, Co-authorなど） |
| 7 | Presentation type | 発表の種類（Oral, Posterなど） |
| 8 | DOI | Digital Object Identifier |
| 9 | web link | ウェブリンク |
| 10 | Date | 発表日 |
| 11 | Others | その他の情報 |
| 12 | site | 開催場所 |
| 13 | journal / conference | ジャーナル名または会議名 |

### CSVフォーマットの注意点

- 1行目はヘッダー行として扱われます
- 空行は無視されます
- 引用符（"）で囲まれた値内のカンマは、区切り文字ではなく値の一部として扱われます
- 名前フィールドと日本語フィールドは、「著者名, "タイトル"」の形式で記述されます
  - 例: `Rio Tomioka and Masanori Takabayashi, "Numerical simulations of neural network hardware based on self-referential holography"`

## CSVからJSONへの変換

`csvToJson.js`ユーティリティは、CSVファイルを読み込み、以下の処理を行います：

1. CSVファイルを行ごとに分割
2. 各行をCSV形式として正しく解析（引用符内のカンマを考慮）
3. 各フィールドをトリムし、適切なプロパティ名でマッピング
4. 空行や不正な形式の行をスキップ

変換されたJSONデータの例：

```json
{
  "hasEmptyFields": false,
  "name": "Rio Tomioka and Masanori Takabayashi, \"Numerical simulations of neural network hardware based on self-referential holography\"",
  "japanese": "冨岡莉生, 高林正典, \"自己参照型ホログラフィを用いたニューラルネットワークハードウェアの数値シミュレーション\"",
  "type": "Research paper (international conference)",
  "review": "Reviewed",
  "authorship": "Lead author",
  "presentationType": "Oral",
  "doi": "",
  "webLink": "https://example.com/paper1",
  "date": "2021年10月3日 → 2021年10月6日",
  "others": "",
  "site": "online",
  "journalConference": "ISOM21"
}
```

## Publicationsページでの表示

Publicationsコンポーネント（`src/pages/Publications.jsx`）は、JSONデータを読み込み、以下の処理を行います：

### データの整形

1. 名前フィールドから著者とタイトルを分離
   ```javascript
   const nameParts = pub.name.split(', "');
   const authors = nameParts[0];
   const title = nameParts.length > 1 ? nameParts[1].replace(/"/g, '') : pub.name;
   ```

2. 日本語フィールドからも同様に著者とタイトルを分離
   ```javascript
   const jaNameParts = pub.japanese.split(', "');
   japaneseAuthors = jaNameParts[0];
   japaneseTitle = jaNameParts.length > 1 ? jaNameParts[1].replace(/"/g, '') : pub.japanese;
   ```

3. 日付から年を抽出
   ```javascript
   const match = dateString.match(/(\d{4})/);
   return match ? parseInt(match[1], 10) : null;
   ```

### 表示機能

1. **年度フィルタリング**
   - ユニークな年度を抽出し、ドロップダウンリストとして表示
   - 選択された年度に基づいて出版物をフィルタリング

2. **言語切替**
   - 言語設定（ja/en）に応じて、適切な言語でタイトルと著者名を表示
   - 日本語モードでは日本語のタイトルと著者名、英語モードでは英語のタイトルと著者名を表示

3. **出版物リスト表示**
   - 各出版物は以下の形式で表示されます：
     - タイトル（太字）と年
     - 著者名（イタリック体）とジャーナル/会議名
     - ウェブリンク（存在する場合）

### 表示例

英語モードでの表示：
```
Numerical simulations of neural network hardware based on self-referential holography (2021)
Rio Tomioka and Masanori Takabayashi - ISOM21 [Link]
```

日本語モードでの表示：
```
自己参照型ホログラフィを用いたニューラルネットワークハードウェアの数値シミュレーション (2021)
冨岡莉生, 高林正典 - ISOM21 [Link]
```

## テスト

システムには以下のテストが実装されています：

1. **csvToJson.test.js**
   - 変換関数の存在確認
   - CSVファイルの存在確認
   - CSVからJSONへの正確な変換
   - 空行や不正な形式の行の適切な処理

2. **Publications.test.jsx**
   - 出版物リストの正常表示
   - 年度フィルターの機能
   - 言語切替（日本語/英語）の機能

## データ更新手順

出版物データを更新する場合は、以下の手順に従います：

1. `data/publication_data.csv`ファイルを編集または置き換え
2. 変換スクリプトを実行：
   ```bash
   node scripts/convertPublications.js
   ```
3. 変換が完了すると、`src/data/publications.json`が更新され、ウェブサイト上に反映されます