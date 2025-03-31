import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import Header from "../components/Header";

// モックの作成
const mockToggleLanguage = jest.fn();

jest.mock("../contexts/LanguageContext", () => ({
  useLanguage: () => ({ 
    language: "ja", 
    toggleLanguage: mockToggleLanguage 
  })
}));

jest.mock("../locales", () => ({
  __esModule: true,
  default: {
    ja: {
      header: {
        home: "ホーム",
        profileCV: "プロフィール・CV",
        publications: "出版物"
      },
      languageSwitch: {
        switchTo: "英語に切り替え"
      }
    },
    en: {
      header: {
        home: "Home",
        profileCV: "Profile & CV",
        publications: "Publications"
      },
      languageSwitch: {
        switchTo: "Switch to Japanese"
      }
    }
  }
}));

// ラッパーコンポーネント
const HeaderWithRouter = () => (
  <BrowserRouter>
    <Header />
  </BrowserRouter>
);

describe("Header component", () => {
  beforeEach(() => {
    // モックをリセット
    mockToggleLanguage.mockClear();
    
    // ウィンドウサイズをデスクトップサイズに設定
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  // 基本的なレンダリングテスト
  test("renders without crashing", () => {
    render(<HeaderWithRouter />);
  });

  // デスクトップ表示でのテスト
  describe("desktop view", () => {
    test("displays navigation links", () => {
      render(<HeaderWithRouter />);
      
      // 日本語のメニュー項目が表示されているか確認
      expect(screen.getByText("ホーム")).toBeInTheDocument();
      expect(screen.getByText("プロフィール・CV")).toBeInTheDocument();
      expect(screen.getByText("出版物")).toBeInTheDocument();
    });

    test("displays language switch button", () => {
      render(<HeaderWithRouter />);
      
      // 言語切り替えボタンが表示されているか確認
      const languageButton = screen.getByRole("button", { name: /英語に切り替え/i });
      expect(languageButton).toBeInTheDocument();
      
      // 言語コードが表示されているか確認
      expect(screen.getByText("EN")).toBeInTheDocument();
    });

    test("calls toggleLanguage when language button is clicked", () => {
      render(<HeaderWithRouter />);
      
      // 言語切り替えボタンをクリック
      const languageButton = screen.getByRole("button", { name: /英語に切り替え/i });
      fireEvent.click(languageButton);
      
      // toggleLanguage関数が呼ばれたか確認
      expect(mockToggleLanguage).toHaveBeenCalledTimes(1);
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
      render(<HeaderWithRouter />);
      
      // ハンバーガーメニューボタンが表示されているか確認
      const hamburgerButton = screen.getByRole("button", { name: /open menu/i });
      expect(hamburgerButton).toBeInTheDocument();
    });

    test("opens side menu when hamburger button is clicked", () => {
      render(<HeaderWithRouter />);
      
      // ハンバーガーメニューボタンをクリック
      const hamburgerButton = screen.getByRole("button", { name: /open menu/i });
      fireEvent.click(hamburgerButton);
      
      // サイドメニューが表示されているか確認
      const closeButton = screen.getByRole("button", { name: /close menu/i });
      expect(closeButton).toBeInTheDocument();
      
      // メニュー項目が表示されているか確認
      expect(screen.getByText("ホーム")).toBeInTheDocument();
      expect(screen.getByText("プロフィール・CV")).toBeInTheDocument();
      expect(screen.getByText("出版物")).toBeInTheDocument();
      
      // モバイル用の言語切り替えボタンが表示されているか確認
      // クラス名を指定して一意に特定
      const mobileLanguageButton = document.querySelector(".language-switch-button.mobile");
      expect(mobileLanguageButton).toBeInTheDocument();
      expect(mobileLanguageButton).toHaveTextContent("英語に切り替え");
    });

    test("closes side menu when close button is clicked", () => {
      render(<HeaderWithRouter />);
      
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
    beforeEach(() => {
      // 言語を英語に設定
      jest.spyOn(require("../contexts/LanguageContext"), "useLanguage").mockImplementation(() => ({ 
        language: "en", 
        toggleLanguage: mockToggleLanguage 
      }));
    });

    test("displays English navigation links", () => {
      render(<HeaderWithRouter />);
      
      // 英語のメニュー項目が表示されているか確認
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Profile & CV")).toBeInTheDocument();
      expect(screen.getByText("Publications")).toBeInTheDocument();
    });

    test("displays language switch button with Japanese text", () => {
      render(<HeaderWithRouter />);
      
      // 言語切り替えボタンが日本語表示になっているか確認
      const languageButton = screen.getByRole("button", { name: /switch to japanese/i });
      expect(languageButton).toBeInTheDocument();
      
      // 言語コードが表示されているか確認
      expect(screen.getByText("日本語")).toBeInTheDocument();
    });
  });
});