# モックの適切な使用方法

このドキュメントでは、テストにおいてモックをできるだけ避けつつも、どのような状況ではモックを使用すべきかについて解説します。

## モックとは

モック（Mock）とは、テスト対象のコードが依存するコンポーネントやモジュールの代わりに使用される、制御可能な模擬オブジェクトです。モックを使用することで、テスト対象のコードを外部依存から分離し、特定の条件下での動作をテストすることができます。

## モックを避けるべき理由

モックは便利なツールですが、過剰に使用すると以下のような問題が発生する可能性があります：

1. **実際の動作との乖離**：モックは実際のコンポーネントの動作を完全に再現するわけではないため、テストが通っても実際の環境では問題が発生する可能性があります。

2. **脆弱なテスト**：モックは実装の詳細に依存することが多いため、内部実装が変更されるとテストが壊れやすくなります。

3. **メンテナンスコストの増加**：モックの実装を実際のコンポーネントの変更に合わせて更新する必要があり、メンテナンスコストが増加します。

4. **テストの信頼性低下**：モックが多いテストは、実際のシステムの動作を正確に反映していない可能性があり、テストの信頼性が低下します。

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

## モックの適切な使い方

モックを使用する場合は、以下のベストプラクティスに従うことをお勧めします：

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

### 2. モックの実装を単純にする

モックの実装は、テストに必要な最小限の機能を提供するシンプルなものにします。複雑なモックは、メンテナンスが難しく、バグの原因になる可能性があります。

### 3. モックの範囲を限定する

グローバルなモックではなく、特定のテストケースに限定したモックを使用します。テスト間でモックの状態が漏れないようにするため、`beforeEach`でモックをリセットすることも重要です。

```javascript
beforeEach(() => {
  // モックをリセット
  fetch.mockClear();
});
```

### 4. 実装の詳細ではなく、動作に焦点を当てる

モックは、実装の詳細ではなく、コンポーネントの期待される動作に基づいて設計します。これにより、内部実装が変更されてもテストが壊れにくくなります。

## 実際のコンポーネントを使用するアプローチ

可能な限り、モックではなく実際のコンポーネントを使用することをお勧めします。以下は、モックを避けるためのアプローチです：

### 1. テスト用のラッパーコンポーネントを作成する

依存関係を提供するラッパーコンポーネントを作成し、テスト対象のコンポーネントをラップします。

```jsx
const TestWrapper = ({ children }) => {
  return (
    <LanguageProvider>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </LanguageProvider>
  );
};

test("component renders correctly", () => {
  render(
    <TestWrapper>
      <MyComponent />
    </TestWrapper>
  );
  // テストコード
});
```

### 2. カスタムレンダラーを作成する

テスト用のカスタムレンダラーを作成し、必要な依存関係を提供します。

```jsx
const renderWithProviders = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <LanguageProvider>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </LanguageProvider>
  );
  
  return render(ui, { wrapper: Wrapper, ...options });
};

test("component renders correctly", () => {
  renderWithProviders(<MyComponent />);
  // テストコード
});
```

### 3. 依存関係を注入する

コンポーネントが依存関係を受け取れるようにし、テスト時に適切な値を注入します。

```jsx
// コンポーネント
const DataDisplay = ({ fetchData = defaultFetchData }) => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      const result = await fetchData();
      setData(result);
    };
    loadData();
  }, [fetchData]);
  
  return <div>{data ? data.name : "Loading..."}</div>;
};

// テスト
test("displays data correctly", async () => {
  const mockFetchData = jest.fn().mockResolvedValue({ name: "Test Data" });
  
  render(<DataDisplay fetchData={mockFetchData} />);
  
  await waitFor(() => {
    expect(screen.getByText("Test Data")).toBeInTheDocument();
  });
});
```

## まとめ

モックは強力なテストツールですが、過剰に使用すると問題が発生する可能性があります。以下の原則に従うことをお勧めします：

1. **デフォルトでは実際のコンポーネントを使用する**：可能な限り、モックではなく実際のコンポーネントを使用します。

2. **必要な場合のみモックを使用する**：外部サービス、ブラウザAPI、テスト環境の制約、特定のエッジケースのテストなど、モックが必要な状況では適切にモックを使用します。

3. **モックを最小限に保つ**：モックは必要な部分だけにとどめ、可能な限りシンプルにします。

4. **テストの目的を明確にする**：テストの目的に基づいて、適切なテスト戦略とモック戦略を選択します。

適切なバランスを見つけることで、信頼性が高く、メンテナンスしやすいテストを作成することができます。