import React from "react";
import "./Footer.css";
import useLocale from "../hooks/useLocale";
import ThemeToggle from "./ThemeToggle";

function Footer() {
  const t = useLocale();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <p>{t.footer.copyright}</p>
        <ThemeToggle />
      </div>
    </footer>
  );
}

export default Footer;
