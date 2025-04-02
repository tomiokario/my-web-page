// src/components/SubHeader.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import locales from "../locales";
import { Box, Title, createStyles } from "@mantine/core";

// スタイルの定義
const useStyles = createStyles((theme) => ({
  subheader: {
    backgroundColor: "#f4f4f4",
    textAlign: "center",
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  title: {
    margin: 0,
    fontWeight: 600,
    fontSize: theme.fontSizes.xl,
    color: "#1c1c1c",
    [theme.fn.smallerThan("sm")]: {
      fontSize: theme.fontSizes.lg,
    },
  },
}));

function SubHeader() {
  const { classes } = useStyles();
  const location = useLocation();
  const { language } = useLanguage();
  const t = locales[language]; // 現在の言語に応じたリソースを取得

  let pageName = "";
  switch (location.pathname) {
    case "/":
      pageName = t.subheader.home;
      break;
    case "/profile-cv":
      pageName = t.subheader.profileCV;
      break;
    case "/publications":
      pageName = t.subheader.publications;
      break;
    default:
      pageName = "";
  }

  // ページ名が無ければサブヘッダー自体を表示しない例
  if (!pageName) return null;

  return (
    <Box className={classes.subheader}>
      <Title order={2} className={classes.title}>{pageName}</Title>
    </Box>
  );
}

export default SubHeader;
