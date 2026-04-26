import React from "react";
import { Settings } from "lucide-react";
import { useSiteTheme } from "../contexts/SiteThemeContext";
import useLocale from "../hooks/useLocale";

function ThemeToggle() {
  const { theme, toggleTheme } = useSiteTheme();
  const t = useLocale();
  const isIceTheme = theme === "ice";
  const label = isIceTheme ? t.themeSwitch.switchToClassic : t.themeSwitch.switchToIce;

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <Settings aria-hidden="true" size={14} strokeWidth={1.8} />
      <span>{isIceTheme ? t.themeSwitch.classicShort : t.themeSwitch.iceShort}</span>
    </button>
  );
}

export default ThemeToggle;
