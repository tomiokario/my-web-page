import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MantineEmotionProvider, emotionTransform } from '@mantine/emotion';
import { mantineCache } from '../mantineEmotionCache';
import { LanguageProvider } from '../contexts/LanguageContext';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import '@mantine/core/styles.css';

// React Router警告を抑制
const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  // React Router Future Flag警告をフィルタリング
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('React Router Future Flag Warning') || 
     args[0].includes('⚠️ React Router Future Flag Warning'))
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

/**
 * テスト用のラッパーコンポーネント
 * MantineProvider、LanguageProvider、RouterComponentを含む
 */
interface AllProvidersProps {
  children: React.ReactNode;
  initialLanguage?: string;
  memoryRouterEntries?: string[];
}

export const AllProviders: React.FC<AllProvidersProps> = ({ 
  children, 
  initialLanguage = 'ja',
  memoryRouterEntries
}) => {
  // localStorage のモックを作成
  const localStorageMock = (() => {
    let store: Record<string, string> = { language: initialLanguage };
    return {
      getItem: jest.fn((key: string) => store[key]),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      })
    };
  })();

  // テスト用に localStorage をモック
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });

  // ルーターコンポーネントを選択
  const RouterComponent = memoryRouterEntries ? 
    ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={memoryRouterEntries}>
        {children}
      </MemoryRouter>
    ) : 
    ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );

  return (
    <MantineEmotionProvider cache={mantineCache}>
      <MantineProvider stylesTransform={emotionTransform}>
        <LanguageProvider>
          <RouterComponent>
            {children}
          </RouterComponent>
        </LanguageProvider>
      </MantineProvider>
    </MantineEmotionProvider>
  );
};

/**
 * カスタムrender関数
 * Testing Libraryのrenderをラップし、すべてのプロバイダーでUIをラップする
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialLanguage?: string;
  memoryRouterEntries?: string[];
}

export function renderWithProviders(
  ui: React.ReactElement,
  { initialLanguage = 'ja', memoryRouterEntries, ...options }: CustomRenderOptions = {}
) {
  return render(ui, { 
    wrapper: (props) => (
      <AllProviders 
        initialLanguage={initialLanguage} 
        memoryRouterEntries={memoryRouterEntries}
        {...props} 
      />
    ),
    ...options 
  });
}

// Testing Libraryのその他のエクスポートを再エクスポート
export * from '@testing-library/react';
export { userEvent };