# サイト設定ガイド

このドキュメントでは、Webサイトの基本設定と構成について説明します。

## サイトの基本情報

### メタデータ（public/index.html）

サイトのタイトルや説明などのメタデータは`public/index.html`で設定されています：

```html
<title>Tomio Kario - Personal Website</title>
<meta name="description" content="Personal website of Tomio Kario" />
```

### ファビコン

ファビコンは`public/favicon.ico`に配置されています。変更する場合は同じファイル名で置き換えてください。

## ナビゲーション設定

### メインメニュー（src/components/Header.tsx）

サイトのメインナビゲーションメニューの項目：

- Home - ホームページ
- Profile/CV - プロフィールと経歴
- Publications - 出版物リスト
- Works - 作品・プロジェクト

新しいメニュー項目を追加する場合は、技術者の協力が必要です。

## ページ構成

### 現在のページ一覧

1. **ホーム（/）**
   - コンテンツ: `public/markdown/[言語]/home.md`
   - 自己紹介と概要

2. **プロフィール・CV（/profilecv）**
   - コンテンツ: `public/markdown/[言語]/profilecv.md`
   - 詳細な経歴と資格

3. **出版物（/publications）**
   - データソース: `src/data/publications.json`
   - フィルタリング機能付きのリスト表示

4. **作品（/works）**
   - コンテンツ: `public/markdown/[言語]/works.md`
   - プロジェクトとポートフォリオ

5. **個別作品ページ（/works/[作品名]）**
   - 例: `/works/computer-system-2025`
   - コンテンツ: `public/markdown/[言語]/works/[作品名].md`

## スタイルとテーマ

### カラーテーマ

サイトは[Mantine](https://mantine.dev/)のデフォルトテーマを使用しています。

### レスポンシブデザイン

- デスクトップ（1024px以上）
- タブレット（768px〜1023px）
- モバイル（767px以下）

## 言語設定

### デフォルト言語

デフォルト言語は日本語（ja）に設定されています。

### 対応言語

- 日本語（ja）
- 英語（en）

言語の切り替えはヘッダーの言語選択ボタンから行えます。

## 外部サービス連携

### Google Analytics（設定する場合）

1. `public/index.html`にトラッキングコードを追加
2. 環境変数でトラッキングIDを管理（推奨）

### ソーシャルメディア

現在、以下のリンクが設定されています：
- GitHub
- LinkedIn
- その他（必要に応じて追加）

## パフォーマンス最適化

### 画像の最適化

- 推奨フォーマット: WebP、JPEG（写真）、PNG（図表）
- 最大幅: 1920px
- 適切な圧縮率を使用

### コンテンツの最適化

- Markdownファイルは簡潔に
- 不要な大きなファイルは避ける
- 外部リソースは最小限に

## バックアップとリストア

### バックアップ対象

定期的にバックアップすべきファイル：

1. `public/markdown/` - すべてのコンテンツ
2. `src/data/` - 出版物データ
3. `public/images/` - 画像ファイル

### バックアップ方法

```bash
# バックアップの作成例
tar -czf backup_$(date +%Y%m%d).tar.gz \
  public/markdown/ \
  src/data/ \
  public/images/
```

### リストア方法

```bash
# バックアップからのリストア例
tar -xzf backup_20240101.tar.gz
```

## 環境変数

環境変数は`.env`ファイルで管理します（本番環境ではVercelの環境変数設定を使用）：

```env
# 例
REACT_APP_API_URL=https://api.example.com
REACT_APP_GA_ID=UA-XXXXXXXX-X
```

**注意**: `.env`ファイルはGitにコミットしないでください。

## トラブルシューティング

### よくある問題と解決方法

1. **ページが404エラーになる**
   - ルーティング設定を確認
   - Markdownファイルのパスを確認

2. **スタイルが崩れる**
   - CSSのインポートを確認
   - Mantineのバージョンを確認

3. **言語切り替えが機能しない**
   - 両言語のファイルが存在するか確認
   - LanguageContextの設定を確認

## 関連ドキュメント

- [多言語コンテンツ管理](./multilingual-content-management.md)
- [デプロイメント手順](./deployment-guide.md)
- [技術仕様](../technical/project-structure.md)