import React from "react";
import { createStyles } from "@mantine/emotion";
import { MantineTheme } from "@mantine/core";
import PublicationGroup from "./PublicationGroup";
import FilterDropdown from "./FilterDropdown";
import ActiveFilters from "./ActiveFilters";
import { SelectedFilters } from "../../hooks/useFilters";
import { Publication } from "../../types";

// PublicationsViewPropsインターフェースを追加
interface PublicationsViewProps {
  sortOrder: "type" | "chronological";
  onSortOrderChange: (newSortOrder: "type" | "chronological") => void;
  selectedFilters: SelectedFilters;
  openDropdown: string | null;
  filterOptions: {
    year: string[];
    authorship: string[];
    type: string[];
    review: string[];
    presentationType: string[];
  };
  groupedPublications: Array<{
    name: string;
    items: Publication[];
  }>;
  filterRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  toggleDropdown: (dropdown: string | null) => void;
  toggleFilter: (category: keyof SelectedFilters, value: string) => void;
  resetFilters: () => void;
  language: string;
}

const useStyles = createStyles((theme: MantineTheme) => ({
  container: {
    padding: 0,
  },
  sortOrderContainer: {
    marginBottom: theme.spacing.md,
  },
  sortOrderSelect: {
    padding: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.gray[4]}`,
  },
  filterButtonsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  publicationsContainer: {
    marginTop: theme.spacing.md,
  },
}));

/**
 * 出版物一覧の表示コンポーネント
 * UIレンダリングのみを担当し、データ処理ロジックは含まない
 */
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

  // 言語に応じたラベル
  const filterLabels = {
    year: language === 'ja' ? '出版年' : 'Year',
    authorship: language === 'ja' ? '著者の役割' : 'Authorship',
    type: language === 'ja' ? '種類' : 'Type',
    review: language === 'ja' ? 'レビュー' : 'Review',
    presentationType: language === 'ja' ? '発表タイプ' : 'Presentation Type'
  };
  const resetLabel = language === 'ja' ? 'フィルターをリセット' : 'Reset Filters';
  const yearBasedLabel = language === 'ja' ? '年別に表示' : 'By year';
  const typeBasedLabel = language === 'ja' ? '種類別に表示' : 'By type';

  return (
    <div className={classes.container}>
      {/* 並び順選択 */}
      <div className={classes.sortOrderContainer}>
        <select
          id="sortOrder"
          value={sortOrder}
          onChange={(e) => onSortOrderChange(e.target.value as "type" | "chronological")}
          className={classes.sortOrderSelect}
          data-testid="sort-order-select"
        >
          <option value="type">{typeBasedLabel}</option>
          <option value="chronological">{yearBasedLabel}</option>
        </select>
      </div>

      {/* フィルターボタン */}
      <div className={classes.filterButtonsContainer}>
        {Object.entries(filterLabels).map(([category, label]) => (
          <FilterDropdown
            key={category}
            category={category as keyof SelectedFilters}
            label={label}
            options={filterOptions[category as keyof typeof filterOptions]}
            selectedValues={selectedFilters[category as keyof SelectedFilters]}
            isOpen={openDropdown === category}
            onToggleDropdown={toggleDropdown}
            onToggleFilter={toggleFilter}
            filterRef={(el: HTMLElement | null) => filterRefs.current[category] = el}
          />
        ))}
      </div>
      
      {/* アクティブフィルターの表示 */}
      <ActiveFilters
        selectedFilters={selectedFilters}
        filterLabels={filterLabels}
        onToggleFilter={toggleFilter}
        onResetFilters={resetFilters}
        resetLabel={resetLabel}
      />

      {/* グループ化された出版物リスト */}
      <div className={classes.publicationsContainer}>
        {groupedPublications.map((group, groupIndex) => (
          <PublicationGroup
            key={groupIndex}
            name={group.name}
            items={group.items}
            language={language}
          />
        ))}
      </div>
    </div>
  );
}

export default PublicationsView;