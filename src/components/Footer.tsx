import React from "react";
import "./Footer.css";
import useLocale from "../hooks/useLocale";
import { useTheme } from "../contexts/ThemeContext";

function Footer() {
  const t = useLocale();
  const { theme, toggleTheme } = useTheme();
  const isBlueTheme = theme === "blue";
  const themeSwitchLabel = isBlueTheme ? t.themeSwitch.switchToGray : t.themeSwitch.switchToBlue;
  const targetThemeLabel = isBlueTheme ? t.themeSwitch.currentGray : t.themeSwitch.currentBlue;

  return (
    <footer className="footer">
      <div className="footer__inner">
        <button
          type="button"
          className="footer__theme-switch"
          onClick={toggleTheme}
          aria-label={themeSwitchLabel}
          title={themeSwitchLabel}
        >
          {targetThemeLabel}
        </button>
        <p>{t.footer.copyright}</p>
      </div>
    </footer>
  );
}

export default Footer;
