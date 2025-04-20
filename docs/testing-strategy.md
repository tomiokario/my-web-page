# テスト戦略

このドキュメントでは、my-web-pageプロジェクトのテスト戦略、テストの書き方、およびテスト実行方法について説明します。

## 概要

my-web-pageでは、Jest と React Testing Library を使用して、コンポーネント、フック、ユーティリティ関数のテストを行っています。テストは `src/__tests__` ディレクトリに配置されており、各コンポーネントやフックに対応するテストファイルが存在します。

テスト戦略の主な目的は以下の通りです：

1. コードの品質と信頼性を確保する
2. リグレッションを防止する
3. コンポーネントの仕様を文書化する
4. リファクタリングを安全に行えるようにする

## テスト構造

テストファイルは以下の命名規則に従っています：

- コンポーネントテスト: `ComponentName.test.tsx`
- フックテスト: `useHookName.test.ts`
- ユーティリティテスト: `utilityName.test.ts`

テストファイルは `src/__tests__` ディレクトリに配置されています：

```
src/__tests__/
├── ActiveFilters.test.tsx
├── App.test.tsx
├── csvToJson.test.ts
├── FilterDropdown.test.tsx
├── Footer.test.tsx
├── Header.test.tsx
├── LanguageContext.test.tsx
├── markdownLoader.test.ts
├── PublicationGroup.test.tsx
├── PublicationItem.test.tsx
├── Publications.test.tsx
├── PublicationsView.test.tsx
├── SubHeader.test.tsx
├── useFilters.test.ts
└── usePublications.test.ts
```

## テストの種類

プロジェクトでは以下の種類のテストを実施しています：

1. **単体テスト**: 個々のコンポーネント、フック、ユーティリティ関数の機能をテスト
2. **統合テスト**: 複数のコンポーネントやフックの連携をテスト

### 実際のコードベースにおける単体テストと統合テスト

#### 単体テスト

以下のテストファイルは、単一のコンポーネント、フック、またはユーティリティ関数の機能をテストする単体テストです：

- **useFilters.test.ts**: useFiltersフックの機能（フィルターオプションの抽出、フィルタリング、ドロップダウンの開閉、フィルターのリセット）を個別にテストします。

- **usePublications.test.ts**: usePublicationsフックの機能（年の抽出、出版物データの整形、ソート、グループ化）を個別にテストします。

- **PublicationsView.test.tsx**: 子コンポーネント（PublicationGroup）をモックして、PublicationsViewコンポーネントの機能をテストします。

- **ActiveFilters.test.tsx**: ActiveFiltersコンポーネントの機能（フィルタータグの表示、リセットボタンのクリックなど）をテストします。

- **FilterDropdown.test.tsx**: FilterDropdownコンポーネントの機能（ドロップダウンの表示、チェックボックスの選択など）をテストします。

- **PublicationItem.test.tsx**: PublicationItemコンポーネントの機能（出版物情報の表示、タグの表示など）をテストします。

- **csvToJson.test.ts**: csvToJson関数の機能（CSVデータのJSON変換）をテストします。

- **markdownLoader.test.ts**: markdownLoader関数の機能（Markdownファイルの読み込み）をテストします。

#### 統合テスト

以下のテストファイルは、複数のコンポーネントやフックが連携して動作することをテストする統合テストです：

- **Publications.test.tsx**: Publicationsコンポーネントと言語コンテキスト、フィルタリング機能などの連携をテストします。実際のLanguageProviderを使用し、ユーザーインタラクションの一連の流れをテストします。

- **LanguageContext.test.tsx**: LanguageContextとそれを使用するコンポーネントの連携をテストします。実際のuseLanguageフックを使用して、言語の切り替え機能と副作用をテストします。

- **App.test.tsx**: アプリケーションのルートコンポーネントであるAppコンポーネントと、それに含まれる主要コンポーネント（ヘッダー、メインコンテンツ、フッターなど）の連携をテストします。

## テストの書き方

### コンポーネントテスト

コンポーネントテストでは、React Testing Libraryを使用して、ユーザーの視点からコンポーネントの動作をテストします。

