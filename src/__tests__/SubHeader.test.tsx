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
import { screen } from "@testing-library/react";
import SubHeader from "../components/SubHeader";
import locales from "../locales";
import { renderWithProviders } from "../test-utils/test-utils";

// ラッパーアプローチを使用したテスト
describe("SubHeader component", () => {
  // 日本語モードでのテスト
  describe("with Japanese language", () => {
    // Profile & CVページの場合のテスト
    test("displays correct Japanese page name for profile-cv path", () => {
      // テスト内容: /profile-cvパスにアクセスした場合、日本語の「プロフィール & 履歴書 (CV)」が表示されることを確認
      renderWithProviders(
        <SubHeader />,
        { 
          initialLanguage: "ja",
          memoryRouterEntries: ["/profile-cv"]
        }
      );
      const headingElement = screen.getByText(locales.ja.subheader.profileCV);
      expect(headingElement).toBeInTheDocument();
    });

    // ホームページの場合のテスト
    test("displays correct Japanese page name for home path", () => {
      // テスト内容: ルートパス(/)にアクセスした場合、日本語の「冨岡 莉生 (TOMIOKA Rio)」が表示されることを確認
      renderWithProviders(
        <SubHeader />,
        { 
          initialLanguage: "ja",
          memoryRouterEntries: ["/"]
        }
      );
      const headingElement = screen.getByText(locales.ja.subheader.home);
      expect(headingElement).toBeInTheDocument();
    });

    // Publicationsページの場合のテスト
    test("displays correct Japanese page name for publications path", () => {
      // テスト内容: /publicationsパスにアクセスした場合、日本語の「出版物」が表示されることを確認
      renderWithProviders(
        <SubHeader />,
        { 
          initialLanguage: "ja",
          memoryRouterEntries: ["/publications"]
        }
      );
      const headingElement = screen.getByText(locales.ja.subheader.publications);
      expect(headingElement).toBeInTheDocument();
    });
  
    // Worksページの場合のテスト
    test("displays correct Japanese page name for works path", () => {
      // テスト内容: /worksパスにアクセスした場合、日本語の「仕事」が表示されることを確認
      renderWithProviders(
        <SubHeader />,
        { 
          initialLanguage: "ja",
          memoryRouterEntries: ["/works"]
        }
      );
      const headingElement = screen.getByText(locales.ja.subheader.works);
      expect(headingElement).toBeInTheDocument();
    });
  
    // Computer System 2025ページの場合のテスト
    test("displays correct Japanese page name for computer-system-2025 path", () => {
      // テスト内容: /works/computer-system-2025パスにアクセスした場合、日本語の「コンピュータシステム(2025)」が表示されることを確認
      renderWithProviders(
        <SubHeader />,
        { 
          initialLanguage: "ja",
          memoryRouterEntries: ["/works/computer-system-2025"]
        }
      );
      const headingElement = screen.getByText(locales.ja.subheader.computerSystem2025);
      expect(headingElement).toBeInTheDocument();
    });
  });

  // 英語モードでのテスト
  describe("with English language", () => {
    // Profile & CVページの場合のテスト
    test("displays correct English page name for profile-cv path", () => {
      // テスト内容: /profile-cvパスにアクセスした場合、英語の「Profile & Curriculum Vitae (CV)」が表示されることを確認
      renderWithProviders(
        <SubHeader />,
        { 
          initialLanguage: "en",
          memoryRouterEntries: ["/profile-cv"]
        }
      );
      const headingElement = screen.getByText(locales.en.subheader.profileCV);
      expect(headingElement).toBeInTheDocument();
    });

    // ホームページの場合のテスト
    test("displays correct English page name for home path", () => {
      // テスト内容: ルートパス(/)にアクセスした場合、英語の「TOMIOKA Rio」が表示されることを確認
      renderWithProviders(
        <SubHeader />,
        { 
          initialLanguage: "en",
          memoryRouterEntries: ["/"]
        }
      );
      const headingElement = screen.getByText(locales.en.subheader.home);
      expect(headingElement).toBeInTheDocument();
    });

    // Publicationsページの場合のテスト
    test("displays correct English page name for publications path", () => {
      // テスト内容: /publicationsパスにアクセスした場合、英語の「Publications」が表示されることを確認
      renderWithProviders(
        <SubHeader />,
        { 
          initialLanguage: "en",
          memoryRouterEntries: ["/publications"]
        }
      );
      const headingElement = screen.getByText(locales.en.subheader.publications);
      expect(headingElement).toBeInTheDocument();
    });
  
    // Worksページの場合のテスト
    test("displays correct English page name for works path", () => {
      // テスト内容: /worksパスにアクセスした場合、英語の「Works」が表示されることを確認
      renderWithProviders(
        <SubHeader />,
        { 
          initialLanguage: "en",
          memoryRouterEntries: ["/works"]
        }
      );
      const headingElement = screen.getByText(locales.en.subheader.works);
      expect(headingElement).toBeInTheDocument();
    });
  
    // Computer System 2025ページの場合のテスト
    test("displays correct English page name for computer-system-2025 path", () => {
      // テスト内容: /works/computer-system-2025パスにアクセスした場合、英語の「Computer System (2025)」が表示されることを確認
      renderWithProviders(
        <SubHeader />,
        { 
          initialLanguage: "en",
          memoryRouterEntries: ["/works/computer-system-2025"]
        }
      );
      const headingElement = screen.getByText(locales.en.subheader.computerSystem2025);
      expect(headingElement).toBeInTheDocument();
    });
  });

  // 未知のパスの場合のテスト
  test("does not render for unknown path", () => {
    // テスト内容: 未知のパス(/unknown)にアクセスした場合、SubHeaderコンポーネントが何も表示しないことを確認
    const { queryByRole } = renderWithProviders(
      <SubHeader />,
      { 
        initialLanguage: "ja",
        memoryRouterEntries: ["/unknown"]
      }
    );
    // SubHeaderの内容（見出し）が存在しないことを確認
    expect(queryByRole('heading')).toBeNull();
  });
});