// src/components/SubHeader.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import "./SubHeader.css";

function SubHeader() {
  const location = useLocation();

  let pageName = "";
  switch (location.pathname) {
    case "/":
      pageName = "冨岡 莉生 (TOMIOKA Rio)";
      break;
    case "/profile-cv":
      pageName = "Profile & Curriculum Vitae (CV)";
      break;
    case "/publications":
      pageName = "Publications";
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
