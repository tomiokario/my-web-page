import React from "react";
import fs from "fs";
import path from "path";
import { screen, waitFor } from "@testing-library/react";
import Home from "../pages/Home";
import Works from "../pages/Works";
import { renderWithProviders } from "../test-utils/test-utils";

const readMarkdown = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

const markdownByPath = new Map<string, string>([
  ["/markdown/ja/home.md", readMarkdown("public/markdown/ja/home.md")],
  ["/markdown/en/home.md", readMarkdown("public/markdown/en/home.md")],
  ["/markdown/ja/works.md", readMarkdown("public/markdown/ja/works.md")],
  ["/markdown/en/works.md", readMarkdown("public/markdown/en/works.md")],
]);

describe("Markdown content pages", () => {
  beforeEach(() => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      const body = markdownByPath.get(url);

      if (!body) {
        return {
          ok: false,
          text: async () => "",
        } as Response;
      }

      return {
        ok: true,
        text: async () => body,
      } as Response;
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders Japanese home content with affiliation links", async () => {
    renderWithProviders(<Home />, { initialLanguage: "ja" });

    expect(
      await screen.findByText("助教", { exact: false })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "福岡大学" })
      ).toHaveAttribute("href", "https://www.fukuoka-u.ac.jp/");
    });

    expect(
      screen.getByRole("link", { name: "工学部" })
    ).toHaveAttribute(
      "href",
      "https://www.fukuoka-u.ac.jp/education/undergraduate/engineering/"
    );

    expect(
      screen.getByRole("link", { name: "電子情報工学科" })
    ).toHaveAttribute(
      "href",
      "https://www.fukuoka-u.ac.jp/education/undergraduate/engineering/electronics_computer/"
    );
  });

  test("renders English home content with affiliation links", async () => {
    renderWithProviders(<Home />, { initialLanguage: "en" });

    expect(
      await screen.findByText("Assistant Professor", { exact: false })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("link", {
          name: "Department of Electronics Engineering and Computer Science",
        })
      ).toHaveAttribute(
        "href",
        "https://www.fukuoka-u.ac.jp/education/undergraduate/engineering/electronics_computer/"
      );
    });

    expect(
      screen.getByRole("link", { name: "Faculty of Engineering" })
    ).toHaveAttribute(
      "href",
      "https://www.fukuoka-u.ac.jp/education/undergraduate/engineering/"
    );

    expect(
      screen.getByRole("link", { name: "Fukuoka University" })
    ).toHaveAttribute("href", "https://www.fukuoka-u.ac.jp/");
  });

  test("renders Japanese works content with the current and FY2025 sections", async () => {
    renderWithProviders(<Works />, { initialLanguage: "ja" });

    expect(
      await screen.findByRole("heading", { name: "現在の業務" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "2025年度" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "こちら" })
    ).toHaveAttribute("href", "/works/computer-system-2025");
  });

  test("renders English works content with the current and FY2025 sections", async () => {
    renderWithProviders(<Works />, { initialLanguage: "en" });

    expect(
      await screen.findByRole("heading", { name: "Current works" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "FY2025" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "here" })
    ).toHaveAttribute("href", "/works/computer-system-2025");
  });
});
