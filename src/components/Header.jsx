// Header.jsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Header.css";

function Header() {
  const [isOpen, setIsOpen] = useState(false);

  // ハンバーガーメニューの開閉
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // リンククリック時にメニューを閉じる
  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <header className="header">
        {/* スマホ用ハンバーガーアイコン */}
        <div className="hamburger" onClick={toggleMenu}>
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </div>

        {/* メニュー部分：NavLink を利用し、アクティブなリンクに自動で active クラスが付与される */}
        <nav className={`nav-links ${isOpen ? "open" : ""}`}>
          <NavLink to="/" end onClick={handleLinkClick}>Home</NavLink>
          <NavLink to="/profile-cv" onClick={handleLinkClick}>Profile・CV</NavLink>
          <NavLink to="/publications" onClick={handleLinkClick}>Publications</NavLink>
        </nav>
      </header>

      {/* メニューが開いているときにオーバーレイを表示 */}
      {isOpen && <div className="overlay" onClick={toggleMenu}></div>}
    </>
  );
}

export default Header;
