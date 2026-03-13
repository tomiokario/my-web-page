# プロジェクト構造

このドキュメントでは、my-web-pageプロジェクトのディレクトリ構造と各ファイルの役割について説明します。

## ディレクトリ構造

```
my-web-page/
├── docs/                      # ドキュメント
├── public/                    # 静的ファイル
│   ├── favicon.ico
│   ├── index.html
│   ├── manifest.json
│   └── markdown/             # マークダウンコンテンツ（多言語）
│       ├── home.md
│       ├── profilecv.md
│       ├── en/
│       │   ├── home.md
│       │   ├── profilecv.md
│       │   ├── works.md
│       │   └── works/computer-system-2025.md
│       └── ja/
│           ├── home.md
│           ├── profilecv.md
│           ├── works.md
│           └── works/computer-system-2025.md
├── scripts/
│   └── convertPublications.ts # CSV→JSON 変換スクリプト
├── src/
│   ├── App.tsx               # ルートコンポーネント（Router/レイアウト）
│   ├── index.tsx             # エントリーポイント（Mantine Emotion Provider 設定）
│   ├── mantineEmotionCache.ts# Emotion cache 設定
│   ├── routes.tsx            # ルート定義とページメタデータ
│   ├── __tests__/            # テスト
│   ├── components/
│   │   ├── Header.tsx / Footer.tsx / SubHeader.tsx
│   │   ├── MarkdownPage.tsx  # Markdown ページの共通表示
│   │   └── publications/     # 出版物 UI
│   │       ├── PublicationsView.tsx
│   │       ├── PublicationGroup.tsx
│   │       ├── PublicationItem.tsx
│   │       └── FilterDropdown.tsx / ActiveFilters.tsx
│   ├── contexts/
│   │   └── LanguageContext.tsx
│   ├── data/                 # 入力CSVと出力JSON
│   │   ├── publication_data.csv
│   │   └── publications.json
│   ├── hooks/
│   │   ├── useFilters.ts
│   │   ├── useLocale.ts
│   │   └── usePublications.ts
│   ├── locales/
│   │   ├── en.ts / ja.ts
│   │   ├── index.ts
│   │   └── types.ts
│   ├── pages/
│   │   ├── Home.tsx / ProfileCV.tsx / Works.tsx
│   │   ├── Publications.tsx
│   │   └── ComputerSystem2025.tsx
│   ├── styles/
│   │   ├── styles.css
│   │   └── variables.css
│   ├── test-utils/           # テスト用ラッパー/ファクトリ
│   │   ├── test-utils.tsx / render.tsx
│   │   └── factories/, mocks/
│   ├── types.ts              # 共通型定義（Publication など）
│   └── utils/
│       ├── csvToJson.ts      # CSV→JSON 変換
│       └── markdownLoader.ts # Markdown ローダ
├── jest.config.js
├── jest.setup.ts
├── package.json
└── README.md
```

## 主要コンポーネントの説明

### アプリケーション構造

- **App.tsx**: アプリケーションのルートコンポーネント。レイアウトと `routes.tsx` に定義されたルートの描画を担当します。
- **routes.tsx**: ルートパス、ナビゲーション表示、サブヘッダー表示に使うメタデータを一元管理します。
- **index.tsx**: Reactアプリケーションのエントリーポイント。Mantine の provider 構成を担当します。

### ページコンポーネント

- **Home.tsx**: ホームページ。`MarkdownPage.tsx` を使ってコンテンツを表示します。
- **ProfileCV.tsx**: プロフィールと履歴書のページ。`MarkdownPage.tsx` を使ってコンテンツを表示します。
- **Publications.tsx**: 出版物一覧ページ。出版物データの取得、フィルタリング、並び替えの状態管理を行います。
- **Works.tsx**: 仕事紹介ページ。`MarkdownPage.tsx` を使ってコンテンツを表示します。
- **ComputerSystem2025.tsx**: コンピュータシステム2025の詳細ページ。`MarkdownPage.tsx` を使ってコンテンツを表示し、戻る導線を追加します。

