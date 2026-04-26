/**
 * Footerコンポーネントのテスト
 *
 * このテストファイルでは、Footerコンポーネントの機能をテストします。
 * Footerコンポーネントは、言語設定に応じたコピーライト情報を表示する
 * シンプルなコンポーネントです。
 *
 * テスト内容：
 * 1. コンポーネントが正常にレンダリングされるか
 * 2. 日本語モードでのコピーライト表示
 * 3. 英語モードでのコピーライト表示
 * 4. footer要素の存在確認
 */

import React from "react";
import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "../components/Footer";
import { LanguageProvider } from "../contexts/LanguageContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import locales from "../locales";

const footerCss = fs.readFileSync(
  path.join(__dirname, "../components/Footer.css"),
  "utf8"
);

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
      <ThemeProvider>{children}</ThemeProvider>
    </LanguageProvider>
  );
};

// Footerコンポーネントのテスト
describe("Footer component", () => {
  // 基本的なレンダリングテスト
  test("renders without crashing", () => {
    // テスト内容: Footerコンポーネントが正常にレンダリングされることを確認
    render(
      <TestWrapper>
        <Footer />
      </TestWrapper>
    );
  });

  // 日本語のコンテンツが正しく表示されるかテスト
  test("displays Japanese copyright text when language is ja", () => {
    // テスト内容: 日本語モードで日本語のコピーライト情報「© 2026 冨岡 莉生」が表示されることを確認
    render(
      <TestWrapper initialLanguage="ja">
        <Footer />
      </TestWrapper>
    );
    const copyrightElement = screen.getByText(locales.ja.footer.copyright);
    expect(copyrightElement).toBeInTheDocument();
    expect(copyrightElement).toHaveClass("footer__copyright");
  });

  // 英語のコンテンツが正しく表示されるかテスト
  test("displays English copyright text when language is en", () => {
    // テスト内容: 英語モードで英語のコピーライト情報「© 2026 TOMIOKA Rio」が表示されることを確認
    render(
      <TestWrapper initialLanguage="en">
        <Footer />
      </TestWrapper>
    );
    const copyrightElement = screen.getByText(locales.en.footer.copyright);
    expect(copyrightElement).toBeInTheDocument();
    expect(copyrightElement).toHaveClass("footer__copyright");
  });

  // フッター要素が存在するかテスト
  test("contains footer element", () => {
    // テスト内容: フッター要素（role="contentinfo"）が存在することを確認
    render(
      <TestWrapper>
        <Footer />
      </TestWrapper>
    );
    const footerElement = screen.getByRole("contentinfo");
    expect(footerElement).toBeInTheDocument();
  });

  test("displays theme switch control in Japanese", () => {
    render(
      <TestWrapper initialLanguage="ja">
        <Footer />
      </TestWrapper>
    );

    expect(screen.getByRole("button", { name: locales.ja.themeSwitch.switchToGray })).toHaveTextContent("Gray");
  });

  test("displays theme switch control in English", () => {
    render(
      <TestWrapper initialLanguage="en">
        <Footer />
      </TestWrapper>
    );

    expect(screen.getByRole("button", { name: locales.en.themeSwitch.switchToGray })).toHaveTextContent("Gray");
  });

  test("keeps mobile footer content centered and wrapped", () => {
    expect(footerCss).toContain(".footer__copyright");
    expect(footerCss).toContain("overflow-wrap: anywhere");
    expect(footerCss).toContain("@media (max-width: 480px)");
    expect(footerCss).toContain("align-items: center");
    expect(footerCss).toContain("text-align: center");
  });
});
