import { useEffect, useMemo, useRef, useState } from "react";

import { Publication } from "../types";
import {
  collectPublicationFilterOptions,
  createEmptyPublicationFilters,
  filterPublications,
  PublicationFilterCategory,
  PublicationFilterOptions,
  PublicationFilterSelections,
} from "../utils/publicationCollections";

export type FilterCategory = PublicationFilterCategory;
export type SelectedFilters = PublicationFilterSelections;
export type FilterOptions = PublicationFilterOptions;

export interface UseFiltersReturn {
  selectedFilters: SelectedFilters;
  openDropdown: FilterCategory | null;
  filterOptions: FilterOptions;
  filteredPublications: Publication[];
  filterRefs: React.MutableRefObject<Record<FilterCategory, HTMLElement | null>>;
  toggleDropdown: (dropdown: FilterCategory | null) => void;
  toggleFilter: (category: FilterCategory, value: string) => void;
  resetFilters: () => void;
}

function useFilters({ publications }: { publications: Publication[] }): UseFiltersReturn {
  const [openDropdown, setOpenDropdown] = useState<FilterCategory | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>(
    createEmptyPublicationFilters()
  );
  const filterRefs = useRef<Record<FilterCategory, HTMLElement | null>>({
    year: null,
    authorship: null,
    type: null,
    review: null,
  });

  const filterOptions = useMemo(() => collectPublicationFilterOptions(publications), [publications]);
  const filteredPublications = useMemo(
    () => filterPublications(publications, selectedFilters),
    [publications, selectedFilters]
  );

  const toggleDropdown = (dropdown: FilterCategory | null) => {
    setOpenDropdown((currentDropdown) => (currentDropdown === dropdown ? null : dropdown));
  };

  const toggleFilter = (category: FilterCategory, value: string) => {
    setSelectedFilters((currentFilters) => ({
      ...currentFilters,
      [category]: currentFilters[category].includes(value)
        ? currentFilters[category].filter((currentValue) => currentValue !== value)
        : [...currentFilters[category], value],
    }));
  };

  const resetFilters = () => {
    setSelectedFilters(createEmptyPublicationFilters());
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!openDropdown) {
        return;
      }

      const currentFilterRef = filterRefs.current[openDropdown];
      if (currentFilterRef && !currentFilterRef.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  return {
    selectedFilters,
    openDropdown,
    filterOptions,
    filteredPublications,
    filterRefs,
    toggleDropdown,
    toggleFilter,
    resetFilters,
  };
}

export default useFilters;