```tsx
// src/__tests__/PublicationsView.test.tsx の例
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import PublicationsView from '../components/publications/PublicationsView';
import { renderWithProviders } from '../test-utils/test-utils'; // カスタムレンダー関数を使用

// モックデータやモックコンポーネントの設定 (省略)
const mockProps = { /* ...props... */ };

// PublicationGroupコンポーネントをモック
jest.mock('../components/publications/PublicationGroup', () => {
  // ...モック実装...
});

describe('PublicationsView', () => {
  test('renders correctly and handles sort order change', () => {
    // Arrange: カスタムレンダー関数でコンポーネントを描画
    renderWithProviders(<PublicationsView {...mockProps} />);

    // Assert: 初期レンダリングを確認
    expect(screen.getByTestId('sort-order-select')).toHaveValue('type');
    expect(screen.getByTestId('publication-group')).toBeInTheDocument();

    // Act: 並び順を変更
    fireEvent.change(screen.getByTestId('sort-order-select'), { target: { value: 'chronological' } });

    // Assert: コールバックが呼ばれたことを確認
    expect(mockProps.onSortOrderChange).toHaveBeenCalledWith('chronological');
  });

  test('displays correct labels based on language', () => {
    // Arrange: 英語でレンダリング
    renderWithProviders(<PublicationsView {...mockProps} language="en" />);
    // Assert: 英語のラベルを確認
    expect(screen.getByText('By type')).toBeInTheDocument();

    // Arrange: 日本語でレンダリング (カスタムレンダー関数のオプションを使用)
    renderWithProviders(<PublicationsView {...mockProps} />, { initialLanguage: 'ja' });
    // Assert: 日本語のラベルを確認
    expect(screen.getByText('種類別に表示')).toBeInTheDocument();
  });
});
```

コンポーネントテストでは、`src/test-utils/test-utils.tsx` で定義されたカスタムレンダー関数 `renderWithProviders` を使用することが推奨されます。これにより、テストに必要なプロバイダー（Mantine, LanguageContext, Routerなど）が自動的に適用されます。

### フックテスト

フックテストでは、`@testing-library/react` の `renderHook` 関数を使用して、フックの動作をテストします。`act` を使用して状態更新をラップします。

```typescript
// src/__tests__/useFilters.test.ts の例
import { renderHook, act } from '@testing-library/react';
import useFilters from '../hooks/useFilters';

// モックデータ (省略)
const mockPublications = [ /* ...publications... */ ];

describe('useFilters', () => {
  it('should extract filter options correctly', () => {
    // Arrange: フックをレンダリング
    const { result } = renderHook(() => useFilters({ publications: mockPublications }));

    // Assert: フィルターオプションが正しく抽出されていることを確認
    expect(result.current.filterOptions.year).toEqual(['2022', '2021']);
    // ...他のオプションも同様に確認...
  });

  it('should filter publications correctly', () => {
    // Arrange
    const { result } = renderHook(() => useFilters({ publications: mockPublications }));

    // Assert: 初期状態ではフィルターなし
    expect(result.current.filteredPublications).toHaveLength(3);

    // Act: 2022年でフィルター (状態更新は act でラップ)
    act(() => {
      result.current.toggleFilter('year', '2022');
    });

    // Assert: フィルター結果を確認
    expect(result.current.filteredPublications).toHaveLength(2);
    expect(result.current.filteredPublications[0].year).toBe(2022);
  });

  it('should toggle dropdown correctly', () => {
    // Arrange
    const { result } = renderHook(() => useFilters({ publications: mockPublications }));

    // Assert: 初期状態は null
    expect(result.current.openDropdown).toBeNull();

    // Act: ドロップダウンを開く
    act(() => {
      result.current.toggleDropdown('year');
    });

    // Assert: 開いたドロップダウンのカテゴリを確認
    expect(result.current.openDropdown).toBe('year');

    // Act: 同じドロップダウンを再度トグルして閉じる
    act(() => {
      result.current.toggleDropdown('year');
    });

    // Assert: ドロップダウンが閉じていることを確認
    expect(result.current.openDropdown).toBeNull();
  });
});
```

### ユーティリティ関数テスト

ユーティリティ関数のテストでは、関数の入力と出力を検証します。Jest のマッチャー (`toBe`, `toThrow` など) を使用してアサーションを行います。

