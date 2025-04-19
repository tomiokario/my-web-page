/**
 * Appコンポーネントのテスト
 *
 * このテストファイルでは、アプリケーションのルートコンポーネントである
 * Appコンポーネントの機能をテストします。Appコンポーネントは、
 * LanguageProvider、Router、Header、SubHeader、メインコンテンツ、
 * Footerなどの主要コンポーネントを含んでいます。
 *
 * テスト内容：
 * 1. コンポーネントが正常にレンダリングされるか
 * 2. 主要コンポーネント（ヘッダー、メインコンテンツ、フッター）が存在するか
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "../contexts/LanguageContext";
import App from "../App";

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

// テスト用のlocalStorageモック
beforeEach(() => {
  // localStorage のモックを作成
  const localStorageMock = (() => {
    let store = { language: "ja" };
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
});

// テスト用のラッパーコンポーネント
const TestWrapper = ({ children }) => {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
};

// ラッパーアプローチを使用したテスト
describe("App component", () => {
  // 基本的なレンダリングテスト
  test("renders without crashing", () => {
    // テスト内容: Appコンポーネントが正常にレンダリングされることを確認
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );
  });

  // 主要コンポーネントが存在するかテスト
  test("renders main components", () => {
    // テスト内容: ヘッダー、メインコンテンツ、フッターの主要コンポーネントが存在することを確認
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );
    
    // ヘッダーが存在するか確認
    const headerElement = screen.getByRole("banner");
    expect(headerElement).toBeInTheDocument();
    
    // メインコンテンツが存在するか確認
    const mainElement = screen.getByRole("main");
    expect(mainElement).toBeInTheDocument();
    
    // フッターが存在するか確認
    const footerElement = screen.getByRole("contentinfo");
    expect(footerElement).toBeInTheDocument();
  });
});