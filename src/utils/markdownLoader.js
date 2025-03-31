/**
 * Markdownファイルを読み込むためのユーティリティ関数
 */

// Markdownファイルを読み込む関数
export const loadMarkdown = async (filePath, language = 'ja') => {
  try {
    // 言語に応じたパスを生成
    // 例: /markdown/home.md → /markdown/ja/home.md または /markdown/en/home.md
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const langPath = `/markdown/${language}/${fileName}`;
    
    // まず言語固有のファイルを試す
    let response = await fetch(langPath);
    
    // 言語固有のファイルが存在しない場合は、元のパスを試す（後方互換性のため）
    if (!response.ok) {
      response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load markdown file: ${filePath} or ${langPath}`);
      }
    }
    
    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Error loading markdown:', error);
    return '# Error loading content';
  }
};