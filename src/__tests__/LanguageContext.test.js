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
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    
    expect(screen.getByTestId("language").textContent).toBe("ja");
  });

  test("uses saved language from localStorage if available", () => {
    localStorageMock.getItem.mockReturnValueOnce("en");
    
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    
    expect(screen.getByTestId("language").textContent).toBe("en");
  });

  test("toggles language when toggle function is called", () => {
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