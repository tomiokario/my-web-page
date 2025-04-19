import React from "react";
import { createStyles, MantineTheme } from "@mantine/core";
import { SelectedFilters } from "../../hooks/useFilters";

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
}: ActiveFiltersProps) {
  const { classes } = useStyles();
  
  // Object.valuesの戻り値の型推論に関するエラーを解消
  const hasActiveFilters = Object.values(selectedFilters).some(
    (filters): filters is string[] => Array.isArray(filters) && filters.length > 0
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
        {/* 型アサーションを修正し、nullチェックを追加 */}
        {selectedFilters && Object.entries(selectedFilters).map(
          ([category, values]) => {
            // valuesが配列であることを確認
            if (Array.isArray(values) && values.length > 0) {
              return (
                <div key={category} className={classes.filterCategory}>
                  <span className={classes.categoryLabel}>
                    {filterLabels[category as string]}:{" "}
                  </span>
                  {values.map((value: string) => (
                    <span
                      key={value}
                      className={classes.filterTag}
                      onClick={() => onToggleFilter(category as keyof SelectedFilters, value)}
                      data-testid={`filter-tag-${category}-${value}`}
                    >
                      {value} ✕
                    </span>
                  ))}
                </div>
              );
            }
            return null;
          }
        )}
      </div>
    </div>
  );
}

export default ActiveFilters;