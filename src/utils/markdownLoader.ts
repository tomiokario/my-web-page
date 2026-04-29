/**
 * Markdownファイルを読み込むためのユーティリティ関数
 */

const ERROR_MARKDOWN_CONTENT = '# Error loading content';

export const buildMarkdownPath = (filePath: string, language: string = 'ja'): string => {
  const pathParts = filePath.split('/');
  const markdownIndex = pathParts.indexOf('markdown');
  const fileName = pathParts[pathParts.length - 1];
  const directoryParts =
    markdownIndex === -1 ? [] : pathParts.slice(markdownIndex + 1, pathParts.length - 1);
  const subPath = directoryParts.length > 0 ? `${directoryParts.join('/')}/` : '';

  return `/markdown/${language}/${subPath}${fileName}`;
};

const shouldLogMarkdownError = (): boolean => process.env.NODE_ENV !== 'test';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

const logMarkdownLoadError = (error: unknown, path: string): void => {
  if (!shouldLogMarkdownError()) {
    return;
  }

  console.error('Error loading markdown:', `${path}: ${getErrorMessage(error)}`);
};

// Markdownファイルを読み込む関数
export const loadMarkdown = async (filePath: string, language: string = 'ja'): Promise<string> => {
  const langPath = buildMarkdownPath(filePath, language);

  try {
    const response: Response = await fetch(langPath);

    if (!response.ok) {
      const statusInfo = response.status ? ` (status: ${response.status})` : '';
      throw new Error(`Failed to load markdown file: ${langPath}${statusInfo}`);
    }

    const text: string = await response.text();
    return text;
  } catch (error: unknown) {
    logMarkdownLoadError(error, langPath);
    return ERROR_MARKDOWN_CONTENT;
  }
};
