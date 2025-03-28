/**
 * Markdownファイルを読み込むためのユーティリティ関数
 */

// Markdownファイルを読み込む関数
export const loadMarkdown = async (filePath) => {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load markdown file: ${filePath}`);
    }
    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Error loading markdown:', error);
    return '# Error loading content';
  }
};