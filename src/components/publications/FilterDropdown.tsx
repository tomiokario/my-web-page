import React from "react";
import { createStyles } from "@mantine/emotion";
import { MantineTheme } from "@mantine/core";
import { FilterCategory, SelectedFilters } from "../../hooks/useFilters";

// FilterDropdownPropsインターフェースを追加
interface FilterDropdownProps {
  category: keyof SelectedFilters;
  label: string;
  options: string[];
  selectedValues: string[];
  getOptionLabel?: (option: string) => string;
  isOpen: boolean;
  onToggleDropdown: (dropdown: FilterCategory | null) => void;
  onToggleFilter: (category: FilterCategory, value: string) => void;
  filterRef: (el: HTMLElement | null) => void;
}

const useStyles = createStyles((theme: MantineTheme) => ({
  filterContainer: {
    position: "relative",
  },
  filterButton: {
    boxShadow: "var(--control-shadow)",
    color: "var(--fg2)",
    fontFamily: "var(--font-sans)",
    fontSize: theme.fontSizes.sm,
    fontWeight: 500,
    padding: "0.55rem 1rem",
    border: "none",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    transition: `background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)`,
  },
  activeFilterButton: {
    backgroundColor: "var(--tag-accent-bg)",
    color: "var(--tag-accent-fg)",
    fontWeight: "bold",
  },
  inactiveFilterButton: {
    backgroundColor: "var(--card-bg)",
    fontWeight: "normal",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    zIndex: 10,
    backgroundColor: "var(--card-bg)",
    borderRadius: "var(--radius-sm)",
    padding: theme.spacing.sm,
    marginTop: theme.spacing.xs,
    minWidth: "220px",
    maxHeight: 260,
    overflowY: "auto",
    boxShadow: "var(--dropdown-shadow)",
  },
  optionContainer: {
    marginBottom: theme.spacing.xs,
  },
  optionLabel: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    color: "var(--fg1)",
    fontFamily: "var(--font-sans)",
    fontSize: theme.fontSizes.sm,
  },
  checkbox: {
    accentColor: "var(--accent)",
    marginRight: theme.spacing.xs,
  },
}));

function FilterDropdown({
  category,
  label,
  options,
  selectedValues,
  getOptionLabel,
  isOpen,
  onToggleDropdown,
  onToggleFilter,
  filterRef,
}: FilterDropdownProps) {
  const { classes, cx } = useStyles();

  return (
    <div className={classes.filterContainer} ref={filterRef}>
      <button
        onClick={() => onToggleDropdown(category)}
        className={cx(
          classes.filterButton,
          selectedValues.length > 0
            ? classes.activeFilterButton
            : classes.inactiveFilterButton
        )}
        data-testid={`${category}-filter-button`}
      >
        {label} ▼
      </button>

      {isOpen && (
        <div
          className={classes.dropdown}
          data-testid={`${category}-dropdown`}
        >
          {options.length === 0 && (
            <div className={classes.optionLabel}>—</div>
          )}
          {options.map((option) => (
            <div key={option} className={classes.optionContainer}>
              <label className={classes.optionLabel} htmlFor={`${category}-${option}`}>
                <input
                  id={`${category}-${option}`}
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => onToggleFilter(category, option)}
                  className={classes.checkbox}
                  aria-checked={selectedValues.includes(option)}
                  aria-label={getOptionLabel ? getOptionLabel(option) : option}
                />
                {getOptionLabel ? getOptionLabel(option) : option}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterDropdown;
