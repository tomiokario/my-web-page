import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import SubHeader from "../components/SubHeader";

// モックの作成
jest.mock("../contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "ja" })
}));

jest.mock("../locales", () => ({
  __esModule: true,
  default: {
    ja: {
      subheader: {
        home: "冨岡 莉生 (TOMIOKA Rio)",
        profileCV: "プロフィール & 履歴書 (CV)",
        publications: "出版物"
      }
    },
    en: {
      subheader: {
        home: "TOMIOKA Rio",
        profileCV: "Profile & Curriculum Vitae (CV)",
        publications: "Publications"
      }
    }
  }
}));

// ラッパーアプローチを使用したテスト
describe("SubHeader component", () => {
  // 日本語モードでのテスト
  describe("with Japanese language", () => {
    beforeEach(() => {
      jest.spyOn(require("../contexts/LanguageContext"), "useLanguage").mockImplementation(() => ({ language: "ja" }));
    });

    // Profile & CVページの場合のテスト
    test("displays correct Japanese page name for profile-cv path", () => {
      render(
        <MemoryRouter initialEntries={["/profile-cv"]}>
          <SubHeader />
        </MemoryRouter>
      );
      const headingElement = screen.getByText("プロフィール & 履歴書 (CV)");
      expect(headingElement).toBeInTheDocument();
    });

    // ホームページの場合のテスト
    test("displays correct Japanese page name for home path", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <SubHeader />
        </MemoryRouter>
      );
      const headingElement = screen.getByText("冨岡 莉生 (TOMIOKA Rio)");
      expect(headingElement).toBeInTheDocument();
    });

    // Publicationsページの場合のテスト
    test("displays correct Japanese page name for publications path", () => {
      render(
        <MemoryRouter initialEntries={["/publications"]}>
          <SubHeader />
        </MemoryRouter>
      );
      const headingElement = screen.getByText("出版物");
      expect(headingElement).toBeInTheDocument();
    });
  });

  // 英語モードでのテスト
  describe("with English language", () => {
    beforeEach(() => {
      jest.spyOn(require("../contexts/LanguageContext"), "useLanguage").mockImplementation(() => ({ language: "en" }));
    });

    // Profile & CVページの場合のテスト
    test("displays correct English page name for profile-cv path", () => {
      render(
        <MemoryRouter initialEntries={["/profile-cv"]}>
          <SubHeader />
        </MemoryRouter>
      );
      const headingElement = screen.getByText("Profile & Curriculum Vitae (CV)");
      expect(headingElement).toBeInTheDocument();
    });

    // ホームページの場合のテスト
    test("displays correct English page name for home path", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <SubHeader />
        </MemoryRouter>
      );
      const headingElement = screen.getByText("TOMIOKA Rio");
      expect(headingElement).toBeInTheDocument();
    });

    // Publicationsページの場合のテスト
    test("displays correct English page name for publications path", () => {
      render(
        <MemoryRouter initialEntries={["/publications"]}>
          <SubHeader />
        </MemoryRouter>
      );
      const headingElement = screen.getByText("Publications");
      expect(headingElement).toBeInTheDocument();
    });
  });

  // 未知のパスの場合のテスト
  test("does not render for unknown path", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/unknown"]}>
        <SubHeader />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });
});