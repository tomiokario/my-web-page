/**
 * Headerコンポーネントのテスト
 *
 * このテストファイルでは、Headerコンポーネントの機能をテストします。
 * Headerコンポーネントは、ナビゲーションリンク、言語切り替えボタンなどの機能を持っています。
 * Mantineを使用したレスポンシブなデザインで、すべての画面サイズでナビゲーションリンクを表示します。
 *
 * テスト内容：
 * 1. デスクトップ表示での動作（ナビゲーションリンク、言語切り替え）
 * 2. モバイル表示での動作（レスポンシブなナビゲーションリンク）
 * 3. 日本語/英語モードでの表示切り替え
 */

import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom"; // Jest-DOMのマッチャーを明示的にインポート
import { BrowserRouter } from "react-router-dom";
import Header from "../components/Header";
import { LanguageProvider } from "../contexts/LanguageContext";
import locales from "../locales";
// カスタムrender関数をインポート
import { render } from "../test-utils/render";

// テスト用のラッパーコンポーネントの型定義
interface TestWrapperProps {
  children: React.ReactNode;
  initialLanguage?: string;
}

// テスト用のラッパーコンポーネント（MantineProviderは削除し、カスタムrenderに依存）
const TestWrapper: React.FC<TestWrapperProps> = ({ children, initialLanguage = "ja" }) => {
  // localStorage のモックを作成
  const localStorageMock = (() => {
    let store: Record<string, string> = { language: initialLanguage };
    return {
      getItem: jest.fn((key: string) => store[key]),
      setItem: jest.fn((key: string, value: string) => {
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
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </LanguageProvider>
  );
};

describe("Header component", () => {
  // 基本的なレンダリングテスト
  test("renders without crashing", () => {
    // テスト内容: Headerコンポーネントが正常にレンダリングされることを確認
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );
  });

  // ナビゲーションリンクのテスト
  test("displays navigation links", () => {
    // テスト内容: 日本語のナビゲーションリンクが正しく表示されることを確認
    render(
      <TestWrapper initialLanguage="ja">
        <Header />
      </TestWrapper>
    );
    
    // 日本語のメニュー項目が表示されているか確認
    expect(screen.getByText(locales.ja.header.home)).toBeInTheDocument();
    expect(screen.getByText(locales.ja.header.profileCV)).toBeInTheDocument();
    expect(screen.getByText(locales.ja.header.publications)).toBeInTheDocument();
    expect(screen.getByText(locales.ja.header.works)).toBeInTheDocument();
  });

  // 言語切り替えボタンのテスト
  test("displays language switch button", () => {
    // テスト内容: 言語切り替えボタンが正しく表示され、言語コード「EN」が表示されることを確認
    render(
      <TestWrapper initialLanguage="ja">
        <Header />
      </TestWrapper>
    );
    
    // 言語切り替えボタンが表示されているか確認
    const languageButton = screen.getByRole("button", { name: new RegExp(locales.ja.languageSwitch.switchTo) });
    expect(languageButton).toBeInTheDocument();
    
    // 言語コードが表示されているか確認
    expect(languageButton).toHaveTextContent("EN");
  });

  // 言語切り替え機能のテスト
  test("toggles language when language button is clicked", () => {
    // テスト内容: 言語切り替えボタンをクリックすると、表示言語が日本語から英語に切り替わることを確認
    render(
      <TestWrapper initialLanguage="ja">
        <Header />
      </TestWrapper>
    );
    
    // 言語切り替えボタンをクリック
    const languageButton = screen.getByRole("button", { name: new RegExp(locales.ja.languageSwitch.switchTo) });
    fireEvent.click(languageButton);
    
    // 言語が英語に切り替わったか確認
    expect(screen.getByText(locales.en.header.home)).toBeInTheDocument();
    expect(screen.getByText(locales.en.header.profileCV)).toBeInTheDocument();
    expect(screen.getByText(locales.en.header.publications)).toBeInTheDocument();
    expect(screen.getByText(locales.en.header.works)).toBeInTheDocument();
  });

  // モバイル表示でのテスト
  describe("mobile view", () => {
    beforeEach(() => {
      // モバイル表示のモックを設定
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: true,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }),
      });
    });

    afterEach(() => {
      // テスト後にデスクトップ表示に戻す
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }),
      });
    });

    test("displays navigation links in mobile view", () => {
      // テスト内容: モバイル表示でもナビゲーションリンクが表示されることを確認
      render(
        <TestWrapper initialLanguage="ja">
          <Header />
        </TestWrapper>
      );
      
      // 日本語のメニュー項目が表示されているか確認
      expect(screen.getByText(locales.ja.header.home)).toBeInTheDocument();
      // モバイル表示ではラベルが短縮されるため、直接文字列で比較
      expect(screen.getByText("プロフィール")).toBeInTheDocument();
      expect(screen.getByText(locales.ja.header.publications)).toBeInTheDocument();
      expect(screen.getByText(locales.ja.header.works)).toBeInTheDocument();
    });

    test("displays language switch button in mobile view", () => {
      // テスト内容: モバイル表示でも言語切り替えボタンが表示されることを確認
      render(
        <TestWrapper initialLanguage="ja">
          <Header />
        </TestWrapper>
      );
      
      // 言語切り替えボタンが表示されているか確認
      const languageButton = screen.getByRole("button", { name: new RegExp(locales.ja.languageSwitch.switchTo) });
      expect(languageButton).toBeInTheDocument();
      
      // 言語コードが表示されているか確認
      expect(languageButton).toHaveTextContent("EN");
    });

    test("displays correct language button text on small screens (<= 480px)", () => {
      // 480px以下の画面幅をシミュレート
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(max-width: 768px)' || query === '(max-width: 480px)', // 768pxと480px以下でtrue
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }),
      });

      // 日本語モードで初期描画
      render(
        <TestWrapper initialLanguage="ja">
          <Header />
        </TestWrapper>
      );

      // 初期状態（日本語モード）のボタンテキストを確認
      let languageButton = screen.getByRole("button", { name: new RegExp(locales.ja.languageSwitch.switchTo) });
      expect(languageButton).toHaveTextContent("EN"); // 480px以下、日本語モードでは "EN"

      // ボタンをクリックして英語モードに切り替え
      fireEvent.click(languageButton);

      // 英語モードでのボタンテキストとaria-labelを確認
      languageButton = screen.getByRole("button", { name: new RegExp(locales.en.languageSwitch.switchTo) });
      expect(languageButton).toHaveTextContent("日本語"); // 480px以下、英語モードでは "日本語"
    });

    test("displays correct language button text on very small screens (<= 375px)", () => {
      // 375px以下の画面幅をシミュレート
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(max-width: 768px)' || query === '(max-width: 480px)' || query === '(max-width: 375px)', // 3つのクエリでtrue
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }),
      });

      render(
        <TestWrapper initialLanguage="en"> {/* 英語モードでテスト */}
          <Header />
        </TestWrapper>
      );
      const languageButton = screen.getByRole("button", { name: new RegExp(locales.en.languageSwitch.switchTo) });
      expect(languageButton).toHaveTextContent("日"); // 375px以下では "日"
    });
  });

  // 英語モードでのテスト
  describe("with English language", () => {
    test("displays English navigation links", () => {
      // テスト内容: 英語モードで英語のナビゲーションリンクが正しく表示されることを確認
      render(
        <TestWrapper initialLanguage="en">
          <Header />
        </TestWrapper>
      );
      
      // 英語のメニュー項目が表示されているか確認
      expect(screen.getByText(locales.en.header.home)).toBeInTheDocument();
      expect(screen.getByText(locales.en.header.profileCV)).toBeInTheDocument();
      expect(screen.getByText(locales.en.header.publications)).toBeInTheDocument();
      expect(screen.getByText(locales.en.header.works)).toBeInTheDocument();
    });

    test("displays language switch button with Japanese text", () => {
      // テスト内容: 英語モードで言語切り替えボタンに「Switch to Japanese」と表示され、
      // 言語コード「日本語」が表示されることを確認
      render(
        <TestWrapper initialLanguage="en">
          <Header />
        </TestWrapper>
      );
      
      // 言語切り替えボタンが日本語表示になっているか確認
      const languageButton = screen.getByRole("button", { name: new RegExp(locales.en.languageSwitch.switchTo) });
      expect(languageButton).toBeInTheDocument();
      
      // 言語コードが表示されているか確認
      expect(languageButton).toHaveTextContent("日本語");
    });
  });
});