### 共通コンポーネント

- **Header.tsx**: サイト全体のヘッダー。ナビゲーションメニューと言語切り替えボタンを含みます。
- **SubHeader.tsx**: 各ページのタイトルを表示するベージュ帯のコンポーネント。
- **Footer.tsx**: サイト全体のフッター。著作権情報などを表示します。
- **MarkdownPage.tsx**: 言語ごとの Markdown 読み込みと描画を共通化するコンポーネントです。

### 出版物関連コンポーネント

- **PublicationsView.tsx**: 出版物一覧のUIコンポーネント。フィルターと並び替えのUIを提供します。
- **PublicationGroup.tsx**: 出版物をグループ化して表示するコンポーネント。
- **PublicationItem.tsx**: 個々の出版物項目を表示するコンポーネント。
- **FilterDropdown.tsx**: フィルタードロップダウンコンポーネント。
- **ActiveFilters.tsx**: 現在適用されているフィルターを表示するコンポーネント。

### コンテキストとフック

- **LanguageContext.tsx**: 言語設定を管理するコンテキスト。言語の切り替えと保存を担当します。
- **useLocale.ts**: 現在の言語に対応する locale オブジェクトを取得するカスタムフックです。
- **usePublications.ts**: 出版物データの取得、整形、並び替え、グループ化を行うカスタムフック。
- **useFilters.ts**: フィルタリング機能を提供するカスタムフック。

### ユーティリティ

- **csvToJson.ts**: CSVファイルをJSONに変換するユーティリティ関数。
- **markdownLoader.ts**: マークダウンファイルを読み込むユーティリティ関数。

## データフロー

以下の図は、出版物データの流れを示しています：

```mermaid
flowchart LR
    A[CSV Data<br>src/data/publication_data.csv] --> B[convertPublications.ts]
    B --> C[JSON Data<br>src/data/publications.json]
    C --> D[usePublications Hook (Initial Sort)]
    D --> E[useFilters Hook (.ts)]
    E --> F[usePublications Hook (Grouping)]
    F --> G[PublicationsView (.tsx)]
    G --> H[PublicationGroup (.tsx)]
    H --> I[PublicationItem (.tsx)]
```

## コンポーネント階層

以下の図は、アプリケーションのコンポーネント階層を示しています：

```mermaid
graph TD
    A[App (.tsx)] --> B[LanguageProvider (.tsx)]
    B --> C[Router]
    C --> D[routes.tsx]
    C --> E[Header (.tsx)]
    C --> F[SubHeader (.tsx)]
    C --> G[Main Content]
    C --> H[Footer (.tsx)]
    G --> I[Home (.tsx)]
    G --> J[ProfileCV (.tsx)]
    G --> K[Publications (.tsx)]
    G --> L[Works (.tsx)]
    G --> M[ComputerSystem2025 (.tsx)]
    I --> N[MarkdownPage (.tsx)]
    J --> N
    L --> N
    M --> N
    K --> O[PublicationsView (.tsx)]
    O --> P[FilterDropdown (.tsx)]
    O --> Q[ActiveFilters (.tsx)]
    O --> R[PublicationGroup (.tsx)]
    R --> S[PublicationItem (.tsx)]
```

## 多言語対応の構造

以下の図は、多言語対応の仕組みを示しています：

```mermaid
flowchart TD
    A[LanguageContext (.tsx)] --> B[useLanguage Hook (.ts)]
    B --> C[useLocale Hook (.ts)]
    C --> D[Components (.tsx)]
    E[locales/ja.ts] --> C
    F[locales/en.ts] --> C
    G[localStorage] <--> A
```

詳細な多言語対応の実装については、[多言語対応](./multilingual-support.md)のドキュメントを参照してください。
