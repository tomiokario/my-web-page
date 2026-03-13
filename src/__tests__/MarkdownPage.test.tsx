import React from "react";
import { screen, waitFor } from "@testing-library/react";
import MarkdownPage from "../components/MarkdownPage";
import { renderWithProviders } from "../test-utils/test-utils";
import { loadMarkdown } from "../utils/markdownLoader";

jest.mock("../utils/markdownLoader", () => ({
  loadMarkdown: jest.fn(),
}));

const mockedLoadMarkdown = loadMarkdown as jest.MockedFunction<typeof loadMarkdown>;

describe("MarkdownPage", () => {
  beforeEach(() => {
    mockedLoadMarkdown.mockReset();
    mockedLoadMarkdown.mockResolvedValue("# Loaded content");
  });

  test("loads markdown with the current language and renders it", async () => {
    renderWithProviders(<MarkdownPage markdownPath="/markdown/home.md" />, {
      initialLanguage: "en",
    });

    await waitFor(() => {
      expect(mockedLoadMarkdown).toHaveBeenCalledWith("/markdown/home.md", "en");
    });

    expect(
      await screen.findByRole("heading", { name: "Loaded content" })
    ).toBeInTheDocument();
  });

  test("renders footer content below the markdown body", async () => {
    renderWithProviders(
      <MarkdownPage
        markdownPath="/markdown/works/computer-system-2025.md"
        footer={<button type="button">Extra footer action</button>}
      />
    );

    expect(
      await screen.findByRole("button", { name: "Extra footer action" })
    ).toBeInTheDocument();
  });
});
