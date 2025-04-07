# マークダウンコンテンツ

このドキュメントでは、my-web-pageプロジェクトでのマークダウンコンテンツの管理と読み込み方法について説明します。

## 概要

my-web-pageでは、ホームページとプロフィール・CVページのコンテンツをマークダウン形式で管理しています。これにより、HTMLを直接編集することなく、コンテンツを簡単に更新できます。また、多言語対応（日本語/英語）のコンテンツも言語ごとに別々のマークダウンファイルで管理しています。

## マークダウンファイルの構造

マークダウンファイルは `public/markdown` ディレクトリに配置されています。

```
public/markdown/
├── home.md                # ホームページのデフォルトコンテンツ
├── profilecv.md           # プロフィール・CVページのデフォルトコンテンツ
├── en/                    # 英語版コンテンツ
│   ├── home.md            # 英語版ホームページ
│   ├── profilecv.md       # 英語版プロフィール・CVページ
│   ├── works.md           # 英語版仕事ページ
│   └── works/             # 英語版業務詳細ページ
│       └── computer-system-2025.md # コンピュータシステム2025（英語）
└── ja/                    # 日本語版コンテンツ
    ├── home.md            # 日本語版ホームページ
    ├── profilecv.md       # 日本語版プロフィール・CVページ
    ├── works.md       # 日本語版仕事ページ
    └── works/             # 日本語版業務詳細ページ
        └── computer-system-2025.md # コンピュータシステム2025（日本語）
```

## マークダウンローダーユーティリティ

マークダウンファイルを読み込むために、`markdownLoader.js` ユーティリティが実装されています。

### markdownLoader.js

```jsx
// src/utils/markdownLoader.js
export const loadMarkdown = async (filePath, language = 'ja') => {
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
```

### 主な機能

- **言語に応じたパス生成**: 現在の言語設定に基づいて、適切なマークダウンファイルのパスを生成します。
- **フォールバック機能**: 言語固有のファイルが存在しない場合は、デフォルトのファイルにフォールバックします。
- **エラーハンドリング**: ファイルの読み込みに失敗した場合は、エラーメッセージを表示します。

## マークダウンの使用方法

ページコンポーネントでマークダウンを使用する方法は以下の通りです：

### Home.jsx

```jsx
// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "../contexts/LanguageContext";
import { loadMarkdown } from "../utils/markdownLoader";

function Home() {
  const [content, setContent] = useState('Loading...');
  const { language } = useLanguage();

  useEffect(() => {
    const fetchMarkdown = async () => {
      const markdownContent = await loadMarkdown('/markdown/home.md', language);
      setContent(markdownContent);
    };

    fetchMarkdown();
  }, [language]); // 言語が変更されたときにマークダウンを再読み込み

  return (
    <div style={{ padding: "0rem" }}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export default Home;
```

### ProfileCV.jsx

```jsx
// src/pages/ProfileCV.jsx
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "../contexts/LanguageContext";
import { loadMarkdown } from "../utils/markdownLoader";

function ProfileCV() {
  const [content, setContent] = useState('Loading...');
  const { language } = useLanguage();

  useEffect(() => {
    const fetchMarkdown = async () => {
      const markdownContent = await loadMarkdown('/markdown/profilecv.md', language);
      setContent(markdownContent);
    };

    fetchMarkdown();
  }, [language]); // 言語が変更されたときにマークダウンを再読み込み

  return (
    <div style={{ padding: "0rem" }}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export default ProfileCV;
```

### Works.jsx

```jsx
// src/pages/Works.jsx
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "../contexts/LanguageContext";
import { loadMarkdown } from "../utils/markdownLoader";

function Works() {
  const [content, setContent] = useState('Loading...');
  const { language } = useLanguage();

  useEffect(() => {
    const fetchMarkdown = async () => {
      const markdownContent = await loadMarkdown('/markdown/works.md', language);
      setContent(markdownContent);
    };

    fetchMarkdown();
  }, [language]); // 言語が変更されたときにマークダウンを再読み込み

  return (
    <div style={{ padding: "0rem" }}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export default Works;
```

### ComputerSystem2025.jsx

