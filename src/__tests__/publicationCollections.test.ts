import {
  collectPublicationFilterOptions,
  groupPublications,
  normalizePublicationRecord,
} from "../utils/publicationCollections";
import { createPublication } from "../test-utils/factories/publicationFactory";

describe("publicationCollections", () => {
  it("raw publication data を表示用 Publication に正規化する", () => {
    const publication = normalizePublicationRecord(
      {
        id: "7",
        name: "Example",
        japanese: "例",
        date: "2024年3月1日",
        authorship: ["Lead author"],
        "journal / conference": "Venue",
        DOI: "10.1000/example",
        Review: "Peer-reviewed",
      },
      0
    );

    expect(publication).toMatchObject({
      id: 7,
      name: "Example",
      japanese: "例",
      year: 2024,
      authorship: ["Lead author"],
      journalConference: "Venue",
      doi: "10.1000/example",
      review: "Peer-reviewed",
    });
  });

  it("opaque な文字列 ID は部分的に数値化せず fallback index を使う", () => {
    const publication = normalizePublicationRecord(
      {
        id: "pub-7",
        name: "Opaque ID Example",
        japanese: "識別子の例",
        date: "2024年4月1日",
      },
      3
    );

    expect(publication.id).toBe(3);
  });

  it("フィルターオプションを重複なく仕様順に集める", () => {
    const options = collectPublicationFilterOptions([
      createPublication({
        year: 2022,
        authorship: ["lead", "coauthor"],
        type: "misc/summary_national_conference",
        review: "not_peer_reviewed",
      }, 0),
      createPublication({
        year: 2024,
        authorship: "corresponding",
        type: "published_papers/scientific_journal",
        review: "peer_reviewed",
      }, 1),
      createPublication({
        year: 2023,
        authorship: "lead",
        type: "presentations/poster_presentation",
        review: "peer_reviewed",
      }, 2),
    ]);

    expect(options.year).toEqual(["2024", "2023", "2022"]);
    expect(options.authorship).toEqual(["corresponding", "lead", "coauthor"]);
    expect(options.type).toEqual([
      "published_papers/scientific_journal",
      "misc/summary_national_conference",
      "presentations/poster_presentation",
    ]);
    expect(options.review).toEqual(["peer_reviewed", "not_peer_reviewed"]);
  });

  it("種類順と年別でグループを作る", () => {
    const publications = [
      createPublication({ type: "Journal paper：原著論文", year: 2024 }, 0),
      createPublication({ type: "Research paper (international conference)：国際会議", year: 2023 }, 1),
      createPublication({ type: "Journal paper：原著論文", year: 2022 }, 2),
    ];

    const groupedByType = groupPublications(publications, "type");
    expect(groupedByType[0]).toMatchObject({
      name: "Journal paper：原著論文",
      items: expect.arrayContaining([publications[0], publications[2]]),
    });
    expect(groupedByType[1]).toMatchObject({
      name: "Research paper (international conference)：国際会議",
      items: [publications[1]],
    });

    const groupedByYear = groupPublications(publications, "chronological");
    expect(groupedByYear[0]).toMatchObject({
      name: "2024",
      items: [publications[0]],
    });
    expect(groupedByYear[1]).toMatchObject({
      name: "2023",
      items: [publications[1]],
    });
  });
});
