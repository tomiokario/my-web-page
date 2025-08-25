
# my web page

- 公開ページ: https://www.tomiokario.com/
- 仮ページ: https://my-web-page-fawn-seven.vercel.app/
- DeepWiki: https://deepwiki.com/tomiokario/my-web-page
  - 本リポジトリについての英語解説
  - AI への質問対応（日本語/英語）

## ローカル環境での使い方

- 依存関係のインストール（初回のみ）
  ```
  npm install
  ```
- 開発サーバ起動
  ```
  npm start
  ```
- テスト実行
  ```
  npm test
  ```
  - メモ: スクリプトのテストで一時的に`src/data/publications.json`が生成/上書きされます（テスト後に削除されます）。テストを中断した場合などは、必要に応じて変換スクリプトを再実行してください。

## 出版物データの更新方法

CSV から出版物データを JSON に変換するユーティリティを提供しています。

1. 最新の出版物データを`src/data/publication_data.csv`に配置
2. 以下のコマンドを実行
   ```
   npm run convert-publications
   ```
3. 変換済み JSON が`src/data/publications.json`に保存され、Web サイトで使用されます

詳細は[docs/publications-management.md](docs/publications-management.md)を参照してください。
