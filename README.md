
# my web page
- 仮公開ページ：https://my-web-page-fawn-seven.vercel.app/
- original：https://www.tomiokario.com/

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
```
npm test
```

## 出版物データの更新方法

CSVファイルから出版物データをJSONに変換するツールを用意しています。

1. 最新の出版物データを`data/publication_data.csv`に配置
2. 以下のコマンドを実行
   ```
   ts-node scripts/convertPublications.ts
   ```
3. 変換されたJSONデータが`src/data/publications.json`に保存され、Webサイトで使用可能になります

詳細な使用方法や注意事項は[こちら](docs/publications-management.md)を参照してください。
