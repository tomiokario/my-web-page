import createCache from '@emotion/cache';

export const mantineCache = createCache({
  key: 'mantine',
  prepend: true, // headの先頭にスタイルを挿入
});