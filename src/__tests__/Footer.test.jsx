import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom"; // jest-domをインポート
import Footer from "../components/Footer"; // パスを修正

// モックの作成
jest.mock("../contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "ja" })
}));

jest.mock("../locales", () => ({
  __esModule: true,
  default: {
    ja: {
      footer: {
        copyright: "© 2025 冨岡 莉生"
      }
    },
    en: {
      footer: {
        copyright: "© 2025 TOMIOKA Rio"
      }
    }
  }
}));

// Footerコンポーネントのテスト
describe("Footer component", () => {
  // 基本的なレンダリングテスト
  test("renders without crashing", () => {
    render(<Footer />);
  });

  // 日本語のコンテンツが正しく表示されるかテスト
  test("displays Japanese copyright text when language is ja", () => {
    jest.spyOn(require("../contexts/LanguageContext"), "useLanguage").mockImplementation(() => ({ language: "ja" }));
    render(<Footer />);
    const copyrightElement = screen.getByText(/2025 冨岡 莉生/i);
    expect(copyrightElement).toBeInTheDocument();
  });

  // フッター要素が存在するかテスト
  test("contains footer element", () => {
    render(<Footer />);
    const footerElement = screen.getByRole("contentinfo");
    expect(footerElement).toBeInTheDocument();
  });
});