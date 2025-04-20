# 開発ワークフロー

このドキュメントでは、my-web-pageプロジェクトの開発ワークフロー、環境設定、およびベストプラクティスについて説明します。

## 開発環境のセットアップ

### 前提条件

- Node.js (v20.x LTS 以上推奨)
- npm (v10.x 以上推奨)
- Git

### リポジトリのクローン

```bash
git clone my-web-page>
cd my-web-page
```

### 依存関係のインストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm start
```

これにより、開発サーバーが起動し、ブラウザで http://localhost:3000 が開きます。コードを変更すると、ページは自動的に更新されます。

## プロジェクトの構造

プロジェクトの詳細な構造については、[プロジェクト構造](./project-structure.md)のドキュメントを参照してください。

## 開発フロー

### 1. 機能開発

新しい機能を開発する場合は、以下の手順に従ってください：

1. 新しいブランチを作成します：

   ```bash
   git checkout -b feature/feature-name
   ```

2. 必要なコンポーネント、フック、ユーティリティを実装します。
3. テストを作成し、実行します：

   ```bash
   npm test
   ```

4. 変更をコミットします：

   ```bash
   git add .
   git commit -m "Add feature: feature-name"
   ```

5. リモートリポジトリにプッシュします：

   ```bash
   git push origin feature/feature-name
   ```

6. プルリクエストを作成し、レビューを依頼します。

### 2. バグ修正

バグを修正する場合は、以下の手順に従ってください：

1. バグ修正用のブランチを作成します：

   ```bash
   git checkout -b fix/bug-description
   ```

2. バグを再現するテストを作成します。
3. バグを修正し、テストが通ることを確認します。
4. 変更をコミットします：

   ```bash
   git add .
   git commit -m "Fix: bug-description"
   ```

5. リモートリポジトリにプッシュします：

   ```bash
   git push origin fix/bug-description
   ```

6. プルリクエストを作成し、レビューを依頼します。

### 3. リファクタリング

コードをリファクタリングする場合は、以下の手順に従ってください：

1. リファクタリング用のブランチを作成します：

   ```bash
   git checkout -b refactor/description
   ```

2. 既存のテストが通ることを確認します。
3. コードをリファクタリングします。
4. すべてのテストが通ることを確認します。
5. 変更をコミットします：

   ```bash
   git add .
   git commit -m "Refactor: description"
   ```

6. リモートリポジトリにプッシュします：

   ```bash
   git push origin refactor/description
   ```

7. プルリクエストを作成し、レビューを依頼します。

## コンテンツ更新ワークフロー

### マークダウンコンテンツの更新

マークダウンコンテンツを更新する場合は、以下の手順に従ってください：

1. `public/markdown` ディレクトリ内の対応するマークダウンファイルを編集します。
2. 開発サーバーが実行中の場合は、変更が自動的に反映されます。
3. 変更をコミットします：

   ```bash
   git add public/markdown
   git commit -m "Update content: description"
   ```

4. リモートリポジトリにプッシュします。

詳細については、[マークダウンコンテンツ](./markdown-content.md)のドキュメントを参照してください。

### 出版物データの更新

出版物データを更新する場合は、以下の手順に従ってください：

1. Notionから最新の出版物データをCSV形式でエクスポートします。
2. エクスポートしたCSVファイルを `data/publication_data.csv` に配置します。
3. 以下のコマンドを実行して、CSVデータをJSONに変換します：

   ```bash
   ts-node scripts/convertPublications.ts
   ```

4. 変換が成功すると、`src/data/publications.json` が更新されます。
5. 変更をコミットします：

   ```bash
   git add data/publication_data.csv src/data/publications.json
   git commit -m "Update publication data"
   ```

6. リモートリポジトリにプッシュします。

詳細については、[出版物データの管理](./publications-management.md)のドキュメントを参照してください。

## テスト

### テストの実行

すべてのテストを実行するには：

```bash
npm test
```

特定のテストファイルを実行するには：

```bash
# 例: ComponentName.test.tsx を実行
npm test -- ComponentName.test.tsx
# または、ファイル名の一部を指定
npm test -- ComponentName
```

テストカバレッジを確認するには：

```bash
npm test -- --coverage
```

詳細については、[テスト戦略](./testing-strategy.md)のドキュメントを参照してください。

### デプロイ

プロジェクトは現在、Vercelにデプロイされています。デプロイは以下の手順で行われます：

1. 変更をpushしてGitHub上でPRを作成してレビュアーにレビューを依頼します。
2. Vercelが自動的に新しいビルドを作成し、デプロイします。

手動でデプロイする場合は、Vercelのダッシュボードから行うことができます。

## コーディング規約

### 基本原則

プロジェクトのコーディング規約は、リポジトリルートにある `.clinerules` ファイルに定義されています。開発を行う際は、このファイルに記載されたルールに従ってください。

主要なルールについては、[docs/README.md](./README.md#開発ルール) も参照してください。

### コンポーネント設計

- コンポーネントは単一責任の原則に従う
- データ取得と表示の関心を分離する
- プレゼンテーショナルコンポーネントとコンテナコンポーネントを分ける
- 共通のUIパターンは再利用可能なコンポーネントとして実装する

### 状態管理

- ローカル状態には `useState` を使用する
- 複雑な状態ロジックには `useReducer` を使用する
- コンポーネント間で共有する状態には `Context API` を使用する
- 副作用の管理には `useEffect` を使用する

### ファイル命名規則

- コンポーネント: `PascalCase.tsx`
- フック: `useHookName.ts`
- ユーティリティ: `camelCase.ts`
- テスト: `ComponentName.test.tsx` または `hookName.test.ts`

## パフォーマンス最適化

### メモ化

パフォーマンスを最適化するために、以下のフックを使用します：

- `useMemo`: 計算コストの高い値の再計算を防ぐ
- `useCallback`: コールバック関数の再作成を防ぐ
- `React.memo`: 不要な再レンダリングを防ぐ

### コード分割

大きなコンポーネントは、必要に応じて `React.lazy` と動的インポート (`import('./LazyComponent.tsx')`) を使用して分割します。`React.Suspense` でラップして、読み込み中のフォールバックUIを表示します。

## トラブルシューティング

### 一般的な問題と解決策

#### 開発サーバーが起動しない

1. Node.jsとnpmのバージョンを確認します：

   ```bash
   node -v
   npm -v
   ```

2. 依存関係を再インストールします：

   ```bash
   rm -rf node_modules
   npm install
   ```

3. キャッシュをクリアします：

   ```bash
   npm cache clean --force
   ```

#### テストが失敗する

1. テストファイルが最新のコードと一致していることを確認します。
2. モックが正しく設定されていることを確認します。
3. テスト環境を再設定します：

   ```bash
   npm test -- --clearCache
   ```

#### ビルドエラー

1. コンソールエラーを確認し、問題のあるファイルを特定します。
2. 依存関係の競合がないか確認します：

   ```bash
   npm ls
   ```

3. 必要に応じて依存関係を更新します：

   ```bash
   npm update
   ```

## 参考リソース

- [React ドキュメント](https://reactjs.org/docs/getting-started.html)
- [Mantine ドキュメント](https://mantine.dev/)
- [React Router ドキュメント](https://reactrouter.com/docs/en/v6)
- [React Testing Library ドキュメント](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest ドキュメント](https://jestjs.io/docs/getting-started)