/**
 * LanguageContextのテスト
 *
 * このテストファイルでは、言語切り替え機能を提供するLanguageContextの
 * 機能をテストします。LanguageContextは、現在の言語設定の管理、
 * 言語切り替え機能、ローカルストレージへの設定保存などの機能を持っています。
 *
 * テスト内容：
 * 1. デフォルト言語が日本語（ja）であることの確認
 * 2. ローカルストレージから言語設定を読み込む機能
 * 3. 言語切り替え機能
 * 4. 言語設定のローカルストレージへの保存
 */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LanguageProvider, useLanguage } from "../contexts/LanguageContext";

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

// テスト用のコンポーネント
const TestComponent = () => {
  const { language, toggleLanguage } = useLanguage();
  return (
    <div>
      <div data-testid="language">{language}</div>
      <button onClick={toggleLanguage} data-testid="toggle-button">
        Toggle Language
      </button>
    </div>
  );
};

describe("LanguageContext", () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test("provides default language as ja", () => {
    // テスト内容: LanguageProviderのデフォルト言語が日本語（ja）であることを確認
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    
    expect(screen.getByTestId("language").textContent).toBe("ja");
  });

  test("uses saved language from localStorage if available", () => {
    // テスト内容: ローカルストレージに保存された言語設定（英語）が読み込まれることを確認
    localStorageMock.getItem.mockReturnValueOnce("en");
    
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    
    expect(screen.getByTestId("language").textContent).toBe("en");
  });

  test("toggles language when toggle function is called", () => {
    // テスト内容: toggleLanguage関数を呼び出すと言語が切り替わることを確認
    // 日本語→英語→日本語の順に切り替わることをテスト
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    
    // 初期値は日本語
    expect(screen.getByTestId("language").textContent).toBe("ja");
    
    // 言語を切り替え
    fireEvent.click(screen.getByTestId("toggle-button"));
    
    // 英語に切り替わる
    expect(screen.getByTestId("language").textContent).toBe("en");
    
    // もう一度切り替え
    fireEvent.click(screen.getByTestId("toggle-button"));
    
    // 日本語に戻る
    expect(screen.getByTestId("language").textContent).toBe("ja");
  });

  test("saves language to localStorage when changed", () => {
    // テスト内容: 言語を切り替えると、新しい言語設定がローカルストレージに保存されることを確認
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
});