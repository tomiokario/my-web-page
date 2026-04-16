import React from "react";

import PublicationAdmin from "../pages/PublicationAdmin";
import { renderWithProviders, screen, userEvent, waitFor } from "../test-utils/test-utils";

jest.mock("../data/publication_master.json", () => ([
  {
    id: "pub-2024-alpha",
    researchmapFields: {
      type: "published_papers",
      subtype: "scientific_journal",
      paper_title: {
        en: "Alpha Paper",
        ja: "アルファ論文",
      },
      authors: {
        en: [{ name: "Rio Tomioka" }],
      },
      publication_name: {
        en: "Journal A",
      },
      publication_date: "2024-01-01",
    },
    localMeta: {
      hasEmptyFields: false,
      rawCitation: {
        en: "Alpha citation",
      },
      notes: "Alpha note",
      legacyHints: {
        authorship: ["Lead author"],
        presentationType: ["Oral"],
      },
    },
  },
]));

describe("PublicationAdmin", () => {
  beforeAll(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    Object.defineProperty(window, "ResizeObserver", {
      writable: true,
      value: ResizeObserverMock,
    });
    Object.defineProperty(global, "ResizeObserver", {
      writable: true,
      value: ResizeObserverMock,
    });
  });

  afterEach(() => {
    delete (window as Window & { showOpenFilePicker?: unknown }).showOpenFilePicker;
  });

  test("renders the mocked master data and keeps save disabled before a file is opened", () => {
    renderWithProviders(<PublicationAdmin />);

    expect(screen.getByText("アルファ論文")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Alpha note")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "JSON に保存" })
    ).toBeDisabled();
  });

  test("loads a local master file through the File System Access API", async () => {
    const pickerRecords = [
      {
        id: "pub-2025-beta",
        researchmapFields: {
          type: "misc",
          subtype: "others",
          paper_title: {
            en: "Beta Paper",
          },
          publication_name: {
            en: "Conference B",
          },
          publication_date: "2025-02-01",
        },
        localMeta: {
          hasEmptyFields: true,
          rawCitation: {
            en: "Beta citation",
          },
          notes: "Loaded note",
        },
      },
    ];

    (window as Window & { showOpenFilePicker?: unknown }).showOpenFilePicker = jest
      .fn()
      .mockResolvedValue([
        {
          name: "publication_master.json",
          getFile: jest.fn().mockResolvedValue({
            name: "publication_master.json",
            text: jest.fn().mockResolvedValue(JSON.stringify(pickerRecords)),
          }),
          createWritable: jest.fn(),
        },
      ]);

    renderWithProviders(<PublicationAdmin />);

    await userEvent.click(screen.getByRole("button", { name: "master JSON を開く" }));

    expect(await screen.findByText("Beta Paper")).toBeInTheDocument();
    expect(await screen.findByLabelText("localMeta.notes")).toHaveValue("Loaded note");
    expect(screen.getByText("master data を読み込みました。")).toBeInTheDocument();
  });

  test("writes edited content back to the selected JSON file", async () => {
    const write = jest.fn().mockResolvedValue(undefined);
    const close = jest.fn().mockResolvedValue(undefined);

    (window as Window & { showOpenFilePicker?: unknown }).showOpenFilePicker = jest
      .fn()
      .mockResolvedValue([
        {
          name: "publication_master.json",
          getFile: jest.fn().mockResolvedValue({
            name: "publication_master.json",
            text: jest.fn().mockResolvedValue(
              JSON.stringify([
                {
                  id: "pub-2025-gamma",
                  researchmapFields: {
                    type: "presentations",
                    subtype: "oral_presentation",
                    presentation_title: {
                      en: "Gamma Talk",
                    },
                    event: {
                      en: "Event C",
                    },
                    publication_date: "2025-03-01",
                  },
                  localMeta: {
                    hasEmptyFields: false,
                    rawCitation: {
                      en: "Gamma citation",
                    },
                    notes: "Before save",
                  },
                },
              ])
            ),
          }),
          createWritable: jest.fn().mockResolvedValue({ write, close }),
        },
      ]);

    renderWithProviders(<PublicationAdmin />);

    await userEvent.click(screen.getByRole("button", { name: "master JSON を開く" }));

    const notesField = await screen.findByDisplayValue("Before save");
    await userEvent.clear(notesField);
    await userEvent.type(notesField, "After save");
    await userEvent.click(screen.getByRole("button", { name: "JSON に保存" }));

    await waitFor(() => {
      expect(write).toHaveBeenCalled();
    });
    expect(close).toHaveBeenCalled();
    expect(write.mock.calls[0][0]).toContain("After save");
  });
});
