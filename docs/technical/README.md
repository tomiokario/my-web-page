# 技術者向けドキュメント

このディレクトリには、開発者・技術者向けの技術仕様やアーキテクチャに関するドキュメントを配置しています。

## ドキュメント一覧

### アーキテクチャ・設計

- [プロジェクト構造](./project-structure.md) - ディレクトリ構成とファイル構造
- [DocDD](./DocDD.md) - システムアーキテクチャの詳細設計書
- [多言語サポート実装](./multilingual-support.md) - 国際化対応の技術詳細

### 開発・テスト

- [開発ワークフロー](./development-workflow.md) - 開発環境のセットアップと作業手順
- [テスト戦略](./testing-strategy.md) - テストの方針と実装
- [テスト改善計画](./test-improvement-plan.md) - テスト環境の改善提案

## クイックスタート

### 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone [repository-url]
cd my-web-page

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start
```

### 主要な技術スタック

- **フレームワーク**: React 18.3.1
- **言語**: TypeScript 4.9.5
- **UIライブラリ**: Mantine 7.17.4
- **スタイリング**: Emotion
- **ルーティング**: React Router 6.3.0
- **テスト**: Jest + React Testing Library
- **ビルドツール**: Create React App

## 開発ガイドライン

### コーディング規約

1. TypeScriptの型定義を必ず使用
2. コンポーネントは関数コンポーネントで実装
3. カスタムフックを活用してロジックを分離
4. テストを必ず作成

### ディレクトリ構成の原則

```
src/
├── components/      # 再利用可能なUIコンポーネント
├── pages/          # ページコンポーネント
├── contexts/       # React Context
├── hooks/          # カスタムフック
├── utils/          # ユーティリティ関数
├── types/          # TypeScript型定義
└── data/           # 静的データ
```

### Gitワークフロー

1. mainブランチから機能ブランチを作成
2. 機能実装・テスト作成
3. プルリクエストを作成
4. レビュー後にmainブランチにマージ

## よく使うコマンド

```bash
# 開発サーバー起動
npm start

# テスト実行
npm test

# テスト（ウォッチモード）
npm run test:watch

# ビルド
npm run build

# 出版物データの変換
npm run convert-publications
```

## トラブルシューティング

### npm installでエラーが発生する場合

```bash
# キャッシュクリアと再インストール
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### OpenSSLエラーが発生する場合

package.jsonのスクリプトに`NODE_OPTIONS=--openssl-legacy-provider`が設定されています。

### テストが失敗する場合

```bash
# テストキャッシュのクリア
npm test -- --clearCache
```

## パフォーマンス最適化

- React.memoを使用した不要な再レンダリングの防止
- useMemoとuseCallbackの適切な使用
- 画像の遅延読み込み
- コード分割（必要に応じて）

## セキュリティ考慮事項

- XSS対策: Reactのデフォルトエスケープを活用
- 依存関係の定期的な更新
- 環境変数による機密情報の管理
- CSRFトークンの実装（API連携時）

## 関連リソース

- [React公式ドキュメント](https://react.dev)
- [TypeScript公式ドキュメント](https://www.typescriptlang.org/docs/)
- [Mantine公式ドキュメント](https://mantine.dev)
- [管理者向けドキュメント](../admin/README.md)