```typescript
// src/__tests__/csvToJson.test.ts の例
const fs = require('fs');
const path = require('path');
const { csvToJson } = require('../utils/csvToJson'); // テスト対象の関数

// テストデータのパス
const CSV_FILE_PATH = path.join(__dirname, '../../data/publication_data.csv');

describe('CSV to JSON conversion', () => {
  test('csvToJson function exists', () => {
    // Assert: 関数が存在することを確認
    expect(typeof csvToJson).toBe('function');
  });

  test('converts CSV to JSON correctly', () => {
    // Act: 関数を実行
    const jsonData = csvToJson(CSV_FILE_PATH);

    // Assert: 結果の基本的な形式を確認
    expect(Array.isArray(jsonData)).toBe(true);
    expect(jsonData.length).toBeGreaterThan(0);

    // Assert: 最初の要素に必要なプロパティが含まれていることを確認
    const firstItem = jsonData[0];
    expect(firstItem).toHaveProperty('name');
    expect(firstItem).toHaveProperty('type');
    // ...他のプロパティも同様に確認...

    // Assert: 特定のデータが正しく変換されていることを確認
    expect(firstItem.name).toContain('Rio Tomioka');
  });

  test('handles empty or malformed lines correctly', () => {
    // Arrange: テスト用のCSVデータを作成 (一時ファイルヘルパーを使用)
    const testCsvData = `...`; // 不正な行を含むCSVデータ
    const tempFilePath = createTempCsvFile(testCsvData); // ヘルパー関数 (省略)

    try {
      // Act
      const jsonData = csvToJson(tempFilePath);

      // Assert: 不正な行がスキップされ、有効なデータのみ変換されることを確認
      expect(jsonData.length).toBe(1); // 例: 有効な行が1行の場合
      expect(jsonData[0].name).toBe('Valid Name');
    } finally {
      // Cleanup: 一時ファイルを削除
      removeTempFile(tempFilePath); // ヘルパー関数 (省略)
    }
  });
});
```

## モックの使用

テストでは、Jest のモック機能 (`jest.mock`, `jest.fn`) を使用して、外部依存関係（モジュール、コンポーネント、関数）をモックし、テストを分離し、予測可能にします。

テスト対象が依存している外部モジュール、コンポーネント、または関数を制御するためにモックを使用します。テストデータのモックについては、後述の「テストデータの管理」セクションも参照してください。

### モジュールのモック

`jest.mock('module-name')` を使用してモジュール全体をモックします。

```typescript
// 例: axios モジュールをモック
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>; // 型付けされたモック

test('fetches data correctly', async () => {
  // Arrange: モックされた GET リクエストの戻り値を設定
  mockedAxios.get.mockResolvedValue({ data: { message: 'Success' } });

  // Act: データ取得関数を実行
  const data = await fetchData(); // fetchData は内部で axios.get を呼ぶと仮定

  // Assert: モックされたデータが返されることを確認
  expect(data.message).toBe('Success');
  expect(mockedAxios.get).toHaveBeenCalledWith('/api/data'); // 呼び出しを検証
});
```

### コンポーネントのモック

子コンポーネントのレンダリングを単純化したり、テスト対象コンポーネントのロジックに集中したりするために、コンポーネントをモックします。

```tsx
// src/__tests__/PublicationsView.test.tsx より
// PublicationGroupコンポーネントをモック
jest.mock('../components/publications/PublicationGroup', () => {
  // モックコンポーネントを返す関数
  return function MockPublicationGroup({ name, items, language }: { name: string; items: any[]; language: string }) {
    // 実際のレンダリングの代わりにシンプルな div を返す
    return (
      <div data-testid="publication-group">
        <div data-testid="group-name">{name}</div>
        {/* 必要に応じて他の情報を表示 */}
      </div>
    );
  };
});

// テスト内での使用
test('renders publication groups', () => {
  renderWithProviders(<PublicationsView {...mockProps} />);
  // モックされた PublicationGroup がレンダリングされることを確認
  expect(screen.getByTestId('publication-group')).toBeInTheDocument();
  expect(screen.getByTestId('group-name')).toHaveTextContent('Journal paper：原著論文');
});

```

### 関数のモック

`jest.fn()` を使用して関数をモックし、その呼び出しや戻り値を制御します。

