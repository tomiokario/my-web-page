import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../App";

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
});