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

- コンポーネントテスト: `ComponentName.test.jsx`
- フックテスト: `useHookName.test.js`
- ユーティリティテスト: `utilityName.test.js`

テストファイルは `src/__tests__` ディレクトリに配置されています：

```
src/__tests__/
├── ActiveFilters.test.jsx
├── App.test.jsx
├── csvToJson.test.js
├── FilterDropdown.test.jsx
├── Footer.test.jsx
├── Header.test.jsx
├── LanguageContext.test.js
├── markdownLoader.test.js
├── PublicationGroup.test.jsx
├── PublicationItem.test.jsx
├── Publications.test.jsx
├── PublicationsView.test.jsx
├── SubHeader.test.jsx
├── useFilters.test.js
└── usePublications.test.js
```

## テストの種類

プロジェクトでは以下の種類のテストを実施しています：

1. **単体テスト**: 個々のコンポーネント、フック、ユーティリティ関数の機能をテスト
2. **統合テスト**: 複数のコンポーネントやフックの連携をテスト

### 実際のコードベースにおける単体テストと統合テスト

#### 単体テスト

以下のテストファイルは、単一のコンポーネント、フック、またはユーティリティ関数の機能をテストする単体テストです：

- **useFilters.test.js**: useFiltersフックの機能（フィルターオプションの抽出、フィルタリング、ドロップダウンの開閉、フィルターのリセット）を個別にテストします。

- **usePublications.test.js**: usePublicationsフックの機能（年の抽出、出版物データの整形、ソート、グループ化）を個別にテストします。

- **PublicationsView.test.jsx**: 子コンポーネント（PublicationGroup）をモックして、PublicationsViewコンポーネントの機能をテストします。

- **ActiveFilters.test.jsx**: ActiveFiltersコンポーネントの機能（フィルタータグの表示、リセットボタンのクリックなど）をテストします。

- **FilterDropdown.test.jsx**: FilterDropdownコンポーネントの機能（ドロップダウンの表示、チェックボックスの選択など）をテストします。

- **PublicationItem.test.jsx**: PublicationItemコンポーネントの機能（出版物情報の表示、タグの表示など）をテストします。

- **csvToJson.test.js**: csvToJson関数の機能（CSVデータのJSON変換）をテストします。

- **markdownLoader.test.js**: markdownLoader関数の機能（Markdownファイルの読み込み）をテストします。

#### 統合テスト

以下のテストファイルは、複数のコンポーネントやフックが連携して動作することをテストする統合テストです：

- **Publications.test.jsx**: Publicationsコンポーネントと言語コンテキスト、フィルタリング機能などの連携をテストします。実際のLanguageProviderを使用し、ユーザーインタラクションの一連の流れをテストします。

- **LanguageContext.test.js**: LanguageContextとそれを使用するコンポーネントの連携をテストします。実際のuseLanguageフックを使用して、言語の切り替え機能と副作用をテストします。

- **App.test.jsx**: アプリケーションのルートコンポーネントであるAppコンポーネントと、それに含まれる主要コンポーネント（ヘッダー、メインコンテンツ、フッターなど）の連携をテストします。

## テストの書き方

### コンポーネントテスト

コンポーネントテストでは、React Testing Libraryを使用して、ユーザーの視点からコンポーネントの動作をテストします。

#### 基本的なコンポーネントテスト

```jsx
// src/__tests__/ComponentName.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import ComponentName from '../components/ComponentName';

describe('ComponentName', () => {
  test('renders correctly', () => {
    render(<ComponentName />);
    
    // テキストが正しく表示されていることを確認
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
    
    // 特定の要素が存在することを確認
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

#### ユーザーインタラクションのテスト

```jsx
// src/__tests__/ComponentName.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ComponentName from '../components/ComponentName';

describe('ComponentName', () => {
  test('handles user interaction correctly', () => {
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick} />);
    
    // ボタンをクリック
    fireEvent.click(screen.getByRole('button'));
    
    // クリックハンドラーが呼ばれたことを確認
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // 状態の変化を確認
    expect(screen.getByText('New State')).toBeInTheDocument();
  });
});
```

### フックテスト

フックテストでは、`renderHook` 関数を使用して、フックの動作をテストします。

```jsx
// src/__tests__/useHookName.test.js
import { renderHook, act } from '@testing-library/react';
import useHookName from '../hooks/useHookName';

describe('useHookName', () => {
  test('returns the correct initial state', () => {
    const { result } = renderHook(() => useHookName());
    
    expect(result.current.value).toBe('initial value');
  });
  
  test('updates state correctly', () => {
    const { result } = renderHook(() => useHookName());
    
    act(() => {
      result.current.setValue('new value');
    });
    
    expect(result.current.value).toBe('new value');
  });
});
```

### ユーティリティ関数テスト

ユーティリティ関数のテストでは、関数の入力と出力を検証します。

```jsx
// src/__tests__/utilityName.test.js
import { utilityFunction } from '../utils/utilityName';

