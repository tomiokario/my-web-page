import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../App";

// モックの作成
jest.mock("../contexts/LanguageContext", () => ({
  LanguageProvider: ({ children }) => <div data-testid="language-provider">{children}</div>,
  useLanguage: () => ({ language: "ja", toggleLanguage: jest.fn() })
}));

// ラッパーアプローチを使用したテスト
describe("App component", () => {
  // 基本的なレンダリングテスト
  test("renders without crashing", () => {
    render(<App />);
  });

  // 主要コンポーネントが存在するかテスト
  test("renders main components", () => {
    render(<App />);
    
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

  // LanguageProviderが使用されているかテスト
  test("uses LanguageProvider", () => {
    render(<App />);
    const providerElement = screen.getByTestId("language-provider");
    expect(providerElement).toBeInTheDocument();
  });
});