/**
 * Markdownファイルを読み込むためのユーティリティ関数
 */

// Markdownファイルを読み込む関数
export const loadMarkdown = async (filePath: string, language: string = 'ja'): Promise<string> => {
  try {
    // 言語に応じたパスを生成
    // 例: /markdown/home.md → /markdown/ja/home.md または /markdown/en/home.md
    // 例: /markdown/works/computer-system-2025.md → /markdown/ja/works/computer-system-2025.md
    const pathParts = filePath.split('/');
    
    // /markdownの後のパスを取得
    let subPath = '';
    let markdownIndex = -1;
    
    // /markdownの位置を探す
    for (let i = 0; i < pathParts.length; i++) {
      if (pathParts[i] === 'markdown') {
        markdownIndex = i;
        break;
      }
    }
    
    // /markdownの後のパスを結合（ファイル名を除く）
    if (markdownIndex !== -1 && pathParts.length > markdownIndex + 2) {
      // /markdown/の後に少なくとも2つの要素がある場合（サブディレクトリとファイル名）
      subPath = pathParts.slice(markdownIndex + 1, pathParts.length - 1).join('/') + '/';
    }
    
    const fileName = pathParts[pathParts.length - 1];
    const langPath = `/markdown/${language}/${subPath}${fileName}`;
    
    console.log('Loading markdown from:', langPath, '(fallback:', filePath, ')');
    
    // まず言語固有のファイルを試す
    let response: Response = await fetch(langPath);
    
    // 言語固有のファイルが存在しない場合は、元のパスを試す（後方互換性のため）
    if (!response.ok) {
      response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load markdown file: ${filePath} or ${langPath}`);
      }
    }
    
    const text: string = await response.text();
    return text;
  } catch (error: any) {
    console.error('Error loading markdown:', error.message);
    return '# Error loading content';
  }
};