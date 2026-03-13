import React from "react";
import "./Footer.css";
import useLocale from "../hooks/useLocale";

function Footer() {
  const t = useLocale();

  return (
    <footer className="footer">
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}> {/* コンテンツを左右の中央に揃える */}
        <p>{t.footer.copyright}</p>
      </div>
    </footer>
  );
}

export default Footer;
