// src/components/SubHeader.jsx
import React from "react";
import { useLocation, Location } from "react-router-dom";
import { useLanguage, LanguageContextType } from "../contexts/LanguageContext";
import locales, { Locales } from "../locales";
import { Box, Title } from "@mantine/core";
import { createStyles } from "@mantine/emotion";
import { MantineTheme } from "@mantine/core";

// スタイルの定義
const useStyles = createStyles((theme) => ({
  subheader: {
    backgroundColor: "#f4f4f4",
    textAlign: "center",
    padding: theme.spacing.md, // 中くらいのパディング
    marginBottom: theme.spacing.lg, // 中くらいのマージン
  },
  title: {
    margin: 0,
    fontWeight: 700, // ボールド（太字）に変更
    fontSize: theme.fontSizes.lg, // 元のサイズに近づける
    color: "#1c1c1c",
    '@media (max-width: 768px)': {
      fontSize: theme.fontSizes.md, // 元のサイズに近づける
    },
  },
}));

function SubHeader() {
  const { classes } = useStyles();
  const location: Location = useLocation();
  const { language } = useLanguage() as LanguageContextType;
  const t: Locales[keyof Locales] = locales[language as keyof Locales]; // 現在の言語に応じたリソースを取得

  let pageName = "";
  // パスの最初の部分を取得（例：/works/computer-system-2025 → /works）
  const basePath = '/' + location.pathname.split('/')[1];
  
  switch (basePath) {
    case "/":
      pageName = t.subheader.home;
      break;
    case "/profile-cv":
      pageName = t.subheader.profileCV;
      break;
    case "/publications":
      pageName = t.subheader.publications;
      break;
    case "/works":
      // /works/xxx の形式かどうかをチェック
      if (location.pathname.split('/').length > 2) {
        // 特定のパスに対して特別なタイトルを表示
        if (location.pathname === "/works/computer-system-2025") {
          pageName = t.subheader.computerSystem2025;
        } else {
          // その他の詳細ページには一般的なタイトルを表示
          pageName = t.subheader.works;
        }
      } else {
        pageName = t.subheader.works;
      }
      break;
    default:
      pageName = "";
  }

  // ページ名が無ければサブヘッダー自体を表示しない例
  if (!pageName) return null;

  return (
    <Box className={classes.subheader}>
      <h2 className={classes.title} style={{ fontWeight: 700 }}>{pageName}</h2>
    </Box>
  );
}

export default SubHeader;
