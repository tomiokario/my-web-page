// src/components/SubHeader.jsx
import React from "react";
import { useLocation, Location } from "react-router-dom";
import { Box } from "@mantine/core";
import { createStyles } from "@mantine/emotion";
import useLocale from "../hooks/useLocale";
import { findRouteByPath } from "../routes";


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
  const t = useLocale();
  const matchedRoute = findRouteByPath(location.pathname);
  const pageName = matchedRoute?.titleKey ? t.subheader[matchedRoute.titleKey] : "";

  // ページ名が無ければサブヘッダー自体を表示しない例
  if (!pageName) return null;

  return (
    <Box className={classes.subheader}>
      <h2 className={classes.title} style={{ fontWeight: 700 }}>{pageName}</h2>
    </Box>
  );
}

export default SubHeader;
