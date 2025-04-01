import React, { useState, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import publicationsData from "../data/publications.json";

function Publications() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    year: [],
    authorship: [],
    type: [],
    review: [],
    presentationType: []
  });
  const { language } = useLanguage();

  // 日付から年を抽出する関数
  const extractYear = (dateString) => {
    if (!dateString) return null;
    // 日付文字列から年を抽出（例: "2021年10月3日 → 2021年10月6日" から "2021"を抽出）
    const match = dateString.match(/(\d{4})/);
    return match ? parseInt(match[1], 10) : null;
  };

  // 出版物データを最小限の整形で処理
  const formattedPublications = useMemo(() => {
    return publicationsData.map((pub, index) => {
      // 年度を抽出（フィルタリングに必要）
      const year = extractYear(pub.date);

      // 必要最小限のプロパティのみを返す
      return {
        id: index,
        name: pub.name,
        japanese: pub.japanese,
        year: year,
        journal: pub.journalConference,
        date: pub.date,
        webLink: pub.webLink,
        doi: pub.doi,
        type: pub.type,
        review: pub.review,
        authorship: pub.authorship,
        presentationType: pub.presentationType,
        others: pub.others
      };
    });
  }, []);

  // 利用可能なフィルターオプションを抽出
  const filterOptions = useMemo(() => {
    const options = {
      year: [],
      authorship: [],
      type: [],
      review: [],
      presentationType: []
    };
    
    formattedPublications.forEach(pub => {
      if (pub.year && !options.year.includes(pub.year.toString())) {
        options.year.push(pub.year.toString());
      }
      if (pub.authorship && !options.authorship.includes(pub.authorship)) {
        options.authorship.push(pub.authorship);
      }
      if (pub.type && !options.type.includes(pub.type)) {
        options.type.push(pub.type);
      }
      if (pub.review && !options.review.includes(pub.review)) {
        options.review.push(pub.review);
      }
      if (pub.presentationType && !options.presentationType.includes(pub.presentationType)) {
        options.presentationType.push(pub.presentationType);
      }
    });
    
    return options;
  }, [formattedPublications]);
  
  // フィルタリング
  const filteredPublications = useMemo(() => {
    return formattedPublications.filter((pub) => {
      // 年度フィルター
      if (selectedFilters.year.length > 0 && !selectedFilters.year.includes(pub.year?.toString())) {
        return false;
      }
      
      // 著者の役割フィルター
      if (selectedFilters.authorship.length > 0 && !selectedFilters.authorship.includes(pub.authorship)) {
        return false;
      }
      
      // タイプフィルター
      if (selectedFilters.type.length > 0 && !selectedFilters.type.includes(pub.type)) {
        return false;
      }
      
      // レビューフィルター
      if (selectedFilters.review.length > 0 && !selectedFilters.review.includes(pub.review)) {
        return false;
      }
      
      // 発表タイプフィルター
      if (selectedFilters.presentationType.length > 0 && !selectedFilters.presentationType.includes(pub.presentationType)) {
        return false;
      }
      
      return true;
    });
  }, [formattedPublications, selectedFilters]);

  // ドロップダウンを開く/閉じる処理
  const toggleDropdown = (dropdown) => {
    if (openDropdown === dropdown) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(dropdown);
    }
  };

  // フィルターを選択/解除する処理
  const toggleFilter = (category, value) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      if (newFilters[category].includes(value)) {
        // すでに選択されている場合は削除
        newFilters[category] = newFilters[category].filter(v => v !== value);
      } else {
        // 選択されていない場合は追加
        newFilters[category] = [...newFilters[category], value];
      }
      return newFilters;
    });
  };

  // フィルターをリセットする処理
  const resetFilters = () => {
    setSelectedFilters({
      year: [],
      authorship: [],
      type: [],
      review: [],
      presentationType: []
    });
  };

  // フィルターが選択されているかどうか
  const hasActiveFilters = Object.values(selectedFilters).some(filters => filters.length > 0);

  // 言語に応じたラベル
  const filterLabels = {
    year: language === 'ja' ? '年度' : 'Year',
    authorship: language === 'ja' ? '著者の役割' : 'Authorship',
    type: language === 'ja' ? '種類' : 'Type',
    review: language === 'ja' ? 'レビュー' : 'Review',
    presentationType: language === 'ja' ? '発表タイプ' : 'Presentation Type'
  };
  const resetLabel = language === 'ja' ? 'フィルターをリセット' : 'Reset Filters';

  return (
    <div style={{ padding: "0" }}>
      {/* フィルターボタン */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        {Object.entries(filterLabels).map(([category, label]) => (
          <div key={category} style={{ position: "relative" }}>
            <button
              onClick={() => toggleDropdown(category)}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: selectedFilters[category].length > 0 ? "#c0e0ff" : "#f0f0f0",
                border: "none",
                borderRadius: "0.25rem",
                cursor: "pointer",
                fontWeight: selectedFilters[category].length > 0 ? "bold" : "normal"
              }}
            >
              {label} ▼
            </button>
            
            {openDropdown === category && (
              <div
                data-testid={`${category}-dropdown`}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  zIndex: 10,
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderRadius: "0.25rem",
                  padding: "0.5rem",
                  minWidth: "200px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                }}
              >
                {filterOptions[category].map(option => (
                  <div key={option} style={{ marginBottom: "0.25rem" }}>
                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedFilters[category].includes(option)}
                        onChange={() => toggleFilter(category, option)}
                        style={{ marginRight: "0.5rem" }}
                      />
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* フィルターリセットボタン */}
      {hasActiveFilters && (
        <button 
          onClick={resetFilters}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#f0f0f0",
            border: "none",
            borderRadius: "0.25rem",
            cursor: "pointer",
            marginLeft: "0.5rem"
          }}
        >
          {resetLabel}
        </button>
      )}
      
      {/* 選択されているフィルターを表示 */}
      {hasActiveFilters && (
        <div style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
          {Object.entries(selectedFilters).map(([category, values]) => 
            values.length > 0 && (
              <div key={category} style={{ marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: "bold" }}>{filterLabels[category]}: </span>
                {values.map(value => (
                  <span 
                    key={value}
                    style={{
                      backgroundColor: "#e0e0e0",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "0.25rem",
                      fontSize: "0.85rem",
                      marginRight: "0.5rem",
                      cursor: "pointer"
                    }}
                    onClick={() => toggleFilter(category, value)}
                  >
                    {value} ✕
                  </span>
                ))}
              </div>
            )
          )}
        </div>
      )}

      <ul style={{ marginTop: "1rem" }}>
        {filteredPublications.map((pub) => (
          <li key={pub.id} style={{ marginBottom: "1.5rem" }}>
            {/* 一行目: タイトル */}
            <strong>
              {language === 'ja' && pub.japanese ? pub.japanese : pub.name}
            </strong>
            
            {/* 二行目: タグ（Year、Authorship、type、Review、Presentation） */}
            <div className="tags-container" style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {pub.year && (
                <span className="tag" style={{ backgroundColor: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.85rem" }}>
                  {pub.year}
                </span>
              )}
              {pub.authorship && (
                <span className="tag" style={{ backgroundColor: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.85rem" }}>
                  {pub.authorship}
                </span>
              )}
              {pub.type && (
                <span className="tag" style={{ backgroundColor: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.85rem" }}>
                  {pub.type}
                </span>
              )}
              {pub.review && (
                <span className="tag" style={{ backgroundColor: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.85rem" }}>
                  {pub.review}
                </span>
              )}
              {pub.presentationType && (
                <span className="tag" style={{ backgroundColor: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.85rem" }}>
                  {pub.presentationType}
                </span>
              )}
            </div>
            
            {/* 三行目: ジャーナル名 */}
            <div style={{ marginTop: "0.5rem" }}>{pub.journal}</div>
            
            {/* 四行目以降: DOI、URL、Others */}
            {pub.doi && (
              <div style={{ marginTop: "0.25rem" }}>
                DOI: <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer">
                  {pub.doi}
                </a>
              </div>
            )}
            {pub.webLink && (
              <div style={{ marginTop: "0.25rem" }}>
                <a href={pub.webLink} target="_blank" rel="noopener noreferrer">
                  {pub.webLink}
                </a>
              </div>
            )}
            {pub.others && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#555" }}>
                {pub.others}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Publications;
