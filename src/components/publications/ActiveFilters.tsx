import React from "react";
import { createStyles } from "@mantine/emotion";
import { MantineTheme } from "@mantine/core";
import useFilters, { SelectedFilters } from "../../hooks/useFilters";

interface ActiveFiltersProps {
  selectedFilters: SelectedFilters;
  filterLabels: { [key: string]: string };
  onToggleFilter: (category: keyof SelectedFilters, value: string) => void;
  onResetFilters: () => void;
  resetLabel: string;
}

// スタイルの型定義 (MantineのcreateStylesの型)
type ActiveFiltersStyles = Record<string, any>; // Record<string, CSSProperties | ((theme: MantineTheme) => CSSProperties)>

const useStyles = createStyles((theme: MantineTheme): ActiveFiltersStyles => ({
  activeFiltersContainer: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  filterCategory: {
    marginBottom: theme.spacing.xs,
  },
  categoryLabel: {
    fontWeight: "bold",
  },
  filterTag: {
    backgroundColor: theme.colors.gray[2],
    padding: `${theme.spacing.xs} ${theme.spacing.xs}`,
    borderRadius: theme.radius.sm,
    fontSize: theme.fontSizes.xs,
    marginRight: theme.spacing.xs,
    cursor: "pointer",
    display: "inline-block",
    marginBottom: theme.spacing.xs,
  },
  resetButton: {
    padding: "0.5rem 1rem",
    backgroundColor: theme.colors.gray[1],
    border: "none",
    borderRadius: theme.radius.sm,
    cursor: "pointer",
    marginBottom: theme.spacing.sm,
  },
}));

function ActiveFilters({
  selectedFilters,
  filterLabels,
  onToggleFilter,
  onResetFilters,
  resetLabel,
}: ActiveFiltersProps) {
  const { classes } = useStyles();
  const hasActiveFilters = Object.values(selectedFilters)
    .some((filters): filters is string[] => Array.isArray(filters) && filters.length > 0);

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
        {(Object.entries(selectedFilters) as [keyof SelectedFilters, string[]][]).map(
          ([category, values]: [keyof SelectedFilters, string[]]) =>
            values.length > 0 && (
              <div key={category} className={classes.filterCategory}>
                <span className={classes.categoryLabel}>
                  {filterLabels[category]}:{" "}
                </span>
                {values.map((value: string) => (
                  <span
                    key={value}
                    className={classes.filterTag}
                    onClick={() => onToggleFilter(category, value)}
                    data-testid={`filter-tag-${category}-${value}`}
                  >
                    {value} ✕
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