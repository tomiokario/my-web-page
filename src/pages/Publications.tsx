import React, { useMemo, useState } from "react";

import PublicationsView from "../components/publications/PublicationsView";
import { LanguageContextType, useLanguage } from "../contexts/LanguageContext";
import useFilters from "../hooks/useFilters";
import publicationsData from "../data/publications.json";
import usePublications from "../hooks/usePublications";
import {
  groupPublications,
  PublicationSortOrder,
} from "../utils/publicationCollections";

function Publications() {
  const [sortOrder, setSortOrder] = useState<PublicationSortOrder>("type");
  const { language } = useLanguage() as LanguageContextType;
  const { sortedPublications } = usePublications({
    sortOrder,
    publicationsData,
  });
  const filtersResult = useFilters({
    publications: sortedPublications,
  });
  const groupedPublications = useMemo(
    () => groupPublications(filtersResult.filteredPublications, sortOrder),
    [filtersResult.filteredPublications, sortOrder]
  );

  return (
    <PublicationsView
      sortOrder={sortOrder}
      onSortOrderChange={setSortOrder}
      selectedFilters={filtersResult.selectedFilters}
      openDropdown={filtersResult.openDropdown}
      filterOptions={filtersResult.filterOptions}
      groupedPublications={groupedPublications}
      filterRefs={filtersResult.filterRefs}
      toggleDropdown={filtersResult.toggleDropdown}
      toggleFilter={filtersResult.toggleFilter}
      resetFilters={filtersResult.resetFilters}
      language={language}
    />
  );
}

export default Publications;
