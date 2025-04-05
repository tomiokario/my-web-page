import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import usePublications from "../hooks/usePublications";
import useFilters from "../hooks/useFilters";
import PublicationsView from "../components/publications/PublicationsView";

/**
 * 出版物ページのメインコンポーネント
 * データ取得と状態管理を担当し、UIレンダリングはPublicationsViewに委譲
 */
function Publications() {
  const [sortOrder, setSortOrder] = useState('type'); // 'chronological' または 'type'
  const { language } = useLanguage();

  // フィルター関連のカスタムフック
  const {
    selectedFilters,
    openDropdown,
    filterOptions,
    filteredPublications,
    filterRefs,
    toggleDropdown,
    toggleFilter,
    resetFilters
  } = useFilters({
    publications: usePublications({ sortOrder, filteredPublications: [] }).sortedPublications
  });

  // 出版物関連のカスタムフック
  const { groupedPublications } = usePublications({
    sortOrder,
    filteredPublications
  });

  // 並び順変更ハンドラー
  const handleSortOrderChange = (newSortOrder) => {
    setSortOrder(newSortOrder);
  };

  return (
    <PublicationsView
      sortOrder={sortOrder}
      onSortOrderChange={handleSortOrderChange}
      selectedFilters={selectedFilters}
      openDropdown={openDropdown}
      filterOptions={filterOptions}
      groupedPublications={groupedPublications}
      filterRefs={filterRefs}
      toggleDropdown={toggleDropdown}
      toggleFilter={toggleFilter}
      resetFilters={resetFilters}
      language={language}
    />
  );
}

export default Publications;
