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
    color: "#fff",
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
      fontSize: "0.75rem", // スマホ版のフォントサイズ（メニューと同じ）
      padding: `${rem(2)} ${rem(4)}`,
      minHeight: "auto", // 高さを自動に
      height: rem(22), // 高さを明示的に設定
      minWidth: "auto", // 最小幅を自動に
      borderWidth: 1, // ボーダーを細く
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
  const { language, toggleLanguage } = useLanguage() as LanguageContextType;
  const t = locales[language as keyof Locales]; // 現在の言語に応じたリソースを取得
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isSmallScreen = useMediaQuery("(max-width: 480px)");
  const isVerySmallScreen = useMediaQuery("(max-width: 375px)");

  // メニュー項目の定義
  // モバイル表示用に短縮されたメニュー項目ラベルを作成
  const getMenuLabel = (key: string) => {
    if (isMobile && key === 'profileCV') {
      return t.header.home === 'ホーム' ? 'プロフィール' : 'Profile';
    }
    return t.header[key as keyof typeof t.header];
  };

  const menuItems = [
    { path: "/", label: getMenuLabel('home'), exact: true },
    { path: "/profile-cv", label: getMenuLabel('profileCV') },
    { path: "/publications", label: getMenuLabel('publications') },
    { path: "/works", label: getMenuLabel('works') }
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
                padding: isMobile ? 0 : undefined, // モバイル表示ではパディングを削除
                lineHeight: 1, // 行の高さを統一
                display: 'flex',
                alignItems: 'center',
              }
            }}
            aria-label={t.languageSwitch.switchTo}
            title={t.languageSwitch.switchTo}
          >
            <Languages
              size={isMobile ? (isVerySmallScreen ? 12 : 14) : 16}
              style={{ marginRight: isVerySmallScreen ? '2px' : isMobile ? '4px' : '6px' }}
            />
            {isVerySmallScreen ?
              (language === 'ja' ? 'EN' : '日') :
              isSmallScreen ?
              (language === 'ja' ? 'EN' : '日本語') :
              (language === 'ja' ? 'EN' : '日本語')
            }
          </Button>
        </div>
      </Container>
    </Box>
  );
}

export default Header;
