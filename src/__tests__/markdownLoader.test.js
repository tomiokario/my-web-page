/**
 * markdownLoaderのテスト
 *
 * このテストファイルでは、Markdownファイルを読み込むためのユーティリティ関数
 * loadMarkdownの機能をテストします。この関数は、言語設定に応じたパスで
 * Markdownファイルを読み込み、ファイルが見つからない場合はフォールバックする
 * 機能を持っています。
 *
 * テスト内容：
 * 1. デフォルト言語（日本語）でのファイル読み込み
 * 2. 指定した言語（英語）でのファイル読み込み
 * 3. 言語固有のファイルが見つからない場合のフォールバック
 * 4. すべてのファイルが見つからない場合のエラーハンドリング
 * 5. ネットワークエラーなどのfetchエラーのハンドリング
 */

import { loadMarkdown } from "../utils/markdownLoader";

// fetchのモック
global.fetch = jest.fn();

describe("markdownLoader", () => {
  beforeEach(() => {
    // モックをリセット
    fetch.mockClear();
  });

  test("loads markdown file with default language (ja)", async () => {
    // テスト内容: デフォルト言語（日本語）でMarkdownファイルを読み込むことを確認
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

  test("loads markdown file with specified language", async () => {
    // テスト内容: 指定した言語（英語）でMarkdownファイルを読み込むことを確認
    // 成功レスポンスをモック
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve("# English Content")
      })
    );

    const content = await loadMarkdown("/markdown/test.md", "en");
    
    // 正しいパスでfetchが呼ばれたか確認
    expect(fetch).toHaveBeenCalledWith("/markdown/en/test.md");
    expect(content).toBe("# English Content");
  });

  test("falls back to original path if language-specific file is not found", async () => {
    // テスト内容: 言語固有のファイルが見つからない場合、元のパスにフォールバックすることを確認
    // 言語固有のファイルが見つからない場合のレスポンスをモック
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false
      })
    );
    
    // 元のパスでの成功レスポンスをモック
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve("# Original Content")
      })
    );

    const content = await loadMarkdown("/markdown/test.md", "en");
    
    // 最初に言語固有のパスでfetchが呼ばれたか確認
    expect(fetch).toHaveBeenNthCalledWith(1, "/markdown/en/test.md");
    
    // 次に元のパスでfetchが呼ばれたか確認
    expect(fetch).toHaveBeenNthCalledWith(2, "/markdown/test.md");
    
    expect(content).toBe("# Original Content");
  });

  test("returns error message when both language-specific and original files are not found", async () => {
    // テスト内容: 言語固有のファイルも元のパスのファイルも見つからない場合、エラーメッセージを返すことを確認
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
    // テスト内容: fetchがエラーを投げる場合（ネットワークエラーなど）、エラーメッセージを返すことを確認
    // fetchがエラーを投げる場合をモック
    fetch.mockImplementation(() =>
      Promise.reject(new Error("Network error"))
    );

    const content = await loadMarkdown("/markdown/test.md");
    
    // エラーメッセージが返されるか確認
    expect(content).toBe("# Error loading content");
  });

  // サブディレクトリを含むパスのテスト
  test("loads markdown file from subdirectory with language", async () => {
    // テスト内容: サブディレクトリを含むパスで言語固有のMarkdownファイルを読み込むことを確認
    // 成功レスポンスをモック
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve("# Subdirectory Content")
      })
    );

    const content = await loadMarkdown("/markdown/works/test.md", "ja");
    
    // 正しいパスでfetchが呼ばれたか確認
    expect(fetch).toHaveBeenCalledWith("/markdown/ja/works/test.md");
    expect(content).toBe("# Subdirectory Content");
  });

  // 複数階層のサブディレクトリを含むパスのテスト
  test("loads markdown file from nested subdirectories with language", async () => {
    // テスト内容: 複数階層のサブディレクトリを含むパスで言語固有のMarkdownファイルを読み込むことを確認
    // 成功レスポンスをモック
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve("# Nested Subdirectory Content")
      })
    );

    const content = await loadMarkdown("/markdown/works/2025/test.md", "en");
    
    // 正しいパスでfetchが呼ばれたか確認
    expect(fetch).toHaveBeenCalledWith("/markdown/en/works/2025/test.md");
    expect(content).toBe("# Nested Subdirectory Content");
  });
});