# モックの使用ガイドライン

このドキュメントでは、テストにおけるモックの適切な使用方法について詳細に解説します。モックは強力なテストツールですが、過剰に使用すると問題が発生する可能性があるため、適切な使用が重要です。

## 目次

1. [モックとは](#モックとは)
2. [モックを避けるべき理由](#モックを避けるべき理由)
3. [モックを使うべき状況](#モックを使うべき状況)
4. [モックの実装方法](#モックの実装方法)
5. [モックを最小限に保つための戦略](#モックを最小限に保つための戦略)
6. [本プロジェクトでのモック使用例](#本プロジェクトでのモック使用例)

## モックとは

モック（Mock）とは、テスト対象のコードが依存するコンポーネントやモジュールの代わりに使用される、制御可能な模擬オブジェクトです。モックを使用することで、テスト対象のコードを外部依存から分離し、特定の条件下での動作をテストすることができます。

モックには以下のような種類があります：

1. **スタブ（Stub）**: 特定の入力に対して固定の出力を返す単純なモック
2. **スパイ（Spy）**: 関数の呼び出しを記録するモック
3. **フェイク（Fake）**: 実際のコンポーネントの簡易版を実装したモック
4. **モック（Mock）**: 振る舞いを完全に制御できる高度なモック

## モックを避けるべき理由

モックは便利なツールですが、過剰に使用すると以下のような問題が発生する可能性があります：

### 1. 実際の動作との乖離

モックは実際のコンポーネントの動作を完全に再現するわけではないため、テストが通っても実際の環境では問題が発生する可能性があります。モックが多いテストは、実際のシステムの動作を正確に反映していない可能性があり、テストの信頼性が低下します。

### 2. 脆弱なテスト

モックは実装の詳細に依存することが多いため、内部実装が変更されるとテストが壊れやすくなります。例えば、モックしたメソッド名や引数が変更されると、テストが失敗します。

### 3. メンテナンスコストの増加

モックの実装を実際のコンポーネントの変更に合わせて更新する必要があり、メンテナンスコストが増加します。コードベースが大きくなるにつれて、このコストは無視できなくなります。

### 4. テストの複雑化

モックが多いテストは複雑になりがちで、理解しにくく、デバッグも難しくなります。テストの目的が不明確になり、テストコード自体にバグが混入する可能性も高まります。

## モックを使うべき状況

以下のような状況では、モックの使用が適切または必要となります：

### 1. 外部サービスとの通信

**例**: APIリクエスト、データベースアクセス、ファイルシステム操作

**理由**:
- 実際の外部サービスを使用するとテストが遅くなる
- 外部サービスの状態に依存すると、テストが不安定になる
- テスト環境で外部サービスが利用できない場合がある
- 特定のエラーケースや境界条件をテストするのが難しい

**実例**: 本プロジェクトの`markdownLoader.test.js`では、`fetch`をモックしています。これは、テスト環境ではネットワークリクエストを実行できない場合があり、また様々なレスポンスパターン（成功、失敗、ネットワークエラーなど）をテストする必要があるためです。

```javascript
// fetchのモック
global.fetch = jest.fn();

test("loads markdown file with default language (ja)", async () => {
  // 成功レスポンスをモック
  fetch.mockImplementationOnce(() => 
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve("# Japanese Content")
    })
  );

  const content = await loadMarkdown("/markdown/test.md");
  
  // 正しいパスでfetchが呼ばれたか確認
  expect(fetch).toHaveBeenCalledWith("/markdown/ja/test.md");
  expect(content).toBe("# Japanese Content");
});
```

### 2. ブラウザ環境に依存する機能

**例**: localStorage、sessionStorage、window、document、navigator

**理由**:
- テスト環境（Node.js）ではブラウザAPIが利用できない
- ブラウザの状態を制御してテストする必要がある
- 特定のブラウザ動作をシミュレートする必要がある

**実例**: 本プロジェクトの`LanguageContext.test.js`では、`localStorage`をモックしています。これは、テスト環境ではlocalStorageが利用できない場合があり、また言語設定の保存と読み込みの動作を正確にテストするためです。

```javascript
// ローカルストレージのモック
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

test("saves language to localStorage when changed", () => {
  render(
    <LanguageProvider>
      <TestComponent />
    </LanguageProvider>
  );
  
  // 言語を切り替え
  fireEvent.click(screen.getByTestId("toggle-button"));
  
  // ローカルストレージに保存されたか確認
  expect(localStorageMock.setItem).toHaveBeenCalledWith("language", "en");
});
```

### 3. テスト環境での制約

**例**: テスト環境で利用できないライブラリやAPIがある場合

**理由**:
- テスト環境の制約によりコンポーネントが正常に動作しない
- テスト環境でのセットアップが複雑または不可能

**実例**: 本プロジェクトの`App.test.jsx`では、`BrowserRouter`をモックしています。これは、テスト環境では`BrowserRouter`が正常に動作せず、代わりに`MemoryRouter`を使用する必要があるためです。

```javascript
// BrowserRouterをモック
jest.mock("react-router-dom", () => {
  const originalModule = jest.requireActual("react-router-dom");
  
  // BrowserRouterをモックして、子要素をMemoryRouterでラップして返す
  const mockBrowserRouter = ({ children }) => {
    return originalModule.MemoryRouter ? 
      <originalModule.MemoryRouter>{children}</originalModule.MemoryRouter> : 
      children;
  };
  
  return {
    ...originalModule,
    BrowserRouter: mockBrowserRouter
  };
});
```

### 4. 特定のエッジケースやエラー状態のテスト

**例**: エラーハンドリング、タイムアウト、ネットワークエラー

**理由**:
- 実際の環境では再現が難しい状況をシミュレートする必要がある
- エラー処理コードのカバレッジを向上させる

**実例**: 本プロジェクトの`markdownLoader.test.js`では、ファイルが見つからない場合やネットワークエラーが発生した場合のテストを行っています。

```javascript
test("returns error message when both language-specific and original files are not found", async () => {
  // 両方のファイルが見つからない場合のレスポンスをモック
  fetch.mockImplementation(() => 
    Promise.resolve({
      ok: false
    })
  );

  const content = await loadMarkdown("/markdown/test.md", "en");
  
  // エラーメッセージが返されるか確認
  expect(content).toBe("# Error loading content");
});

test("handles fetch errors", async () => {
  // fetchがエラーを投げる場合をモック
  fetch.mockImplementation(() => 
    Promise.reject(new Error("Network error"))
  );

  const content = await loadMarkdown("/markdown/test.md");
  
  // エラーメッセージが返されるか確認
  expect(content).toBe("# Error loading content");
});
```

## モックの実装方法

### 1. Jestのモック機能を使用する

Jestは、関数やモジュールをモックするための豊富な機能を提供しています。

#### 関数のモック

```javascript
// 関数をモック
const mockFunction = jest.fn();

// 戻り値を設定
mockFunction.mockReturnValue("モックの戻り値");

// 非同期関数の戻り値を設定
mockFunction.mockResolvedValue("非同期モックの戻り値");
mockFunction.mockRejectedValue(new Error("エラー"));

// 実装を設定
mockFunction.mockImplementation((arg) => {
  if (arg === "特定の引数") {
    return "特定の戻り値";
  }
  return "デフォルトの戻り値";
});

// 一度だけ使用する実装を設定
mockFunction.mockImplementationOnce(() => "一度だけの戻り値");
```

#### モジュールのモック

```javascript
// モジュール全体をモック
jest.mock("../utils/api", () => ({
  fetchData: jest.fn(),
  processData: jest.fn()
}));

// 一部のメソッドだけをモック
jest.mock("../utils/api", () => {
  const originalModule = jest.requireActual("../utils/api");
  return {
    ...originalModule,
    fetchData: jest.fn()
  };
});
```

### 2. グローバルオブジェクトのモック

ブラウザAPIなどのグローバルオブジェクトをモックする場合は、`Object.defineProperty`を使用します。

```javascript
// localStorageのモック
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});
```

### 3. テスト用のラッパーコンポーネントを作成する

依存関係を提供するラッパーコンポーネントを作成し、テスト対象のコンポーネントをラップします。

```jsx
// テスト用のラッパーコンポーネント
const TestWrapper = ({ children, initialLanguage = "ja" }) => {
  // localStorage のモックを作成
  const localStorageMock = (() => {
    let store = { language: initialLanguage };
    return {
      getItem: jest.fn(key => store[key]),
      setItem: jest.fn((key, value) => {
        store[key] = value;
      })
    };
  })();

  // テスト用に localStorage をモック
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });

  return (
    <LanguageProvider>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </LanguageProvider>
  );
};

// テスト
test("component renders correctly", () => {
  render(
    <TestWrapper initialLanguage="en">
      <MyComponent />
    </TestWrapper>
  );
  // テストコード
});
```

## モックを最小限に保つための戦略

### 1. 必要最小限のモックにする

モックは必要な部分だけにとどめ、可能な限り実際のコンポーネントを使用します。例えば、コンテキストプロバイダー全体をモックするのではなく、テスト用のラッパーコンポーネントを作成して実際のプロバイダーを使用する方が良いでしょう。

**良い例**:
```jsx
const TestWrapper = ({ children, initialLanguage = "ja" }) => {
  // localStorage のモックは必要
  const localStorageMock = (() => {
    let store = { language: initialLanguage };
    return {
      getItem: jest.fn(key => store[key]),
      setItem: jest.fn((key, value) => {
        store[key] = value;
      })
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });

  // 実際のLanguageProviderを使用
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
};
```

**悪い例**:
```jsx
// LanguageContextをモック
jest.mock("../contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: "ja",
    toggleLanguage: jest.fn()
  }),
  LanguageProvider: ({ children }) => <div>{children}</div>
}));
```

### 2. モックの実装を単純にする

モックの実装は、テストに必要な最小限の機能を提供するシンプルなものにします。複雑なモックは、メンテナンスが難しく、バグの原因になる可能性があります。

**良い例**:
```javascript
// シンプルなfetchモック
fetch.mockImplementation(() => 
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve("テストコンテンツ")
  })
);
```

**悪い例**:
```javascript
// 複雑すぎるfetchモック
fetch.mockImplementation((url) => {
  if (url.includes("ja")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "text/plain" }),
      text: () => {
        const content = "# 日本語コンテンツ";
        return Promise.resolve(content);
      }
    });
  } else if (url.includes("en")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "text/plain" }),
      text: () => {
        const content = "# English Content";
        return Promise.resolve(content);
      }
    });
  } else {
    return Promise.resolve({
      ok: false,
      status: 404,
      statusText: "Not Found"
    });
  }
});
```

### 3. モックの範囲を限定する

グローバルなモックではなく、特定のテストケースに限定したモックを使用します。テスト間でモックの状態が漏れないようにするため、`beforeEach`でモックをリセットすることも重要です。

**良い例**:
```javascript
beforeEach(() => {
  // モックをリセット
  fetch.mockClear();
});

test("test case 1", () => {
  // このテストケース限定のモック
  fetch.mockImplementationOnce(() => 
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve("テストケース1のコンテンツ")
    })
  );
  // ...
});

test("test case 2", () => {
  // このテストケース限定のモック
  fetch.mockImplementationOnce(() => 
    Promise.resolve({
      ok: false,
      status: 404
    })
  );
  // ...
});
```

### 4. 実装の詳細ではなく、動作に焦点を当てる

モックは、実装の詳細ではなく、コンポーネントの期待される動作に基づいて設計します。これにより、内部実装が変更されてもテストが壊れにくくなります。

**良い例**:
```jsx
// コンポーネントの動作（データを表示する）に焦点を当てる
test("displays data after loading", async () => {
  // データ取得関数をモック
  const mockData = { name: "テストデータ" };
  fetchData.mockResolvedValue(mockData);
  
  render(<DataComponent />);
  
  // データが表示されるのを待つ
  await waitFor(() => {
    expect(screen.getByText("テストデータ")).toBeInTheDocument();
  });
});
```

**悪い例**:
```jsx
// 内部実装の詳細（状態の変更）に焦点を当てる
test("sets isLoading to false after data is loaded", async () => {
  // データ取得関数をモック
  const mockData = { name: "テストデータ" };
  fetchData.mockResolvedValue(mockData);
  
  const { result } = renderHook(() => useDataLoader());
  
  // 内部状態を直接テスト
  expect(result.current.isLoading).toBe(true);
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
});
```

## 本プロジェクトでのモック使用例

### 1. localStorageのモック

本プロジェクトでは、言語設定をlocalStorageに保存するため、テスト時にlocalStorageをモックしています。

```javascript
// テスト用のラッパーコンポーネント
const TestWrapper = ({ children, initialLanguage = "ja" }) => {
  // localStorage のモックを作成
  const localStorageMock = (() => {
    let store = { language: initialLanguage };
    return {
      getItem: jest.fn(key => store[key]),
      setItem: jest.fn((key, value) => {
        store[key] = value;
      })
    };
  })();

  // テスト用に localStorage をモック
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });

  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
};
```

### 2. fetchのモック

Markdownファイルを読み込むためのfetch関数をモックしています。

```javascript
// fetchのモック
global.fetch = jest.fn();

test("loads markdown file with default language (ja)", async () => {
  // 成功レスポンスをモック
  fetch.mockImplementationOnce(() => 
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve("# Japanese Content")
    })
  );

  const content = await loadMarkdown("/markdown/test.md");
  
  // 正しいパスでfetchが呼ばれたか確認
  expect(fetch).toHaveBeenCalledWith("/markdown/ja/test.md");
  expect(content).toBe("# Japanese Content");
});
```

### 3. React Routerのモック

React Routerの機能をテストするために、`MemoryRouter`を使用しています。

```jsx
// テスト用のラッパーコンポーネント
const TestWrapper = ({ children }) => {
  return (
    <LanguageProvider>
      <MemoryRouter initialEntries={["/profile-cv"]}>
        {children}
      </MemoryRouter>
    </LanguageProvider>
  );
};

test("displays correct page name for profile-cv path", () => {
  render(
    <TestWrapper>
      <SubHeader />
    </TestWrapper>
  );
  const headingElement = screen.getByText(locales.ja.subheader.profileCV);
  expect(headingElement).toBeInTheDocument();
});
```

## まとめ

モックは強力なテストツールですが、過剰に使用すると問題が発生する可能性があります。以下の原則に従うことをお勧めします：

1. **デフォルトでは実際のコンポーネントを使用する**：可能な限り、モックではなく実際のコンポーネントを使用します。
2. **必要な場合のみモックを使用する**：外部サービス、ブラウザAPI、テスト環境の制約、特定のエッジケースのテストなど、モックが必要な状況では適切にモックを使用します。
3. **モックを最小限に保つ**：モックは必要な部分だけにとどめ、可能な限りシンプルにします。
4. **テストの目的を明確にする**：テストの目的に基づいて、適切なテスト戦略とモック戦略を選択します。

適切なバランスを見つけることで、信頼性が高く、メンテナンスしやすいテストを作成することができます。

## 関連ドキュメント

- [テストコード仕様書](./test-specifications.md)
- [テストパターン集](./test-patterns.md)
- [テスト駆動開発（TDD）基本ガイド](../TDD/basic-guide.md)
- [モックの適切な使用方法](../TDD/when-to-use-mocks.md)