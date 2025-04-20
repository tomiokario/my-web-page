import React from 'react';
import { render as tlRender, RenderOptions } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MantineEmotionProvider, emotionTransform } from '@mantine/emotion';
import { mantineCache } from '../mantineEmotionCache';
import '@mantine/core/styles.css';

/**
 * Mantineプロバイダーを含むラッパーコンポーネント
 * テスト時にMantineのスタイルとテーマを適用するために使用
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <MantineEmotionProvider cache={mantineCache}>
      <MantineProvider stylesTransform={emotionTransform}>
        {children}
      </MantineProvider>
    </MantineEmotionProvider>
  );
}

/**
 * カスタムrender関数
 * Testing Libraryのrenderをラップし、MantineプロバイダーでUIをラップする
 */
export function render(ui: React.ReactElement, options?: RenderOptions) {
  return tlRender(ui, { wrapper: AllProviders, ...options });
}

// Testing Libraryのその他のエクスポートを再エクスポート
export * from '@testing-library/react';

// userEventをエクスポート（よく使うため）
import userEvent from '@testing-library/user-event';
export { userEvent };