```typescript
// src/__tests__/PublicationsView.test.tsx より
// モック関数をプロップとして渡す
const mockOnSortOrderChange = jest.fn();
const mockProps = {
  // ...他のプロップ...
  onSortOrderChange: mockOnSortOrderChange,
};

test('calls onSortOrderChange when sort order is changed', () => {
  renderWithProviders(<PublicationsView {...mockProps} />);

  // Act: イベントを発火
  fireEvent.change(screen.getByTestId('sort-order-select'), { target: { value: 'chronological' } });

  // Assert: モック関数が期待通りに呼び出されたか検証
  expect(mockOnSortOrderChange).toHaveBeenCalledTimes(1);
  expect(mockOnSortOrderChange).toHaveBeenCalledWith('chronological');
});
```

## テストデータの管理

テストの安定性と保守性を高めるために、テストデータの管理には以下の方法を採用しています。

### テストデータファクトリ

複雑なデータ構造（例: `Publication` オブジェクト）をテストで使用する場合、テストデータファクトリを使用します。ファクトリ関数は `src/test-utils/factories/` ディレクトリに配置します。

-   **目的**: テストごとに必要なデータを簡単に生成し、デフォルト値を提供しつつ、特定のプロパティを上書きできるようにします。
-   **例**: `src/test-utils/factories/publicationFactory.ts` では、`createPublication` 関数と `createPublications` 関数を提供しています。

```typescript
// src/__tests__/PublicationItem.test.tsx より
import { createPublication } from '../test-utils/factories/publicationFactory';

// ファクトリ関数を使用してテストデータを生成
const mockPublication = createPublication({
  id: 1,
  name: "Specific Test Name",
  year: 2024,
}, 0); // index 0

test('renders publication item', () => {
  renderWithProviders(<PublicationItem publication={mockPublication} language="en" />);
  // ...アサーション...
});
```

### 共通モックデータ

複数のテストファイルで共通して使用される可能性のあるモックデータセットは、`src/test-utils/mocks/` ディレクトリに集約します。

-   **目的**: 同じようなモックデータの重複定義を防ぎ、一元管理します。
-   **例**: `src/test-utils/mocks/publications.ts` では、`mockPublications` という共通の出版物データ配列をエクスポートしています。

### `__mocks__` ディレクトリによる自動モック

特定のモジュール（特に JSON ファイルなどのデータモジュール）を複数のテストで一貫してモックしたい場合、Jest の `__mocks__` ディレクトリ機能を利用します。

-   **目的**: `jest.mock()` を各テストファイルで呼び出す手間を省き、モックの実装を一箇所にまとめます。
-   **仕組み**: モックしたいモジュールと同じ階層に `__mocks__` ディレクトリを作成し、その中に元のモジュール名と同じ名前のファイル（拡張子は `.js` または `.ts`）を作成します。このファイルからモックしたい値をエクスポートします。
-   **例**: `src/data/publications.json` をモックするために、`src/data/__mocks__/publications.json.ts` を作成し、共通モックデータをエクスポートしています。

```typescript
// src/data/__mocks__/publications.json.ts
import { mockPublications } from '../../test-utils/mocks/publications';

export default mockPublications;
```

これにより、`src/__tests__/Publications.test.tsx` のようなテストファイルでは、明示的に `jest.mock('../data/publications.json', ...)` を呼び出す必要がなく、自動的にモックデータが使用されます。

## テスト環境のセットアップ

Jestテストを実行するための環境設定は、主に以下のファイルで行われます。

### `jest.config.js`

Jestの基本的な設定ファイルです。テストファイルの検索パターン、テスト環境（`jsdom`）、カバレッジレポートの設定などが定義されています。

### `jest.setup.ts`

各テストファイルが実行される前に一度だけ実行されるセットアップファイルです。ここでは、テスト全体で必要となるグローバルな設定やモックを行います。

-   **`@testing-library/jest-dom`**: `toBeInTheDocument()` のようなDOM要素に対する便利なカスタムマッチャーをJestに追加します。
-   **`whatwg-fetch`**: テスト環境で `fetch` API を利用可能にするためのポリフィルです。
-   **ブラウザAPIのモック**: `window.matchMedia` や `window.ResizeObserver` など、テスト環境（Node.js）には存在しないブラウザ固有のAPIをモックします。これにより、これらのAPIを使用するコンポーネント（特にUIライブラリ）がエラーなく動作するようになります。

