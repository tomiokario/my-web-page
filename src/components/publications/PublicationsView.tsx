import React from "react";
import { MantineTheme } from "@mantine/core";
import { createStyles } from "@mantine/emotion";

import { SelectedFilters, FilterCategory } from "../../hooks/useFilters";
import { Language } from "../../types";
import {
  getPublicationAuthorshipLabel,
  getPublicationReviewLabel,
  getPublicationTypeLabel,
} from "../../utils/publicationLabels";
import {
  PUBLICATION_FILTER_CATEGORIES,
  PublicationFilterLabels,
  PublicationFilterOptions,
  PublicationGroup,
  PublicationSortOrder,
} from "../../utils/publicationCollections";
import ActiveFilters from "./ActiveFilters";
import FilterDropdown from "./FilterDropdown";
import PublicationGroupView from "./PublicationGroup";

interface PublicationsViewProps {
  sortOrder: PublicationSortOrder;
  onSortOrderChange: (newSortOrder: PublicationSortOrder) => void;
  selectedFilters: SelectedFilters;
  openDropdown: FilterCategory | null;
  filterOptions: PublicationFilterOptions;
  groupedPublications: PublicationGroup[];
  filterRefs: React.MutableRefObject<Record<FilterCategory, HTMLElement | null>>;
  toggleDropdown: (dropdown: FilterCategory | null) => void;
  toggleFilter: (category: FilterCategory, value: string) => void;
  resetFilters: () => void;
  language: Language;
}

const useStyles = createStyles((theme: MantineTheme) => ({
  container: {
    maxWidth: "100%",
    minWidth: 0,
    padding: 0,
  },
  sortOrderContainer: {
    marginBottom: theme.spacing.md,
    maxWidth: "100%",
    minWidth: 0,
  },
  sortOrderSelect: {
    background: "var(--card-bg)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    boxShadow: "var(--control-shadow)",
    color: "var(--accent-text)",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    fontSize: theme.fontSizes.sm,
    fontWeight: 600,
    maxWidth: "100%",
    padding: "0.5rem 0.875rem",
  },
  filterButtonsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    maxWidth: "100%",
    minWidth: 0,
  },
  publicationsContainer: {
    marginTop: theme.spacing.md,
    maxWidth: "100%",
    minWidth: 0,
  },
}));

function getFilterValueLabel(category: FilterCategory, value: string, language: Language): string {
  if (category === "type") {
    return getPublicationTypeLabel(value, language);
  }

  if (category === "review") {
    return getPublicationReviewLabel(value, language);
  }

  if (category === "authorship") {
    return getPublicationAuthorshipLabel(value, language);
  }

  return value;
}

function PublicationsView({
  sortOrder,
  onSortOrderChange,
  selectedFilters,
  openDropdown,
  filterOptions,
  groupedPublications,
  filterRefs,
  toggleDropdown,
  toggleFilter,
  resetFilters,
  language,
}: PublicationsViewProps) {
  const { classes } = useStyles();
  const filterLabels: PublicationFilterLabels = {
    year: language === "ja" ? "出版年" : "Year",
    authorship: language === "ja" ? "著者の役割" : "Authorship",
    type: language === "ja" ? "種類" : "Type",
    review: language === "ja" ? "レビュー" : "Review",
  };
  const resetLabel = language === "ja" ? "フィルターをリセット" : "Reset Filters";
  const yearBasedLabel = language === "ja" ? "年別に表示" : "By year";
  const typeBasedLabel = language === "ja" ? "種類別に表示" : "By type";

  return (
    <div className={classes.container}>
      <div className={classes.sortOrderContainer}>
        <select
          id="sortOrder"
          value={sortOrder}
          onChange={(event) =>
            onSortOrderChange(event.target.value as PublicationSortOrder)
          }
          className={classes.sortOrderSelect}
          data-testid="sort-order-select"
        >
          <option value="type">{typeBasedLabel}</option>
          <option value="chronological">{yearBasedLabel}</option>
        </select>
      </div>

      <div className={classes.filterButtonsContainer}>
        {PUBLICATION_FILTER_CATEGORIES.map((category) => (
          <FilterDropdown
            key={category}
            category={category}
            label={filterLabels[category]}
            options={filterOptions[category]}
            selectedValues={selectedFilters[category]}
            getOptionLabel={(option) => getFilterValueLabel(category, option, language)}
            isOpen={openDropdown === category}
            onToggleDropdown={toggleDropdown}
            onToggleFilter={toggleFilter}
            filterRef={(element: HTMLElement | null) => {
              filterRefs.current[category] = element;
            }}
          />
        ))}
      </div>

      <ActiveFilters
        selectedFilters={selectedFilters}
        filterLabels={filterLabels}
        getValueLabel={(category, value) => getFilterValueLabel(category, value, language)}
        onToggleFilter={toggleFilter}
        onResetFilters={resetFilters}
        resetLabel={resetLabel}
      />

      <div className={classes.publicationsContainer}>
        {groupedPublications.map((group) => (
          <PublicationGroupView
            key={group.name}
            name={sortOrder === "type" ? getPublicationTypeLabel(group.name, language) : group.name}
            items={group.items}
            language={language}
          />
        ))}
      </div>
    </div>
  );
}

export default PublicationsView;
