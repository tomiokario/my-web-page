// Header.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { Languages } from "lucide-react";
import { useLanguage, LanguageContextType } from "../contexts/LanguageContext";
import locales, { Locales } from "../locales";
import {
  Box,
  Group,
  Container,
  Button,
  MantineTheme,
} from "@mantine/core";
import { createStyles } from "@mantine/emotion";
import { useMediaQuery } from "@mantine/hooks";

// remヘルパー関数の定義（Mantineのバージョンでremがエクスポートされていない場合）
const rem = (size: number) => `${size / 16}rem`;

// スタイルの定義
const useStyles = createStyles((theme) => ({
  header: {
    backgroundColor: "#3c3c3c",
    borderBottom: 0,
    position: "relative",
    zIndex: 1,
    height: "auto",
  },
  container: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
    '@media (max-width: 768px)': {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingTop: rem(8),
      paddingBottom: rem(8),
      height: "auto",
    },
  },
  logoContainer: {
    '@media (max-width: 768px)': {
      width: "100%",
      textAlign: "center",
      marginBottom: rem(10),
    },
  },
  links: {
    display: "flex",
    gap: theme.spacing.md,
    // PC版では右寄せ
    marginLeft: "auto",
    '@media (max-width: 768px)': {
      gap: theme.spacing.xs,
      // スマホ版では中央揃え
      marginLeft: 0,
      justifyContent: "center",
      flex: 1,
      order: 1,
    },
  },
  languageButtonContainer: {
    marginLeft: theme.spacing.md, // PC版でメニューとボタンの間に空白を追加
    '@media (max-width: 768px)': {
      order: 2,
      marginLeft: 0, // スマホ版では余白を削除
    },
  },
  navLink: {
    display: "block",
    lineHeight: 1,
    padding: `${rem(8)} ${rem(12)}`,
    borderRadius: theme.radius.sm,
    textDecoration: "none",
    color: "#fff",
    fontSize: "0.85rem", // smとxsの中間サイズ
    fontWeight: 400,
    '@media (max-width: 768px)': {
      padding: `${rem(6)} ${rem(8)}`,
      fontSize: theme.fontSizes.xs,
    },
    "&:hover": {
      opacity: 0.8,
    },
  },
  navLinkActive: {
    position: "relative",
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: -8,
      left: 0,
      width: "100%",
      height: 4,
      backgroundColor: "#f4f4f4",
    },
    '@media (max-width: 768px)': {
      "&::after": {
        bottom: -6,
        height: 3,
      },
    },
  },
  languageButton: {
    padding: `${rem(6)} ${rem(10)}`,
    minWidth: "auto",
    height: "auto",
    fontSize: theme.fontSizes.sm, // PC版のフォントサイズ
    borderRadius: theme.radius.md,
    '@media (max-width: 768px)': {
      fontSize: theme.fontSizes.xs, // スマホ版のフォントサイズ（メニューと同じ）
      padding: `${rem(4)} ${rem(8)}`,
    },
  },
}));

function Header() {
  const { classes, cx } = useStyles();
  const { language, toggleLanguage } = useLanguage() as LanguageContextType;
  const t = locales[language as keyof Locales]; // 現在の言語に応じたリソースを取得
  const isMobile = useMediaQuery("(max-width: 768px)");

  // メニュー項目の定義
  const menuItems = [
    { path: "/", label: t.header.home, exact: true },
    { path: "/profile-cv", label: t.header.profileCV },
    { path: "/publications", label: t.header.publications },
    { path: "/works", label: t.header.works }
  ];

  return (
    <Box className={classes.header} style={{ height: isMobile ? "auto" : 57 }}>
      <Container className={classes.container} fluid>
        {/* ロゴ部分 */}
        <div className={classes.logoContainer}>
          <div className="logo">
          </div>
        </div>

        {/* ナビゲーションリンク */}
        <Group className={classes.links}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                cx(classes.navLink, { [classes.navLinkActive]: isActive })
              }
            >
              {item.label}
            </NavLink>
          ))}
        </Group>

        {/* 言語切り替えボタン */}
        <div className={classes.languageButtonContainer}>
          <Button
            onClick={toggleLanguage}
            className={classes.languageButton}
            variant="outline"
            styles={{
              root: {
                backgroundColor: "#3c3c3c",
                borderColor: "#fff",
                color: "#fff",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontWeight: 400,
                "&:hover": {
                  backgroundColor: "#4c4c4c",
                  borderColor: "#fff",
                }
              },
              label: {
                fontFamily: "'Noto Sans JP', sans-serif",
                fontWeight: 400,
              }
            }}
            aria-label={t.languageSwitch.switchTo}
            title={t.languageSwitch.switchTo}
          >
            <Languages size={16} style={{ marginRight: '6px' }} />
            {language === 'ja' ? 'EN' : '日本語'}
          </Button>
        </div>
      </Container>
    </Box>
  );
}

export default Header;
