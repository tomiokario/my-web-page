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
import { render, screen } from "@testing-library/react";
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
      <App />
    </MantineEmotionProvider>
  );
};

// ラッパーアプローチを使用したテスト
describe("App component", () => {
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
});