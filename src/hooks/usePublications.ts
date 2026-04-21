import { useMemo } from "react";

import { Publication } from "../types";
import {
  extractPublicationYear,
  normalizePublicationRecord,
  PublicationSortOrder,
  sortPublications,
} from "../utils/publicationCollections";

type PublicationSource = Publication | Record<string, unknown>;

export interface UsePublicationsReturn {
  formattedPublications: Publication[];
  sortedPublications: Publication[];
  extractYear: typeof extractPublicationYear;
}

function usePublications({
  sortOrder,
  publicationsData,
}: {
  sortOrder: PublicationSortOrder;
  publicationsData: PublicationSource[];
}): UsePublicationsReturn {
  const formattedPublications = useMemo(
    () =>
      publicationsData.map((publication, index) =>
        normalizePublicationRecord(publication as Record<string, unknown>, index)
      ),
    [publicationsData]
  );

  const sortedPublications = useMemo(
    () => sortPublications(formattedPublications, sortOrder),
    [formattedPublications, sortOrder]
  );

  return {
    formattedPublications,
    sortedPublications,
    extractYear: extractPublicationYear,
  };
}

export default usePublications;