```typescript
// jest.setup.ts の内容例
import '@testing-library/jest-dom';
import 'whatwg-fetch';

// matchMedia のモック
Object.defineProperty(window, 'matchMedia', { /* ...モック実装... */ });

// ResizeObserver のモック
class ResizeObserverMock { /* ...モック実装... */ }
window.ResizeObserver = ResizeObserverMock;
```

### `src/test-utils/test-utils.tsx`

テストの記述を簡略化するためのユーティリティを提供します。

-   **`AllProviders` コンポーネント**: アプリケーション全体で使用されるプロバイダー（`MantineProvider`, `LanguageProvider`, `BrowserRouter`/`MemoryRouter` など）をまとめたラッパーコンポーネントです。テスト対象コンポーネントをこれらのプロバイダーで囲むことで、実際のアプリケーションに近い環境でテストを実行できます。`localStorage` のモックもここで行われます。
-   **`renderWithProviders` 関数**: `@testing-library/react` の `render` 関数をラップしたカスタムレンダー関数です。この関数を使用すると、テスト対象のUI要素を自動的に `AllProviders` でラップしてくれるため、テストコードが簡潔になります。言語設定やルーティングの初期状態をオプションで指定することも可能です。

```tsx
// src/test-utils/test-utils.tsx の renderWithProviders の使用例
import { renderWithProviders, screen } from './test-utils'; // test-utils からインポート
import MyComponent from '../MyComponent';

test('renders MyComponent correctly', () => {
  // render の代わりに renderWithProviders を使用
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});

test('renders MyComponent with specific language', () => {
  // オプションで初期言語を指定
  renderWithProviders(<MyComponent />, { initialLanguage: 'en' });
  expect(screen.getByText('Hello')).toBeInTheDocument(); // 英語のテキストを確認
});
```

これらのセットアップファイルとユーティリティにより、テストの記述と実行が効率化されています。

## テストの実行

### すべてのテストを実行

```bash
npm test
```

### 特定のテストファイルを実行

```bash
# 例: ComponentName.test.tsx を実行
npm test -- ComponentName.test.tsx
# または、ファイル名の一部を指定
npm test -- ComponentName
```

### テストカバレッジを確認

```bash
npm test -- --coverage
```

## テスト戦略のベストプラクティス

1. **AAA（Arrange-Act-Assert）パターン**に従ってテストを記述する
   - Arrange: テストの前提条件を設定
   - Act: テスト対象の機能を実行
   - Assert: 結果を検証

2. **ユーザー視点でテストを書く**
   - 実装の詳細ではなく、ユーザーの操作と期待される結果に焦点を当てる
   - React Testing Libraryの `getByRole`, `getByText` などのクエリを使用する

3. **モックは必要最小限に留める**
   - 外部依存関係のみをモックし、テスト対象のコードはできるだけ実際のコードを使用する
   - モックが多すぎると、テストの信頼性が低下する

4. **テストは独立していて、他のテストに依存しないようにする**
   - 各テストは独立して実行できるようにする
   - テスト間で状態を共有しない

5. **エッジケースをテストする**
   - 空の配列、null、undefined などの特殊なケースをテストする
   - エラーケースもテストする

6. **テストは読みやすく、メンテナンスしやすくする**
   - テスト名は「何をテストしているか」が明確にわかるようにする
   - 複雑なセットアップは関数に抽出する

## テストの追加方法

新しい機能やコンポーネントを追加する場合は、以下の手順に従ってテストを追加してください：

1. `src/__tests__` ディレクトリに新しいテストファイルを作成する
2. 適切なテストケースを記述する
3. `npm test` を実行してテストが正常に動作することを確認する
4. 必要に応じてテストを修正・追加する

## 注意点

- テストは開発プロセスの一部として継続的に実行し、コードの品質を維持する
- テストカバレッジは重要だが、100%のカバレッジを目指すよりも、重要な機能と複雑なロジックをカバーすることを優先する
- テストが失敗した場合は、テストを修正する前にコードのバグを修正することを検討する