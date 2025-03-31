/**
 * Headerコンポーネントのテスト
 *
 * このテストファイルでは、Headerコンポーネントの機能をテストします。
 * Headerコンポーネントは、ナビゲーションリンク、言語切り替えボタン、
 * モバイル表示時のハンバーガーメニューなどの機能を持っています。
 *
 * テスト内容：
 * 1. デスクトップ表示での動作（ナビゲーションリンク、言語切り替え）
 * 2. モバイル表示での動作（ハンバーガーメニュー、サイドメニュー）
 * 3. 日本語/英語モードでの表示切り替え
 */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import Header from "../components/Header";
import { LanguageProvider } from "../contexts/LanguageContext";
import locales from "../locales";

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
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </LanguageProvider>
  );
};

describe("Header component", () => {
  beforeEach(() => {
    // ウィンドウサイズをデスクトップサイズに設定
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  // 基本的なレンダリングテスト
  test("renders without crashing", () => {
    // テスト内容: Headerコンポーネントが正常にレンダリングされることを確認
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );
  });

  // デスクトップ表示でのテスト
  describe("desktop view", () => {
    test("displays navigation links", () => {
      // テスト内容: デスクトップ表示で日本語のナビゲーションリンクが正しく表示されることを確認
      render(
        <TestWrapper initialLanguage="ja">
          <Header />
        </TestWrapper>
      );
      
      // 日本語のメニュー項目が表示されているか確認
      expect(screen.getByText(locales.ja.header.home)).toBeInTheDocument();
      expect(screen.getByText(locales.ja.header.profileCV)).toBeInTheDocument();
      expect(screen.getByText(locales.ja.header.publications)).toBeInTheDocument();
    });

    test("displays language switch button", () => {
      // テスト内容: 言語切り替えボタンが正しく表示され、言語コード「EN」が表示されることを確認
      render(
        <TestWrapper initialLanguage="ja">
          <Header />
        </TestWrapper>
      );
      
      // 言語切り替えボタンが表示されているか確認
      const languageButton = screen.getByRole("button", { name: locales.ja.languageSwitch.switchTo });
      expect(languageButton).toBeInTheDocument();
      
      // 言語コードが表示されているか確認
      expect(screen.getByText("EN")).toBeInTheDocument();
    });

    test("toggles language when language button is clicked", () => {
      // テスト内容: 言語切り替えボタンをクリックすると、表示言語が日本語から英語に切り替わることを確認
      render(
        <TestWrapper initialLanguage="ja">
          <Header />
        </TestWrapper>
      );
      
      // 言語切り替えボタンをクリック
      const languageButton = screen.getByRole("button", { name: locales.ja.languageSwitch.switchTo });
      fireEvent.click(languageButton);
      
      // 言語が英語に切り替わったか確認
      expect(screen.getByText(locales.en.header.home)).toBeInTheDocument();
      expect(screen.getByText(locales.en.header.profileCV)).toBeInTheDocument();
      expect(screen.getByText(locales.en.header.publications)).toBeInTheDocument();
    });
  });

  // モバイル表示でのテスト
  describe("mobile view", () => {
    beforeEach(() => {
      // ウィンドウサイズをモバイルサイズに設定
      global.innerWidth = 480;
      global.dispatchEvent(new Event('resize'));
    });

    test("displays hamburger menu button", () => {
      // テスト内容: モバイル表示でハンバーガーメニューボタンが表示されることを確認
      render(
        <TestWrapper initialLanguage="ja">
          <Header />
        </TestWrapper>
      );
      
      // ハンバーガーメニューボタンが表示されているか確認
      const hamburgerButton = screen.getByRole("button", { name: /open menu/i });
      expect(hamburgerButton).toBeInTheDocument();
    });

    test("opens side menu when hamburger button is clicked", () => {
      // テスト内容: ハンバーガーメニューボタンをクリックすると、サイドメニューが開き、
      // メニュー項目と言語切り替えボタンが表示されることを確認
      render(
        <TestWrapper initialLanguage="ja">
          <Header />
        </TestWrapper>
      );
      
      // ハンバーガーメニューボタンをクリック
      const hamburgerButton = screen.getByRole("button", { name: /open menu/i });
      fireEvent.click(hamburgerButton);
      
      // サイドメニューが表示されているか確認
      const closeButton = screen.getByRole("button", { name: /close menu/i });
      expect(closeButton).toBeInTheDocument();
      
      // メニュー項目が表示されているか確認
      expect(screen.getByText(locales.ja.header.home)).toBeInTheDocument();
      expect(screen.getByText(locales.ja.header.profileCV)).toBeInTheDocument();
      expect(screen.getByText(locales.ja.header.publications)).toBeInTheDocument();
      
      // モバイル用の言語切り替えボタンが表示されているか確認
      // クラス名を指定して一意に特定
      const mobileLanguageButton = document.querySelector(".language-switch-button.mobile");
      expect(mobileLanguageButton).toBeInTheDocument();
      expect(mobileLanguageButton).toHaveTextContent(locales.ja.languageSwitch.switchTo);
    });

    test("closes side menu when close button is clicked", () => {
      // テスト内容: サイドメニューの閉じるボタンをクリックすると、サイドメニューが閉じることを確認
      render(
        <TestWrapper initialLanguage="ja">
          <Header />
        </TestWrapper>
      );
      
      // ハンバーガーメニューボタンをクリック
      const hamburgerButton = screen.getByRole("button", { name: /open menu/i });
      fireEvent.click(hamburgerButton);
      
      // 閉じるボタンをクリック
      const closeButton = screen.getByRole("button", { name: /close menu/i });
      fireEvent.click(closeButton);
      
      // サイドメニューが閉じられたか確認（閉じるボタンが非表示になっているか）
      expect(screen.queryByRole("button", { name: /close menu/i })).not.toBeInTheDocument();
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
      const languageButton = screen.getByRole("button", { name: locales.en.languageSwitch.switchTo });
      expect(languageButton).toBeInTheDocument();
      
      // 言語コードが表示されているか確認
      expect(screen.getByText("日本語")).toBeInTheDocument();
    });
  });
});