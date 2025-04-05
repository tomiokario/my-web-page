import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import PublicationGroup from "../components/publications/PublicationGroup";
import FilterDropdown from "../components/publications/FilterDropdown";
import ActiveFilters from "../components/publications/ActiveFilters";
import usePublications from "../hooks/usePublications";
import useFilters from "../hooks/useFilters";


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

  // 言語に応じたラベル
  const filterLabels = {
    year: language === 'ja' ? '年度' : 'Year',
    authorship: language === 'ja' ? '著者の役割' : 'Authorship',
    type: language === 'ja' ? '種類' : 'Type',
    review: language === 'ja' ? 'レビュー' : 'Review',
    presentationType: language === 'ja' ? '発表タイプ' : 'Presentation Type'
  };
  const resetLabel = language === 'ja' ? 'フィルターをリセット' : 'Reset Filters';
  const yearBasedLabel = language === 'ja' ? '年で表示' : 'By year';
  const typeBasedLabel = language === 'ja' ? '種類で表示' : 'By type';


  return (
    <div style={{ padding: "0" }}>
      {/* 並び順選択 */}
      <div style={{ marginBottom: "1rem" }}>
        <select
          id="sortOrder"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{
            padding: "0.5rem",
            borderRadius: "0.25rem",
            border: "1px solid #ccc"
          }}
        >
          <option value="type">{typeBasedLabel}</option>
          <option value="chronological">{yearBasedLabel}</option>
        </select>
      </div>

      {/* フィルターボタン */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        {Object.entries(filterLabels).map(([category, label]) => (
          <FilterDropdown
            key={category}
            category={category}
            label={label}
            options={filterOptions[category]}
            selectedValues={selectedFilters[category]}
            isOpen={openDropdown === category}
            onToggleDropdown={toggleDropdown}
            onToggleFilter={toggleFilter}
            filterRef={el => filterRefs.current[category] = el}
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
      <div style={{ marginTop: "1rem" }}>
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

export default Publications;
