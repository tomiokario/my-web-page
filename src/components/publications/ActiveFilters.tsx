import React from "react";
import { MantineTheme } from "@mantine/core";
import { createStyles } from "@mantine/emotion";

import { FilterCategory, SelectedFilters } from "../../hooks/useFilters";
import { PublicationFilterLabels } from "../../utils/publicationCollections";

interface ActiveFiltersProps {
  selectedFilters: SelectedFilters;
  filterLabels: PublicationFilterLabels;
  getValueLabel?: (category: FilterCategory, value: string) => string;
  onToggleFilter: (category: FilterCategory, value: string) => void;
  onResetFilters: () => void;
  resetLabel: string;
}

const useStyles = createStyles((theme: MantineTheme) => ({
  activeFiltersContainer: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  filterCategory: {
    marginBottom: theme.spacing.xs,
  },
  categoryLabel: {
    fontWeight: "bold",
    color: "var(--fg-secondary)",
  },
  filterTag: {
    backgroundColor: "var(--tag-accent-bg)",
    color: "var(--tag-accent-fg)",
    padding: `${theme.spacing.xs} ${theme.spacing.xs}`,
    borderRadius: theme.radius.sm,
    fontSize: theme.fontSizes.xs,
    marginRight: theme.spacing.xs,
    cursor: "pointer",
    display: "inline-block",
    marginBottom: theme.spacing.xs,
    lineHeight: 1,
    transition: "background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)",
    "&:hover": {
      backgroundColor: "var(--accent-soft)",
      color: "var(--fg-primary)",
    },
  },
  resetButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "var(--control-bg)",
    color: "var(--control-fg)",
    border: "1px solid var(--border)",
    borderRadius: theme.radius.sm,
    cursor: "pointer",
    marginBottom: theme.spacing.sm,
    transition: "background-color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)",
    "&:hover": {
      backgroundColor: "var(--control-hover-bg)",
      borderColor: "var(--border-strong)",
    },
  },
}));

function ActiveFilters({
  selectedFilters,
  filterLabels,
  getValueLabel,
  onToggleFilter,
  onResetFilters,
  resetLabel,
}: ActiveFiltersProps) {
  const { classes } = useStyles();
  const hasActiveFilters = Object.values(selectedFilters).some(
    (filters) => filters.length > 0
  );

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div>
      <button
        onClick={onResetFilters}
        className={classes.resetButton}
        data-testid="reset-filters-button"
      >
        {resetLabel}
      </button>

      <div className={classes.activeFiltersContainer} data-testid="active-filters">
        {(Object.entries(selectedFilters) as [FilterCategory, string[]][]).map(
          ([category, values]) =>
            values.length > 0 && (
              <div key={category} className={classes.filterCategory}>
                <span className={classes.categoryLabel}>{filterLabels[category]}: </span>
                {values.map((value) => (
                  <span
                    key={value}
                    className={classes.filterTag}
                    onClick={() => onToggleFilter(category, value)}
                    data-testid={`filter-tag-${category}-${value}`}
                  >
                    {getValueLabel ? getValueLabel(category, value) : value} ✕
                  </span>
                ))}
              </div>
            )
        )}
      </div>
    </div>
  );
}

export default ActiveFilters;
