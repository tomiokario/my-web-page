// Header.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { Languages } from "lucide-react";
import { useLanguage, LanguageContextType } from "../contexts/LanguageContext";
import locales, { Locales } from "../locales";
import {
  Header as MantineHeader,
  Group,
  Container,
  Button,
  createStyles,
  MantineTheme,
} from "@mantine/core";
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
  },
  container: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
    [theme.fn.smallerThan("sm")]: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingTop: rem(8),
      paddingBottom: rem(8),
      height: "auto",
    },
  },
  logoContainer: {
    [theme.fn.smallerThan("sm")]: {
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
    [theme.fn.smallerThan("sm")]: {
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
    [theme.fn.smallerThan("sm")]: {
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
    fontSize: theme.fontSizes.sm,
    fontWeight: 500,
    [theme.fn.smallerThan("sm")]: {
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
    [theme.fn.smallerThan("sm")]: {
      "&::after": {
        bottom: -6,
        height: 3,
      },
    },
  },
  languageButton: {
    backgroundColor: "transparent",
    border: "1px solid #fff",
    color: "#fff",
    padding: `${rem(4)} ${rem(8)}`,
    minWidth: "auto",
    height: "auto",
    fontSize: theme.fontSizes.sm, // PC版のフォントサイズ
    [theme.fn.smallerThan("sm")]: {
      fontSize: theme.fontSizes.xs, // スマホ版のフォントサイズ（メニューと同じ）
    },
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
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
    <MantineHeader height={isMobile ? "auto" : 57} className={classes.header}>
      <Container className={classes.container} fluid>
        {/* ロゴ部分 */}
        <div className={classes.logoContainer}>
          <div className="logo">
          </div>
        </div>

        {/* ナビゲーションリンク */}
        <Group className={classes.links} spacing={5}>
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
            aria-label={t.languageSwitch.switchTo}
            title={t.languageSwitch.switchTo}
            leftIcon={<Languages size={20} />}
          >
            {language === 'ja' ? 'EN' : '日本語'}
          </Button>
        </div>
      </Container>
    </MantineHeader>
  );
}

export default Header;
