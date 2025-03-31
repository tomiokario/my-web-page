// Header.jsx
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, Languages } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import locales from "../locales";
import "./Header.css";

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const t = locales[language]; // 現在の言語に応じたリソースを取得

  // メニュー項目の定義
  const menuItems = [
    { path: "/", label: t.header.home, exact: true },
    { path: "/profile-cv", label: t.header.profileCV },
    { path: "/publications", label: t.header.publications }
  ];

  // 画面幅に応じてモバイル表示かどうかを判定
  useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenWidth();
    window.addEventListener('resize', checkScreenWidth);
    
    return () => {
      window.removeEventListener('resize', checkScreenWidth);
    };
  }, []);

  // メニューを開閉する関数
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // リンクをクリックしたときにメニューを閉じる
  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <div className="header-container">
      <header className="header">
        <div className="header-content">
          {/* モバイル用ハンバーガーメニューボタン（左側に配置） */}
          {isMobile && (
            <button
              onClick={toggleMenu}
              className="hamburger-button"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          )}

          {/* ロゴ部分 */}
          <div className="logo">
          </div>

          {/* PC・タブレット用メニュー */}
          {!isMobile && (
            <nav className="nav-links desktop">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  onClick={handleLinkClick}
                  className={({ isActive }) => isActive ? "active" : ""}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* 言語切り替えボタン */}
          <button
            onClick={toggleLanguage}
            className="language-switch-button"
            aria-label={t.languageSwitch.switchTo}
            title={t.languageSwitch.switchTo}
          >
            <Languages size={20} />
            <span className="language-code">{language === 'ja' ? 'EN' : '日本語'}</span>
          </button>

          {/* 右側のスペース確保（バランス用） */}
          {isMobile && <div className="spacer"></div>}
        </div>
      </header>

      {/* モバイル用サイドメニュー */}
      {isMobile && isOpen && (
        <>
          {/* オーバーレイ（半透明の黒色） */}
          <div
            className="overlay"
            onClick={toggleMenu}
          />
          
          {/* サイドメニュー */}
          <div className="side-menu">
            <div className="side-menu-header">
              <button
                onClick={toggleMenu}
                className="close-button"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>
            
            <nav className="side-menu-content">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  onClick={handleLinkClick}
                  className={({ isActive }) => isActive ? "active" : ""}
                >
                  {item.label}
                </NavLink>
              ))}
              
              {/* モバイル用言語切り替えボタン */}
              <button
                onClick={toggleLanguage}
                className="language-switch-button mobile"
                aria-label={t.languageSwitch.switchTo}
              >
                <Languages size={20} />
                <span>{t.languageSwitch.switchTo}</span>
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}

export default Header;