describe('utilityFunction', () => {
  test('returns the correct result for valid input', () => {
    const input = 'test input';
    const expectedOutput = 'expected output';
    
    expect(utilityFunction(input)).toBe(expectedOutput);
  });
  
  test('handles edge cases correctly', () => {
    expect(utilityFunction(null)).toBeNull();
    expect(utilityFunction('')).toBe('');
    expect(utilityFunction(undefined)).toBeUndefined();
  });
  
  test('throws an error for invalid input', () => {
    expect(() => utilityFunction(123)).toThrow('Invalid input');
  });
});
```

## モックの使用

テストでは、外部依存関係をモックして、テストを分離し、予測可能にします。

### モジュールのモック

```jsx
// 外部モジュールのモック
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// データファイルのモック
jest.mock('../data/publications.json', () => [
  { id: 1, name: 'Test Publication' }
]);
```

### コンポーネントのモック

```jsx
// 子コンポーネントのモック
jest.mock('../components/ChildComponent', () => {
  return function MockChildComponent(props) {
    return <div data-testid="mock-child">{props.text}</div>;
  };
});
```

### 関数のモック

```jsx
// 関数のモック
const mockFunction = jest.fn();
mockFunction.mockReturnValue('mocked result');
```

## テスト例

### usePublications.test.js

```jsx
// src/__tests__/usePublications.test.js
import { renderHook } from '@testing-library/react';
import usePublications from '../hooks/usePublications';

// モックデータ
jest.mock('../data/publications.json', () => [
  {
    name: 'Test Publication 1',
    japanese: 'テスト出版物 1',
    date: '2022年10月1日',
    type: 'Journal paper：原著論文',
    authorship: ['First author'],
    sortableDate: '20221001'
  },
  {
    name: 'Test Publication 2',
    japanese: 'テスト出版物 2',
    date: '2021年5月15日',
    type: 'Research paper (international conference)：国際会議',
    authorship: ['Corresponding author'],
    sortableDate: '20210515'
  }
]);

describe('usePublications', () => {
  describe('extractYear', () => {
    it('日付文字列から年を正しく抽出する', () => {
      const { result } = renderHook(() => usePublications({ sortOrder: 'type', filteredPublications: [] }));
      
      expect(result.current.extractYear('2022年10月1日')).toBe(2022);
      expect(result.current.extractYear('2021年5月15日 → 2021年5月20日')).toBe(2021);
      expect(result.current.extractYear(null)).toBeNull();
    });
  });

  describe('sortedPublications', () => {
    it('種類順で正しくソートする', () => {
      const { result } = renderHook(() => usePublications({ sortOrder: 'type', filteredPublications: [] }));
      
      expect(result.current.sortedPublications[0].type).toBe('Journal paper：原著論文');
      expect(result.current.sortedPublications[1].type).toBe('Research paper (international conference)：国際会議');
    });

    it('時系列順で正しくソートする', () => {
      const { result } = renderHook(() => usePublications({ sortOrder: 'chronological', filteredPublications: [] }));
      
      // sortableDateの降順（新しい順）でソートされる
      expect(result.current.sortedPublications[0].sortableDate).toBe('20221001');
      expect(result.current.sortedPublications[1].sortableDate).toBe('20210515');
    });
  });
});
```

### PublicationsView.test.jsx

```jsx
// src/__tests__/PublicationsView.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PublicationsView from '../components/publications/PublicationsView';

// モックデータ
const mockProps = {
  sortOrder: 'type',
  onSortOrderChange: jest.fn(),
  selectedFilters: {
    year: ['2022'],
    authorship: [],
    type: [],
    review: [],
    presentationType: []
  },
  openDropdown: null,
  filterOptions: {
    year: ['2022', '2021', '2020'],
    authorship: ['First author', 'Co-author'],
    type: ['Journal paper：原著論文', 'Research paper (international conference)：国際会議'],
    review: ['Peer-reviewed', 'Non-peer-reviewed'],
    presentationType: ['Oral', 'Poster']
  },
  groupedPublications: [
    {
      name: 'Journal paper：原著論文',
      items: [
        {
          id: 1,
          name: 'Test Publication 1',
          japanese: 'テスト出版物1',
          year: 2022,
          type: 'Journal paper：原著論文'
        }
      ]
    }
  ],
  filterRefs: { current: {} },
  toggleDropdown: jest.fn(),
  toggleFilter: jest.fn(),
  resetFilters: jest.fn(),
  language: 'en'
};

// 子コンポーネントをモック
jest.mock('../components/publications/PublicationGroup', () => {
  return function MockPublicationGroup({ name, items, language }) {
    return (
      <div data-testid="publication-group">
        <div data-testid="group-name">{name}</div>
        <div data-testid="items-count">{items.length}</div>
        <div data-testid="language">{language}</div>
      </div>
    );
  };
});

describe('PublicationsView', () => {
  test('renders correctly with provided props', () => {
    render(<PublicationsView {...mockProps} />);
    
    // 並び順選択が正しくレンダリングされていることを確認
    expect(screen.getByTestId('sort-order-select')).toBeInTheDocument();
    expect(screen.getByTestId('sort-order-select')).toHaveValue('type');
    
    // 出版物グループが正しくレンダリングされていることを確認
    expect(screen.getByTestId('publication-group')).toBeInTheDocument();
    expect(screen.getByTestId('group-name')).toHaveTextContent('Journal paper：原著論文');
    expect(screen.getByTestId('items-count')).toHaveTextContent('1');
    expect(screen.getByTestId('language')).toHaveTextContent('en');
  });
  
  test('calls onSortOrderChange when sort order is changed', () => {
    render(<PublicationsView {...mockProps} />);
    
    // 並び順を変更
    fireEvent.change(screen.getByTestId('sort-order-select'), { target: { value: 'chronological' } });
    
    // onSortOrderChangeが呼ばれたことを確認
    expect(mockProps.onSortOrderChange).toHaveBeenCalledWith('chronological');
  });
});
```

## テストの実行

### すべてのテストを実行

```bash
npm test
```

### 特定のテストファイルを実行

```bash
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