```jsx
// src/pages/ComputerSystem2025.jsx
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { loadMarkdown } from "../utils/markdownLoader";

function ComputerSystem2025() {
  const [content, setContent] = useState('Loading...');
  const [error, setError] = useState(null);
  const { language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        // 特定のマークダウンファイルのパスを直接指定
        const markdownContent = await loadMarkdown('/markdown/works/computer-system-2025.md', language);
        setContent(markdownContent);
        setError(null);
      } catch (err) {
        console.error("Error loading computer system content:", err);
        setError("Failed to load content");
        setContent("# Content not found");
      }
    };

    fetchMarkdown();
  }, [language]); // 言語が変更されたときにマークダウンを再読み込み

  // エラー時に戻るボタンを表示
  if (error) {
    return (
      <div>
        <div>{content}</div>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "0rem" }}>
      <ReactMarkdown>{content}</ReactMarkdown>
      <div style={{ marginTop: "2rem" }}>
        <button onClick={() => navigate("/works")} style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#f4f4f4",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}>
          ← Back to Works
        </button>
      </div>
    </div>
  );
}

export default ComputerSystem2025;
```

## マークダウンコンテンツの更新方法

マークダウンコンテンツを更新するには、以下の手順に従ってください：

1. 対応する言語のディレクトリ内のマークダウンファイルを編集します。
   - 日本語コンテンツ: `public/markdown/ja/`
   - 英語コンテンツ: `public/markdown/en/`

2. 変更を保存すると、アプリケーションは自動的に新しいコンテンツを読み込みます（開発サーバーが実行中の場合）。

3. 本番環境にデプロイする場合は、変更したファイルをコミットしてデプロイします。

## マークダウンのテスト
マークダウンローダーの機能は、`src/__tests__/markdownLoader.test.js`でテストされています。テストでは以下の点を確認しています：

- 言語固有のマークダウンファイルが正しく読み込まれるか
- ファイルが存在しない場合のフォールバック機能が正しく動作するか
- エラーハンドリングが適切に行われるか
- サブディレクトリを含むパスのマークダウンファイルが正しく読み込まれるか
- 複数階層のサブディレクトリを含むパスのマークダウンファイルが正しく読み込まれるか
- エラーハンドリングが適切に行われるか

テストの詳細については、[テスト戦略](./testing-strategy.md)のドキュメントを参照してください。

## マークダウン機能の拡張

現在のマークダウン実装は基本的な機能のみをサポートしていますが、以下のような拡張が可能です：

1. **カスタムコンポーネント**: ReactMarkdownの `components` プロパティを使用して、カスタムコンポーネントでマークダウン要素をレンダリングできます。

   ```jsx
   <ReactMarkdown
     components={{
       h1: ({ node, ...props }) => <h1 style={{ color: 'blue' }} {...props} />,
       a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />
     }}
   >
     {content}
   </ReactMarkdown>
   ```

2. **プラグイン**: ReactMarkdownは様々なプラグインをサポートしています。例えば、数式やシンタックスハイライトなどの機能を追加できます。

   ```jsx
   import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
   import remarkGfm from 'remark-gfm';
   import remarkMath from 'remark-math';
   import rehypeKatex from 'rehype-katex';

   <ReactMarkdown
     remarkPlugins={[remarkGfm, remarkMath]}
     rehypePlugins={[rehypeKatex]}
     components={{
       code({ node, inline, className, children, ...props }) {
         const match = /language-(\w+)/.exec(className || '');
         return !inline && match ? (
           <SyntaxHighlighter language={match[1]} {...props}>
             {String(children).replace(/\n$/, '')}
           </SyntaxHighlighter>
         ) : (
           <code className={className} {...props}>
             {children}
           </code>
         );
       }
     }}
   >
     {content}
   </ReactMarkdown>
   ```

3. **画像の最適化**: 画像パスを処理して、最適化された画像を提供することができます。

## 注意点

- マークダウンファイルは `public` ディレクトリに配置されているため、ビルド時に最適化されません。大量のマークダウンコンテンツがある場合は、パフォーマンスに影響する可能性があります。
- マークダウンコンテンツにスタイルを適用する場合は、グローバルCSSまたはインラインスタイルを使用する必要があります。
- 現在の実装では、マークダウンファイルは非同期で読み込まれるため、読み込み中の状態を適切に処理する必要があります。