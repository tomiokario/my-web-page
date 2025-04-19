import React from "react";
import { createStyles, MantineTheme } from "@mantine/core";
import { SelectedFilters } from "../../hooks/useFilters";

// FilterDropdownPropsインターフェースを追加
interface FilterDropdownProps {
  category: keyof SelectedFilters;
  label: string;
  options: string[];
  selectedValues: string[];
  isOpen: boolean;
  onToggleDropdown: (dropdown: string | null) => void;
  onToggleFilter: (category: keyof SelectedFilters, value: string) => void;
  filterRef: (el: HTMLElement | null) => void;
}

const useStyles = createStyles((theme: MantineTheme) => ({
  filterContainer: {
    position: "relative",
  },
  filterButton: {
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: theme.radius.sm,
    cursor: "pointer",
  },
  activeFilterButton: {
    backgroundColor: theme.colors.blue[1],
    fontWeight: "bold",
  },
  inactiveFilterButton: {
    backgroundColor: theme.colors.gray[1],
    fontWeight: "normal",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    zIndex: 10,
    backgroundColor: "white",
    border: `1px solid ${theme.colors.gray[3]}`,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    minWidth: "200px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
  },
  optionContainer: {
    marginBottom: theme.spacing.xs / 2,
  },
  optionLabel: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
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
                  role="checkbox"
                  aria-checked={selectedValues.includes(option)}
                  aria-label={option}
                />
                {option}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterDropdown;