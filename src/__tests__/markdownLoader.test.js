import { loadMarkdown } from "../utils/markdownLoader";

// fetchのモック
global.fetch = jest.fn();

describe("markdownLoader", () => {
  beforeEach(() => {
    // モックをリセット
    fetch.mockClear();
  });

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

  test("loads markdown file with specified language", async () => {
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
});