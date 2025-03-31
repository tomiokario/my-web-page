/**
 * SubHeaderコンポーネントのテスト
 *
 * このテストファイルでは、SubHeaderコンポーネントの機能をテストします。
 * SubHeaderコンポーネントは、現在のURLパスと言語設定に基づいて、
 * 適切なページ名を表示する役割を持っています。
 *
 * テスト内容：
 * 1. 日本語モードでの各ページ名の表示
 * 2. 英語モードでの各ページ名の表示
 * 3. 未知のパスの場合の非表示動作
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import SubHeader from "../components/SubHeader";
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
      {children}
    </LanguageProvider>
  );
};

// ラッパーアプローチを使用したテスト
describe("SubHeader component", () => {
  // 日本語モードでのテスト
  describe("with Japanese language", () => {
    // Profile & CVページの場合のテスト
    test("displays correct Japanese page name for profile-cv path", () => {
      // テスト内容: /profile-cvパスにアクセスした場合、日本語の「プロフィール & 履歴書 (CV)」が表示されることを確認
      render(
        <TestWrapper initialLanguage="ja">
          <MemoryRouter initialEntries={["/profile-cv"]}>
            <SubHeader />
          </MemoryRouter>
        </TestWrapper>
      );
      const headingElement = screen.getByText(locales.ja.subheader.profileCV);
      expect(headingElement).toBeInTheDocument();
    });

    // ホームページの場合のテスト
    test("displays correct Japanese page name for home path", () => {
      // テスト内容: ルートパス(/)にアクセスした場合、日本語の「冨岡 莉生 (TOMIOKA Rio)」が表示されることを確認
      render(
        <TestWrapper initialLanguage="ja">
          <MemoryRouter initialEntries={["/"]}>
            <SubHeader />
          </MemoryRouter>
        </TestWrapper>
      );
      const headingElement = screen.getByText(locales.ja.subheader.home);
      expect(headingElement).toBeInTheDocument();
    });

    // Publicationsページの場合のテスト
    test("displays correct Japanese page name for publications path", () => {
      // テスト内容: /publicationsパスにアクセスした場合、日本語の「出版物」が表示されることを確認
      render(
        <TestWrapper initialLanguage="ja">
          <MemoryRouter initialEntries={["/publications"]}>
            <SubHeader />
          </MemoryRouter>
        </TestWrapper>
      );
      const headingElement = screen.getByText(locales.ja.subheader.publications);
      expect(headingElement).toBeInTheDocument();
    });
  });

  // 英語モードでのテスト
  describe("with English language", () => {
    // Profile & CVページの場合のテスト
    test("displays correct English page name for profile-cv path", () => {
      // テスト内容: /profile-cvパスにアクセスした場合、英語の「Profile & Curriculum Vitae (CV)」が表示されることを確認
      render(
        <TestWrapper initialLanguage="en">
          <MemoryRouter initialEntries={["/profile-cv"]}>
            <SubHeader />
          </MemoryRouter>
        </TestWrapper>
      );
      const headingElement = screen.getByText(locales.en.subheader.profileCV);
      expect(headingElement).toBeInTheDocument();
    });

    // ホームページの場合のテスト
    test("displays correct English page name for home path", () => {
      // テスト内容: ルートパス(/)にアクセスした場合、英語の「TOMIOKA Rio」が表示されることを確認
      render(
        <TestWrapper initialLanguage="en">
          <MemoryRouter initialEntries={["/"]}>
            <SubHeader />
          </MemoryRouter>
        </TestWrapper>
      );
      const headingElement = screen.getByText(locales.en.subheader.home);
      expect(headingElement).toBeInTheDocument();
    });

    // Publicationsページの場合のテスト
    test("displays correct English page name for publications path", () => {
      // テスト内容: /publicationsパスにアクセスした場合、英語の「Publications」が表示されることを確認
      render(
        <TestWrapper initialLanguage="en">
          <MemoryRouter initialEntries={["/publications"]}>
            <SubHeader />
          </MemoryRouter>
        </TestWrapper>
      );
      const headingElement = screen.getByText(locales.en.subheader.publications);
      expect(headingElement).toBeInTheDocument();
    });
  });

  // 未知のパスの場合のテスト
  test("does not render for unknown path", () => {
    // テスト内容: 未知のパス(/unknown)にアクセスした場合、SubHeaderコンポーネントが何も表示しないことを確認
    const { container } = render(
      <TestWrapper>
        <MemoryRouter initialEntries={["/unknown"]}>
          <SubHeader />
        </MemoryRouter>
      </TestWrapper>
    );
    expect(container.firstChild).toBeNull();
  });
});