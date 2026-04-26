/**
 * Appコンポーネントのテスト
 *
 * このテストファイルでは、アプリケーションのルートコンポーネントである
 * Appコンポーネントの機能をテストします。Appコンポーネントは、
 * LanguageProvider、Router、Header、SubHeader、メインコンテンツ、
 * Footerなどの主要コンポーネントを含んでいます。
 *
 * テスト内容：
 * 1. コンポーネントが正常にレンダリングされるか
 * 2. 主要コンポーネント（ヘッダー、メインコンテンツ、フッター）が存在するか
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import App from "../App";
import { MantineEmotionProvider, emotionTransform } from '@mantine/emotion';
import { mantineCache } from '../mantineEmotionCache';

// Publicationsページをモック（JSONインポートエラー回避のため）
jest.mock('../pages/Publications', () => {
  const MockPublications = () => <div data-testid="mock-publications-page">Mock Publications Page</div>;
  return {
    __esModule: true,
    default: MockPublications,
  };
});

// App.tsxには既にMantineProvider、LanguageProvider、Routerが含まれているため、
// renderWithProvidersを使用せず、MantineEmotionProviderのみを追加
const renderApp = () => {
  return render(
    <MantineEmotionProvider cache={mantineCache}>
      <MantineProvider stylesTransform={emotionTransform}>
        <App />
      </MantineProvider>
    </MantineEmotionProvider>
  );
};

// ラッパーアプローチを使用したテスト
describe("App component", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  // 基本的なレンダリングテスト
  test("renders without crashing", () => {
    // テスト内容: Appコンポーネントが正常にレンダリングされることを確認
    renderApp();
  });

  // 主要コンポーネントが存在するかテスト
  test("renders main components", () => {
    // テスト内容: ヘッダー、メインコンテンツ、フッターの主要コンポーネントが存在することを確認
    renderApp();
    
    // ヘッダーが存在するか確認（ナビゲーションリンクで確認）
    const homeLink = screen.getByText(/ホーム/i);
    expect(homeLink).toBeInTheDocument();
    
    // メインコンテンツが存在するか確認
    const mainElement = screen.getByRole("main");
    expect(mainElement).toBeInTheDocument();
    
    // フッターが存在するか確認
    const footerElement = screen.getByRole("contentinfo");
    expect(footerElement).toBeInTheDocument();
  });

  test("uses blue theme by default", () => {
    renderApp();

    expect(document.documentElement).toHaveAttribute("data-theme", "blue");
    expect(screen.getByRole("button", { name: "グレーテーマに切り替え" })).toHaveTextContent("Gray");
  });

  test("restores saved gray theme and persists theme changes", () => {
    localStorage.setItem("theme", "gray");

    renderApp();

    expect(document.documentElement).toHaveAttribute("data-theme", "gray");
    expect(screen.getByRole("button", { name: "青テーマに切り替え" })).toHaveTextContent("Blue");

    fireEvent.click(screen.getByRole("button", { name: "青テーマに切り替え" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "blue");
    expect(localStorage.getItem("theme")).toBe("blue");
    expect(screen.getByRole("button", { name: "グレーテーマに切り替え" })).toHaveTextContent("Gray");
  });
});
