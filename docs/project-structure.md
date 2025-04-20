# プロジェクト構造

このドキュメントでは、my-web-pageプロジェクトのディレクトリ構造と各ファイルの役割について説明します。

## ディレクトリ構造

```
my-web-page/
├── data/                      # 元データ（CSV）
│   └── publication_data.csv   # 出版物の元データ（CSV形式）
├── docs/                      # ドキュメント
│   └── legacy/                # 旧ドキュメント
├── public/                    # 静的ファイル
│   ├── favicon.ico           # ファビコン
│   ├── index.html            # HTMLテンプレート
│   ├── manifest.json         # Webアプリマニフェスト
│   └── markdown/             # マークダウンコンテンツ
│       ├── home.md           # ホームページのコンテンツ
│       ├── profilecv.md      # プロフィール・CVページのコンテンツ
│       ├── en/               # 英語版マークダウン
│       │   ├── home.md       # 英語版ホームページ
│       │   ├── profilecv.md  # 英語版プロフィール・CV
│       │   ├── works.md      # 英語版仕事ページ
│       │   └── works/        # 英語版業務詳細ページ
│       │       └── computer-system-2025.md # コンピュータシステム2025（英語）
│       └── ja/               # 日本語版マークダウン
│           ├── home.md       # 日本語版ホームページ
│           ├── profilecv.md  # 日本語版プロフィール・CV
│           ├── works.md      # 日本語版仕事ページ
│           └── works/        # 日本語版業務詳細ページ
│               └── computer-system-2025.md # コンピュータシステム2025（日本語）
├── scripts/                   # ユーティリティスクリプト
│   └── convertPublications.ts # CSVからJSONへの変換スクリプト
├── src/                       # ソースコード
│   ├── App.tsx               # アプリケーションのルートコンポーネント
│   ├── index.tsx             # エントリーポイント
│   ├── __tests__/            # テストファイル (.test.tsx, .test.ts)
│   ├── components/           # 再利用可能なコンポーネント (.tsx)
│   │   ├── Footer.tsx        # フッターコンポーネント
│   │   ├── Header.tsx        # ヘッダーコンポーネント
│   │   ├── SubHeader.tsx     # サブヘッダーコンポーネント
│   │   └── publications/     # 出版物関連のコンポーネント (.tsx)
│   ├── contexts/             # Reactコンテキスト (.tsx)
│   │   └── LanguageContext.tsx # 言語コンテキスト
│   ├── data/                 # 処理済みデータ（JSON）
│   │   └── publications.json # 変換された出版物データ
│   ├── hooks/                # カスタムフック (.ts)
│   │   ├── useFilters.ts     # フィルタリング機能のフック
│   │   └── usePublications.ts # 出版物データ処理のフック
│   ├── locales/              # 多言語リソース (.ts)
│   │   ├── en.ts             # 英語リソース
│   │   ├── index.ts          # リソースのエクスポート
│   │   └── ja.ts             # 日本語リソース
│   ├── pages/                # ページコンポーネント (.tsx)
│   │   ├── Home.tsx          # ホームページ
│   │   ├── ProfileCV.tsx     # プロフィール・CVページ
│   │   ├── Publications.tsx  # 出版物ページ
│   │   ├── Works.tsx         # 仕事ページ
│   │   └── ComputerSystem2025.tsx # コンピュータシステム2025ページ
│   ├── styles/               # スタイルシート
│   │   ├── styles.css        # グローバルスタイル
│   │   └── variables.css     # CSSカスタムプロパティ
│   └── utils/                # ユーティリティ関数 (.ts)
│       ├── csvToJson.ts      # CSV→JSON変換ユーティリティ
│       └── markdownLoader.ts  # マークダウン読み込みユーティリティ
├── .gitignore                # Gitの除外ファイル設定
├── jest.config.js            # Jestの設定ファイル
├── package.json              # npm設定と依存関係
└── README.md                 # プロジェクト概要
```

## 主要コンポーネントの説明

### アプリケーション構造

- **App.tsx**: アプリケーションのルートコンポーネント。ルーティング設定、レイアウト構造、グローバルプロバイダー（MantineProvider、LanguageProvider）を定義しています。
- **index.tsx**: Reactアプリケーションのエントリーポイント。

### ページコンポーネント

- **Home.tsx**: ホームページ。マークダウンコンテンツを読み込んで表示します。
- **ProfileCV.tsx**: プロフィールと履歴書のページ。マークダウンコンテンツを読み込んで表示します。
- **Publications.tsx**: 出版物一覧ページ。出版物データの取得、フィルタリング、並び替えの状態管理を行います。
- **Works.tsx**: 仕事紹介ページ。マークダウンコンテンツを読み込んで表示します。
- **ComputerSystem2025.tsx**: コンピュータシステム2025の詳細ページ。マークダウンコンテンツを読み込んで表示します。

### 共通コンポーネント

- **Header.tsx**: サイト全体のヘッダー。ナビゲーションメニューと言語切り替えボタンを含みます。
- **SubHeader.tsx**: 各ページのタイトルを表示するベージュ帯のコンポーネント。
- **Footer.tsx**: サイト全体のフッター。著作権情報などを表示します。

### 出版物関連コンポーネント

- **PublicationsView.tsx**: 出版物一覧のUIコンポーネント。フィルターと並び替えのUIを提供します。
- **PublicationGroup.tsx**: 出版物をグループ化して表示するコンポーネント。
- **PublicationItem.tsx**: 個々の出版物項目を表示するコンポーネント。
- **FilterDropdown.tsx**: フィルタードロップダウンコンポーネント。
- **ActiveFilters.tsx**: 現在適用されているフィルターを表示するコンポーネント。

### コンテキストとフック

- **LanguageContext.tsx**: 言語設定を管理するコンテキスト。言語の切り替えと保存を担当します。
- **usePublications.ts**: 出版物データの取得、整形、並び替え、グループ化を行うカスタムフック。
- **useFilters.ts**: フィルタリング機能を提供するカスタムフック。

### ユーティリティ

- **csvToJson.ts**: CSVファイルをJSONに変換するユーティリティ関数。
- **markdownLoader.ts**: マークダウンファイルを読み込むユーティリティ関数。

## データフロー

以下の図は、出版物データの流れを示しています：

```mermaid
flowchart LR
    A[CSV Data<br>data/publication_data.csv] --> B[convertPublications.ts]
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
    C --> D[Header (.tsx)]
    C --> E[SubHeader (.tsx)]
    C --> F[Main Content]
    C --> G[Footer (.tsx)]
    F --> H[Home (.tsx)]
    F --> I[ProfileCV (.tsx)]
    F --> J[Publications (.tsx)]
    F --> P[Works (.tsx)]
    F --> Q[ComputerSystem2025 (.tsx)]
    J --> K[PublicationsView (.tsx)]
    K --> L[FilterDropdown (.tsx)]
    K --> M[ActiveFilters (.tsx)]
    K --> N[PublicationGroup (.tsx)]
    N --> O[PublicationItem (.tsx)]
```

## 多言語対応の構造

以下の図は、多言語対応の仕組みを示しています：

```mermaid
flowchart TD
    A[LanguageContext (.tsx)] --> B[useLanguage Hook (.ts)]
    B --> C[Components (.tsx)]
    D[locales/ja.ts] --> A
    E[locales/en.ts] --> A
    F[localStorage] <--> A
```

詳細な多言語対応の実装については、[多言語対応](./multilingual-support.md)のドキュメントを参照してください。