// src/components/SubHeader.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import locales from "../locales";
import "./SubHeader.css";

function SubHeader() {
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
    <div className="subheader">
      <h2>{pageName}</h2>
    </div>
  );
}

export default SubHeader;
