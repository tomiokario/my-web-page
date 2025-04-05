import React from "react";
import { createStyles } from "@mantine/core";

const useStyles = createStyles((theme) => ({
  activeFiltersContainer: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  filterCategory: {
    marginBottom: theme.spacing.xs / 2,
  },
  categoryLabel: {
    fontWeight: "bold",
  },
  filterTag: {
    backgroundColor: theme.colors.gray[2],
    padding: `${theme.spacing.xs / 4}px ${theme.spacing.xs}px`,
    borderRadius: theme.radius.sm,
    fontSize: theme.fontSizes.xs,
    marginRight: theme.spacing.xs,
    cursor: "pointer",
    display: "inline-block",
    marginBottom: theme.spacing.xs / 2,
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
}) {
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
        {Object.entries(selectedFilters).map(
          ([category, values]) =>
            values.length > 0 && (
              <div key={category} className={classes.filterCategory}>
                <span className={classes.categoryLabel}>
                  {filterLabels[category]}:{" "}
                </span>
                {values.map((value) => (
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