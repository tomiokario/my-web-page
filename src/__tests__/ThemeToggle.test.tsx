import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LanguageProvider } from "../contexts/LanguageContext";
import {
  SITE_THEME_STORAGE_KEY,
  SiteThemeProvider,
} from "../contexts/SiteThemeContext";
import Footer from "../components/Footer";
import locales from "../locales";
import { render } from "../test-utils/render";

const renderFooter = () =>
  render(
    <LanguageProvider>
      <SiteThemeProvider>
        <Footer />
      </SiteThemeProvider>
    </LanguageProvider>
  );

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  test("uses ice theme by default", async () => {
    renderFooter();

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "ice");
    });
    expect(window.localStorage.getItem(SITE_THEME_STORAGE_KEY)).toBe("ice");
    expect(
      screen.getByRole("button", { name: locales.ja.themeSwitch.switchToClassic })
    ).toBeInTheDocument();
  });

  test("switches to classic theme and stores the preference", async () => {
    renderFooter();

    fireEvent.click(
      screen.getByRole("button", { name: locales.ja.themeSwitch.switchToClassic })
    );

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "classic");
    });
    expect(window.localStorage.getItem(SITE_THEME_STORAGE_KEY)).toBe("classic");
    expect(
      screen.getByRole("button", { name: locales.ja.themeSwitch.switchToIce })
    ).toBeInTheDocument();
  });

  test("restores saved classic theme on reload", async () => {
    window.localStorage.setItem(SITE_THEME_STORAGE_KEY, "classic");

    renderFooter();

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "classic");
    });
    expect(
      screen.getByRole("button", { name: locales.ja.themeSwitch.switchToIce })
    ).toBeInTheDocument();
  });
});
