import React, { useState, useMemo } from "react";
import { useLanguage, LanguageContextType } from "../contexts/LanguageContext";
import usePublications, { UsePublicationsReturn } from "../hooks/usePublications";
import useFilters, { UseFiltersReturn } from "../hooks/useFilters";
import PublicationsView from "../components/publications/PublicationsView";

/**
 * 出版物ページのメインコンポーネント
 * データ取得と状態管理を担当し、UIレンダリングはPublicationsViewに委譲
 */
function Publications() {
  const [sortOrder, setSortOrder] = useState<"type" | "chronological">('type'); // 'chronological' または 'type'
  const { language } = useLanguage() as LanguageContextType;

  // 出版物関連のカスタムフック - 最初に呼び出して基本データを取得
  const publicationsResult = usePublications({
    sortOrder,
    filteredPublications: []
  });

  // フィルター関連のカスタムフック
  const filtersResult = useFilters({
    publications: publicationsResult.sortedPublications
  });

  // フィルター適用後の出版物データを取得
  const { groupedPublications } = usePublications({
    sortOrder,
    filteredPublications: filtersResult.filteredPublications
  });

  // 並び順変更ハンドラー
  const handleSortOrderChange = (newSortOrder: "type" | "chronological") => {
    setSortOrder(newSortOrder);
  };

  return (
    <PublicationsView
      sortOrder={sortOrder}
      onSortOrderChange={handleSortOrderChange}
      selectedFilters={filtersResult.selectedFilters}
      openDropdown={filtersResult.openDropdown}
      filterOptions={filtersResult.filterOptions}
      groupedPublications={groupedPublications}
      filterRefs={filtersResult.filterRefs}
      toggleDropdown={filtersResult.toggleDropdown}
      toggleFilter={filtersResult.toggleFilter}
      resetFilters={filtersResult.resetFilters}
      language={language}
    />
  );
}

export default Publications;
