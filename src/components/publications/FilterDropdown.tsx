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
    padding: "0.5rem 1rem",
    border: "1px solid var(--border)",
    borderRadius: theme.radius.sm,
    cursor: "pointer",
    color: "var(--control-fg)",
    transition: "background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)",
    "&:hover": {
      backgroundColor: "var(--control-hover-bg)",
      borderColor: "var(--border-strong)",
    },
  },
  activeFilterButton: {
    backgroundColor: "var(--control-active-bg)",
    color: "var(--control-active-fg)",
    borderColor: "var(--accent-soft)",
    fontWeight: "bold",
  },
  inactiveFilterButton: {
    backgroundColor: "var(--control-bg)",
    fontWeight: "normal",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    zIndex: 10,
    backgroundColor: "var(--surface)",
    color: "var(--fg-secondary)",
    border: "1px solid var(--border-strong)",
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    minWidth: "200px",
    boxShadow: "var(--shadow-dropdown)",
  },
  optionContainer: {
    marginBottom: theme.spacing.xs,
  },
  optionLabel: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    color: "var(--fg-secondary)",
    "&:hover": {
      color: "var(--link-hover)",
    },
  },
  checkbox: {
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
