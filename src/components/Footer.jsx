import React from "react";
import { useLanguage } from "../contexts/LanguageContext";
import locales from "../locales";
import "./Footer.css";

function Footer() {
  const { language } = useLanguage();
  const t = locales[language]; // 現在の言語に応じたリソースを取得

  return (
    <footer className="footer">
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}> {/* コンテンツを左右の中央に揃える */}
        <p>{t.footer.copyright}</p>
      </div>
    </footer>
  );
}

export default Footer;
