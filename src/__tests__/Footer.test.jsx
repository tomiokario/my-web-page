import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom"; // jest-domをインポート
import Footer from "../components/Footer"; // パスを修正

// Footerコンポーネントのテスト
describe("Footer component", () => {
  // 基本的なレンダリングテスト
  test("renders without crashing", () => {
    render(<Footer />);
  });

  // コンテンツが正しく表示されるかテスト
  test("displays copyright text", () => {
    render(<Footer />);
    const copyrightElement = screen.getByText(/2025 TOMIOKA Rio/i);
    expect(copyrightElement).toBeInTheDocument();
  });

  // フッター要素が存在するかテスト
  test("contains footer element", () => {
    render(<Footer />);
    const footerElement = screen.getByRole("contentinfo");
    expect(footerElement).toBeInTheDocument();
  });
});