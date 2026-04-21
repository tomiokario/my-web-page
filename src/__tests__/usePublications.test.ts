import { renderHook } from "@testing-library/react";

import usePublications from "../hooks/usePublications";
import mockPublications from "../data/__mocks__/publications.json";
import { createPublication } from "../test-utils/factories/publicationFactory";

describe("usePublications", () => {
  describe("extractYear", () => {
    it("日付文字列から年を正しく抽出する", () => {
      const { result } = renderHook(() =>
        usePublications({
          sortOrder: "type",
          publicationsData: mockPublications,
        })
      );

      expect(result.current.extractYear("2022年10月1日")).toBe(2022);
      expect(result.current.extractYear("2021年5月15日 → 2021年5月20日")).toBe(2021);
      expect(result.current.extractYear(null)).toBeNull();
      expect(result.current.extractYear("")).toBeNull();
      expect(result.current.extractYear("No date")).toBeNull();
    });
  });

  describe("formattedPublications", () => {
    it("出版物データを正しく整形する", () => {
      const { result } = renderHook(() =>
        usePublications({
          sortOrder: "type",
          publicationsData: mockPublications,
        })
      );

      expect(result.current.formattedPublications).toHaveLength(5);
      expect(result.current.formattedPublications[0].year).toBe(2023);
      expect(result.current.formattedPublications[1].year).toBe(2022);
      expect(result.current.formattedPublications[2].year).toBe(2023);
      expect(result.current.formattedPublications[3].year).toBe(2022);
      expect(result.current.formattedPublications[4].year).toBe(2022);
    });

    it("camelCase と legacy キーの両方を表示用フィールドに反映する", () => {
      const publicationsData = [
        {
          id: 42,
          name: "Real JSON entry",
          japanese: "",
          type: "Journal paper：原著論文",
          review: "Reviewed",
          authorship: "Lead author",
          presentationType: "Oral",
          doi: "https://doi.org/10.1000/example",
          webLink: "https://example.com/paper",
          date: "2025年6月21日",
          startDate: "2025-06-21",
          endDate: "2025-06-21",
          sortableDate: "2025-06-21",
          others: "SharedIt link",
          site: "Tokyo",
          journalConference: "Optical Review",
          "journal / conference": "Legacy venue",
          "web link": "https://legacy.example.com/paper",
          DOI: "10.1000/legacy",
          Review: "Legacy review",
          Authorship: ["First author"],
          "Presentation type": ["Poster"],
          Others: "Legacy shared link",
        },
      ];

      const { result } = renderHook(() =>
        usePublications({
          sortOrder: "type",
          publicationsData,
        })
      );

      expect(result.current.formattedPublications[0]).toMatchObject({
        id: 42,
        doi: "https://doi.org/10.1000/example",
        webLink: "https://example.com/paper",
        journalConference: "Optical Review",
        authorship: "Lead author",
        presentationType: "Oral",
        review: "Reviewed",
        others: "SharedIt link",
      });
    });

    it("legacy-only キーでも表示用フィールドへ fallback する", () => {
      const publicationsData = [
        {
          id: "43",
          name: "Legacy JSON entry",
          japanese: "",
          type: "Research paper (international conference)：国際会議",
          date: "2025年7月1日",
          "journal / conference": "Legacy venue",
          "web link": "https://legacy.example.com/paper",
          DOI: "10.1000/legacy-only",
          Review: "Legacy review",
          Authorship: ["First author"],
          "Presentation type": ["Poster"],
          Others: "Legacy shared link",
        },
      ];

      const { result } = renderHook(() =>
        usePublications({
          sortOrder: "type",
          publicationsData,
        })
      );

      expect(result.current.formattedPublications[0]).toMatchObject({
        id: 43,
        journalConference: "Legacy venue",
        webLink: "https://legacy.example.com/paper",
        doi: "10.1000/legacy-only",
        review: "Legacy review",
        authorship: ["First author"],
        presentationType: ["Poster"],
        others: "Legacy shared link",
      });
    });
  });

  describe("sortedPublications", () => {
    it("種類順で正しくソートする", () => {
      const { result } = renderHook(() =>
        usePublications({
          sortOrder: "type",
          publicationsData: mockPublications,
        })
      );

      expect(result.current.sortedPublications[0].type).toBe("Journal paper：原著論文");
      expect(result.current.sortedPublications[1].type).toBe("Journal paper：原著論文");
      expect(result.current.sortedPublications[2].type).toBe("Invited paper：招待論文");
      expect(result.current.sortedPublications[3].type).toBe(
        "Research paper (international conference)：国際会議"
      );
      expect(result.current.sortedPublications[4].type).toBe(
        "Research paper (domestic conference)：国内会議"
      );
    });

    it("時系列順で正しくソートする", () => {
      const { result } = renderHook(() =>
        usePublications({
          sortOrder: "chronological",
          publicationsData: mockPublications,
        })
      );

      expect(result.current.sortedPublications[0].sortableDate).toBe("20231001");
      expect(result.current.sortedPublications[1].sortableDate).toBe("20230310");
      expect(result.current.sortedPublications[2].sortableDate).toBe("20221120");
      expect(result.current.sortedPublications[3].sortableDate).toBe("20220805");
      expect(result.current.sortedPublications[4].sortableDate).toBe("20220515");
    });

    it("raw データを整形した後に並び順を変えても崩れない", () => {
      const publicationsData = [
        createPublication(
          {
            id: 1,
            type: "Journal paper：原著論文",
            date: "2024年1月1日",
            sortableDate: "2024-01-01",
          },
          0
        ),
        createPublication(
          {
            id: 2,
            type: "Research paper (international conference)：国際会議",
            date: "2023年1月1日",
            sortableDate: "2023-01-01",
          },
          1
        ),
      ];

      const { result, rerender } = renderHook(
        ({ order }) =>
          usePublications({
            sortOrder: order,
            publicationsData,
          }),
        {
          initialProps: { order: "type" as const },
        }
      );

      expect(result.current.sortedPublications[0].type).toBe("Journal paper：原著論文");

      rerender({ order: "chronological" });

      expect(result.current.sortedPublications[0].sortableDate).toBe("2024-01-01");
    });
  });
});
