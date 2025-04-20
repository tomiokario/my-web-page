import React, { useState, useMemo } from "react";
import { useLanguage, LanguageContextType } from "../contexts/LanguageContext";
import usePublications from "../hooks/usePublications"; // UsePublicationsReturn は不要に
import useFilters from "../hooks/useFilters"; // UseFiltersReturn は不要に
import PublicationsView from "../components/publications/PublicationsView";
import publicationsData from "../data/publications.json"; // インポートを元に戻す

/**
 * 出版物ページのメインコンポーネント
 * データ取得と状態管理を担当し、UIレンダリングはPublicationsViewに委譲
 */
function Publications() {
  const [sortOrder, setSortOrder] = useState<"type" | "chronological">('type'); // 'chronological' または 'type'
  const { language } = useLanguage() as LanguageContextType;

  // usePublications フックを先に呼び出し、publicationsData を渡す
  const publicationsResult = usePublications({
    sortOrder,
    filteredPublications: [], // 初期呼び出しではフィルターなし
    publicationsData // インポートしたデータを渡す
  });

  // useFilters フックに publicationsResult.sortedPublications を渡す
  const filtersResult = useFilters({
    publications: publicationsResult.sortedPublications
  });

  // フィルター適用後の groupedPublications を取得 (再度 usePublications を呼び出す必要はない)
  // groupedPublications は usePublications の内部で計算されるため、
  // filtersResult.filteredPublications を usePublications に渡す必要があった以前の実装に戻す
  const { groupedPublications } = usePublications({
      sortOrder,
      filteredPublications: filtersResult.filteredPublications, // フィルター結果を渡す
      publicationsData // publicationsData も渡す
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
