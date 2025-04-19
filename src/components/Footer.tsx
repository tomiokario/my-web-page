import React from "react";
import { useLanguage, LanguageContextType } from "../contexts/LanguageContext";
import locales, { Locales } from "../locales";
import "./Footer.css";

function Footer() {
  const { language } = useLanguage() as LanguageContextType;
  const t: Locales[keyof Locales] = locales[language as keyof Locales]; // 現在の言語に応じたリソースを取得

  return (
    <footer className="footer">
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}> {/* コンテンツを左右の中央に揃える */}
        <p>{t.footer.copyright}</p>
      </div>
    </footer>
  );
}

export default Footer;
