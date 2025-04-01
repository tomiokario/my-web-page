# CSV to JSON 変換スクリプト

このドキュメントでは、出版物データをCSVからJSONに変換するスクリプトの使用方法について説明します。

## 概要

`scripts/convertPublications.js`は、CSVフォーマットの出版物データを読み込み、JSONフォーマットに変換して保存するスクリプトです。このスクリプトは開発時のデータ更新ツールとして使用されます。

## 入出力ファイル

- **入力**: `data/publication_data.csv`
- **出力**: `src/data/publications.json`

## 使用方法

1. 最新の出版物データを`data/publication_data.csv`に配置します
2. 以下のコマンドを実行します：

```bash
node scripts/convertPublications.js
```

3. 変換が完了すると、`src/data/publications.json`が更新されます

## CSVファイルの形式

CSVファイルは以下の列を含む必要があります：

1. 未入力項目有り（Yes/No）
2. 名前（著者名と論文タイトル）
3. Japanese（日本語）（日本語での著者名と論文タイトル）
4. type（論文の種類）
5. Review（査読の有無）
6. Authorship（著者の役割）
7. Presentation type（発表の種類）
8. DOI（Digital Object Identifier）
9. web link（ウェブリンク）
10. Date（日付）
11. Others（その他の情報）
12. site（開催場所）
13. journal / conference（ジャーナル名または会議名）

## 注意事項

- CSVファイルの1行目はヘッダー行として扱われます
- 空行は無視されます
- 引用符（"）で囲まれた値内のカンマは、区切り文字ではなく値の一部として扱われます