# ディレクトリ構成

```
my-react-site/
  ├─ public/
  │   ├─ manifest.json    # PWA用（スマートフォン等でホーム画面に追加した際のアイコンやUI等）の設定
  │   ├─ index.html
  │   └─ markdown/        # Markdownコンテンツファイル
  │       ├─ home.md      # ホームページのコンテンツ
  │       └─ profilecv.md # プロフィール・CV用のコンテンツ
  ├─ src/
  │   ├─ components/
  │   │   ├─ Header.jsx
  │   │   ├─ Header.css
  │   │   ├─ Footer.jsx
  │   │   ├─ Footer.css
  │   │   ├─ Sidebar.jsx
  │   │   └─ Sidebar.css
  │   ├─ pages/
  │   │   ├─ Home.jsx     # Markdownを読み込んで表示するコンポーネント
  │   │   ├─ ProfileCV.jsx # Markdownを読み込んで表示するコンポーネント
  │   │   └─ Publications.jsx
  │   ├─ data/
  │   │   └─ publications.json
  │   ├─ styles/
  │   │   ├─ styles.css
  │   │   └─ variables.css
  │   ├─ utils/
  │   │   └─ markdownLoader.js # Markdownファイルを読み込むユーティリティ
  │   ├─ App.jsx
  │   └─ index.js
  └─ package.json
```