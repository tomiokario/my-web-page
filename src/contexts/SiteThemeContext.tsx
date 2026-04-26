import React, { createContext, ReactNode, useContext, useLayoutEffect, useState } from "react";

export type SiteTheme = "ice" | "classic";

interface SiteThemeContextType {
  theme: SiteTheme;
  setTheme: (theme: SiteTheme) => void;
  toggleTheme: () => void;
}

const SITE_THEME_STORAGE_KEY = "siteTheme";
const DEFAULT_SITE_THEME: SiteTheme = "ice";

const isSiteTheme = (value: string | null): value is SiteTheme =>
  value === "ice" || value === "classic";

const SiteThemeContext = createContext<SiteThemeContextType | undefined>(undefined);

export const SiteThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<SiteTheme>(() => {
    if (typeof window === "undefined") return DEFAULT_SITE_THEME;
    const savedTheme = window.localStorage.getItem(SITE_THEME_STORAGE_KEY);
    return isSiteTheme(savedTheme) ? savedTheme : DEFAULT_SITE_THEME;
  });

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(SITE_THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "ice" ? "classic" : "ice"));
  };

  return (
    <SiteThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </SiteThemeContext.Provider>
  );
};

export const useSiteTheme = () => {
  const context = useContext(SiteThemeContext);
  if (!context) {
    throw new Error("useSiteTheme must be used within a SiteThemeProvider");
  }
  return context;
};

export { DEFAULT_SITE_THEME, SITE_THEME_STORAGE_KEY };
