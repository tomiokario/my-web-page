// Header.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { Languages } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Box,
  Group,
  Container,
} from "@mantine/core";
import { createStyles } from "@mantine/emotion";
import { useMediaQuery } from "@mantine/hooks";
import useLocale from "../hooks/useLocale";
import { navigationRoutes } from "../routes";

// remヘルパー関数の定義（Mantineのバージョンでremがエクスポートされていない場合）
const rem = (size: number) => `${size / 16}rem`;

// スタイルの定義
const useStyles = createStyles((theme) => ({
  header: {
    backgroundColor: "var(--header-bg)",
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
    display: "flex",
    alignItems: "center",
    '@media (max-width: 768px)': {
      width: "100%",
      justifyContent: "center",
      marginBottom: rem(10),
    },
  },
  wordmark: {
    display: "inline-flex",
    alignItems: "center",
    gap: rem(8),
    color: "var(--header-text)",
    fontFamily: "var(--font-sans)",
    fontSize: rem(16),
    fontWeight: 700,
    letterSpacing: "0.02em",
    lineHeight: 1,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  wordmarkAccent: {
    width: rem(9),
    height: rem(9),
    borderRadius: "var(--radius-xs)",
    backgroundColor: "var(--accent-soft)",
  },
  wordmarkGiven: {
    fontWeight: 400,
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
      flexWrap: "nowrap", // 折り返しを防止
    },
  },
  languageButtonContainer: {
    marginLeft: theme.spacing.md, // PC版でメニューとボタンの間に空白を追加
    '@media (max-width: 768px)': {
      marginLeft: theme.spacing.xs, // スマホ版では余白を小さく
      display: 'flex',
      alignItems: 'center',
    },
  },
  navLink: {
    display: "block",
    lineHeight: 1,
    padding: `${rem(8)} ${rem(12)}`,
    borderRadius: theme.radius.sm,
    textDecoration: "none",
    color: "var(--header-text)",
    fontSize: "0.85rem", // smとxsの中間サイズ
    fontWeight: 400,
    '@media (max-width: 768px)': {
      padding: `${rem(5)} ${rem(5)}`, // 左右のパディングを減らす
      fontSize: "0.75rem", // さらに小さいフォントサイズ
      whiteSpace: "nowrap", // テキストの折り返しを防止
    },
    '@media (max-width: 480px)': {
      padding: `${rem(3)} ${rem(3)}`, // さらにパディングを減らす
      fontSize: "0.7rem", // 超小型画面用のフォントサイズ
    },
    "&:hover": {
      color: "var(--header-text)",
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
      backgroundColor: "var(--accent-soft)",
    },
    '@media (max-width: 768px)': {
      "&::after": {
        bottom: -6,
        height: 3,
      },
    },
  },
  languageButton: {
    alignItems: "center",
    backgroundColor: "var(--header-control-bg)",
    border: "none",
    color: "var(--header-text)",
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "var(--font-sans)",
    fontWeight: 400,
    gap: rem(6),
    lineHeight: 1,
    padding: `${rem(6)} ${rem(10)}`,
    minWidth: "auto",
    height: "auto",
    fontSize: theme.fontSizes.sm, // PC版のフォントサイズ
    borderRadius: theme.radius.md,
    transition: `background-color var(--dur-fast) var(--ease-out), opacity var(--dur-fast) var(--ease-out)`,
    "&:hover": {
      backgroundColor: "var(--header-control-hover-bg)",
    },
    '@media (max-width: 768px)': {
      fontSize: "0.75rem", // スマホ版のフォントサイズ（メニューと同じ）
      padding: `${rem(2)} ${rem(4)}`,
      minHeight: "auto", // 高さを自動に
      height: rem(22), // 高さを明示的に設定
      minWidth: "auto", // 最小幅を自動に
      gap: rem(4),
    },
    '@media (max-width: 480px)': {
      padding: `${rem(1)} ${rem(3)}`,
      fontSize: "0.7rem", // 超小型画面用のフォントサイズ
      height: rem(20), // さらに高さを小さく
    },
  },
}));

function Header() {
  const { classes, cx } = useStyles();
  const { language, toggleLanguage } = useLanguage();
  const t = useLocale();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isSmallScreen = useMediaQuery("(max-width: 480px)");
  const isVerySmallScreen = useMediaQuery("(max-width: 375px)");

  const menuItems = navigationRoutes.map((route) => {
    const labelKey =
      isMobile && route.mobileNavLabelKey ? route.mobileNavLabelKey : route.navLabelKey;

    return {
      path: route.path,
      label: t.header[labelKey],
      exact: route.path === "/",
    };
  });

  return (
    <Box className={classes.header} style={{ height: isMobile ? "auto" : 57 }}>
      <Container className={classes.container} fluid>
        {/* ロゴ部分 */}
        <div className={classes.logoContainer}>
          <div className={classes.wordmark} aria-label="TOMIOKA Rio">
            <span className={classes.wordmarkAccent} aria-hidden="true" />
            <span>
              TOMIOKA <span className={classes.wordmarkGiven}>Rio</span>
            </span>
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
          <button
            type="button"
            onClick={toggleLanguage}
            className={classes.languageButton}
            aria-label={t.languageSwitch.switchTo}
            title={t.languageSwitch.switchTo}
          >
            <Languages
              size={isMobile ? (isVerySmallScreen ? 12 : 14) : 16}
              aria-hidden="true"
            />
            {isVerySmallScreen ?
              (language === 'ja' ? 'EN' : '日') :
              isSmallScreen ?
              (language === 'ja' ? 'EN' : '日本語') :
              (language === 'ja' ? 'EN' : '日本語')
            }
          </button>
        </div>
      </Container>
    </Box>
  );
}

export default Header;
