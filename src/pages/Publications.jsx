import React, { useState, useMemo, useEffect, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import publicationsData from "../data/publications.json";

// 出版物の種類の順序を定義
const TYPE_ORDER = [
  "Journal paper：原著論文",
  "Invited paper：招待論文",
  "Research paper (international conference)：国際会議",
  "Research paper (domestic conference)：国内会議",
  "Miscellaneous"
];

function Publications() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    year: [],
    authorship: [],
    type: [],
    review: [],
    presentationType: []
  });
  const [sortOrder, setSortOrder] = useState('type'); // 'chronological' または 'type'
  const { language } = useLanguage();
  const filterRefs = useRef({}); // 各フィルター要素の参照を保持

  // 日付から年を抽出する関数
  const extractYear = (dateString) => {
    if (!dateString) return null;
    // 日付文字列から年を抽出（例: "2021年10月3日 → 2021年10月6日" から "2021"を抽出）
    const match = dateString.match(/(\d{4})/);
    return match ? parseInt(match[1], 10) : null;
  };

  // 出版物データを整形
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

  // 並び順に基づいて出版物を並べ替え
  const sortedPublications = useMemo(() => {
    if (sortOrder === 'chronological') {
      // 時系列順（新しい順）
      return [...formattedPublications].sort((a, b) => {
        return (b.year || 0) - (a.year || 0);
      });
    } else {
      // 種類順
      return [...formattedPublications].sort((a, b) => {
        // まず種類で並べ替え
        const typeIndexA = TYPE_ORDER.indexOf(a.type) !== -1 ? TYPE_ORDER.indexOf(a.type) : TYPE_ORDER.length;
        const typeIndexB = TYPE_ORDER.indexOf(b.type) !== -1 ? TYPE_ORDER.indexOf(b.type) : TYPE_ORDER.length;
        
        if (typeIndexA !== typeIndexB) {
          return typeIndexA - typeIndexB;
        }
        
        // 同じ種類の場合は年の新しい順
        return (b.year || 0) - (a.year || 0);
      });
    }
  }, [formattedPublications, sortOrder]);

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
      
      // authorshipが配列の場合は各要素を個別に処理
      if (pub.authorship) {
        if (Array.isArray(pub.authorship)) {
          pub.authorship.forEach(role => {
            if (!options.authorship.includes(role)) {
              options.authorship.push(role);
            }
          });
        } else if (!options.authorship.includes(pub.authorship)) {
          options.authorship.push(pub.authorship);
        }
      }
      if (pub.type && !options.type.includes(pub.type)) {
        options.type.push(pub.type);
      }
      if (pub.review && !options.review.includes(pub.review)) {
        options.review.push(pub.review);
      }
      // presentationTypeが配列の場合は各要素を個別に処理
      if (pub.presentationType) {
        if (Array.isArray(pub.presentationType)) {
          pub.presentationType.forEach(type => {
            if (!options.presentationType.includes(type)) {
              options.presentationType.push(type);
            }
          });
        } else if (!options.presentationType.includes(pub.presentationType)) {
          options.presentationType.push(pub.presentationType);
        }
      }
    });
    
    return options;
  }, [formattedPublications]);
  
  // フィルタリング
  const filteredPublications = useMemo(() => {
    return sortedPublications.filter((pub) => {
      // 年度フィルター
      if (selectedFilters.year.length > 0 && !selectedFilters.year.includes(pub.year?.toString())) {
        return false;
      }
      
      // 著者の役割フィルター
      if (selectedFilters.authorship.length > 0) {
        // authorshipが配列の場合
        if (Array.isArray(pub.authorship)) {
          // 選択されたフィルターのいずれかが配列内に存在するかチェック
          const hasMatchingRole = pub.authorship.some(role =>
            selectedFilters.authorship.includes(role)
          );
          if (!hasMatchingRole) {
            return false;
          }
        }
        // authorshipが文字列の場合
        else if (!selectedFilters.authorship.includes(pub.authorship)) {
          return false;
        }
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
      if (selectedFilters.presentationType.length > 0) {
        // presentationTypeが配列の場合
        if (Array.isArray(pub.presentationType)) {
          // 選択されたフィルターのいずれかが配列内に存在するかチェック
          const hasMatchingType = pub.presentationType.some(type =>
            selectedFilters.presentationType.includes(type)
          );
          if (!hasMatchingType) {
            return false;
          }
        }
        // presentationTypeが文字列の場合
        else if (!selectedFilters.presentationType.includes(pub.presentationType)) {
          return false;
        }
      }
      
      return true;
    });
  }, [sortedPublications, selectedFilters]);

  // 出版物をグループ化する
  const groupedPublications = useMemo(() => {
    const groups = {};
    
    filteredPublications.forEach(pub => {
      let groupKey;
      
      if (sortOrder === 'chronological') {
        // 時系列順の場合は年でグループ化
        groupKey = pub.year ? pub.year.toString() : 'Unknown';
      } else {
        // 種類順の場合は種類でグループ化
        groupKey = pub.type || 'Unknown';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(pub);
    });
    
    // グループをソート
    let sortedGroups = [];
    
    if (sortOrder === 'chronological') {
      // 年の降順（新しい順）
      sortedGroups = Object.keys(groups)
        .sort((a, b) => {
          if (a === 'Unknown') return 1;
          if (b === 'Unknown') return -1;
          return parseInt(b) - parseInt(a);
        })
        .map(key => ({
          name: key,
          items: groups[key]
        }));
    } else {
      // 種類の指定順
      sortedGroups = TYPE_ORDER
        .filter(type => groups[type])
        .map(type => ({
          name: type,
          items: groups[type]
        }));
      
      // 定義されていない種類があれば追加
      Object.keys(groups)
        .filter(key => !TYPE_ORDER.includes(key) && key !== 'Unknown')
        .sort()
        .forEach(key => {
          sortedGroups.push({
            name: key,
            items: groups[key]
          });
        });
      
      // Unknown があれば最後に追加
      if (groups['Unknown']) {
        sortedGroups.push({
          name: 'Unknown',
          items: groups['Unknown']
        });
      }
    }
    
    return sortedGroups;
  }, [filteredPublications, sortOrder]);

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
  const yearBasedLabel = language === 'ja' ? '年で表示' : 'By year';
  const typeBasedLabel = language === 'ja' ? '種類で表示' : 'By type';

  // ドロップダウンの外側をクリックしたときに閉じる処理
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown) {
        const currentFilterRef = filterRefs.current[openDropdown];
        if (currentFilterRef && !currentFilterRef.contains(event.target)) {
          setOpenDropdown(null);
        }
      }
    };

    // イベントリスナーを追加
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // クリーンアップ時にイベントリスナーを削除
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]); // openDropdown が変更されたときにのみ再実行

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
          <div
            key={category}
            style={{ position: "relative" }}
            ref={el => filterRefs.current[category] = el} // ref を設定
          >
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
                // ref は親の div に設定済みなので、ここでは不要
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

      {/* グループ化された出版物リスト */}
      <div style={{ marginTop: "1rem" }}>
        {groupedPublications.map((group, groupIndex) => (
          <div key={groupIndex} style={{ marginBottom: "2rem" }}>
            {/* グループヘッダー */}
            <h3 style={{
              marginBottom: "0.5rem",
              padding: "0.5rem",
              backgroundColor: "#f5f5f5",
              borderRadius: "0.25rem"
            }}>
              {group.name}
            </h3>
            
            {/* グループ内の出版物リスト（番号は1から始まる） */}
            <ol start={1} style={{ marginTop: "0.5rem" }}>
              {group.items.map((pub) => (
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
                      <>
                        {Array.isArray(pub.authorship) ? (
                          // 配列の場合は各要素を個別のタグとして表示
                          pub.authorship.map((role, index) => (
                            <span
                              key={`${pub.id}-role-${index}`}
                              className="tag"
                              style={{ backgroundColor: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.85rem", marginRight: "0.5rem" }}
                            >
                              {role}
                            </span>
                          ))
                        ) : (
                          // 文字列の場合は単一のタグとして表示
                          <span className="tag" style={{ backgroundColor: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.85rem" }}>
                            {pub.authorship}
                          </span>
                        )}
                      </>
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
                      <>
                        {Array.isArray(pub.presentationType) ? (
                          // 配列の場合は各要素を個別のタグとして表示
                          pub.presentationType.map((type, index) => (
                            <span
                              key={`${pub.id}-type-${index}`}
                              className="tag"
                              style={{ backgroundColor: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.85rem", marginRight: "0.5rem" }}
                            >
                              {type}
                            </span>
                          ))
                        ) : (
                          // 文字列の場合は単一のタグとして表示
                          <span className="tag" style={{ backgroundColor: "#f0f0f0", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.85rem" }}>
                            {pub.presentationType}
                          </span>
                        )}
                      </>
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
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Publications;
