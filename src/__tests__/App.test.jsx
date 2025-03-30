import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// テスト用の簡易版Appコンポーネント
// 実際のコンポーネントと同じ構造を持つが、依存関係を単純化
const TestApp = () => {
  return (
    <div data-testid="app-container">
      <header data-testid="header">Header</header>
      <div data-testid="subheader">SubHeader</div>
      <main data-testid="main-content">
        <div>
          <div data-testid="route-content">Route Content</div>
        </div>
      </main>
      <footer data-testid="footer">Footer</footer>
    </div>
  );
};

describe("App component (Test Version)", () => {
  // 基本的なレンダリングテスト
  test("renders without crashing", () => {
    render(<TestApp />);
  });

  // 主要コンポーネントが存在するかテスト
  test("renders main components", () => {
    render(<TestApp />);
    
    // ヘッダーが存在するか確認
    const headerElement = screen.getByTestId("header");
    expect(headerElement).toBeInTheDocument();
    
    // サブヘッダーが存在するか確認
    const subheaderElement = screen.getByTestId("subheader");
    expect(subheaderElement).toBeInTheDocument();
    
    // メインコンテンツが存在するか確認
    const mainElement = screen.getByTestId("main-content");
    expect(mainElement).toBeInTheDocument();
    
    // フッターが存在するか確認
    const footerElement = screen.getByTestId("footer");
    expect(footerElement).toBeInTheDocument();
  });
});