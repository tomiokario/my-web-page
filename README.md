
# my web page
- 公開ページ：https://www.tomiokario.com/
- 仮ページ：https://my-web-page-fawn-seven.vercel.app/
- DeepWiki：https://deepwiki.com/tomiokario/my-web-page
  - 本リポジトリについて解説されています（英語）
  - AI（Devin AI）に質問できます（日本語，英語対応）

## ローカル環境での使い方

パッケージのインストール（初回のみ）
```
npm install
```

ローカルサーバの起動
```
npm start
```

テスト
- issue 37を参照してください．testを実施した場合，通常のjsonファイルが上書きされるため，npm startやタスク終了の前にconvert-publicationを実施する必要があります．
```
npm test
```

## 出版物データの更新方法

CSVファイルから出版物データをJSONに変換するツールを用意しています。

1. 最新の出版物データを`src/data/publication_data.csv`に配置
2. 以下のコマンドを実行
   ```
   npm run convert-publications
   ```
3. 変換されたJSONデータが`src/data/publications.json`に保存され、Webサイトで使用可能になります

詳細な使用方法や注意事項は[こちら](docs/publications-management.md)を参照してください。
