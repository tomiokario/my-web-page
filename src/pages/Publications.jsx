import React, { useState, useMemo, useEffect, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import publicationsData from "../data/publications.json";
import PublicationGroup from "../components/publications/PublicationGroup";
import FilterDropdown from "../components/publications/FilterDropdown";
import ActiveFilters from "../components/publications/ActiveFilters";

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
        others: pub.others,
        startDate: pub.startDate,
        endDate: pub.endDate,
        sortableDate: pub.sortableDate
      };
    });
  }, []);

  // 並び順に基づいて出版物を並べ替え
  const sortedPublications = useMemo(() => {
    if (sortOrder === 'chronological') {
      // 時系列順（新しい順）- 開始日に基づくソート
      return [...formattedPublications].sort((a, b) => {
        // sortableDateが存在する場合はそれを使用、存在しない場合は年を使用
        if (a.sortableDate && b.sortableDate) {
          return a.sortableDate > b.sortableDate ? -1 : a.sortableDate < b.sortableDate ? 1 : 0;
        }
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
        
        // 同じ種類の場合は開始日の新しい順
        if (a.sortableDate && b.sortableDate) {
          return a.sortableDate > b.sortableDate ? -1 : a.sortableDate < b.sortableDate ? 1 : 0;
        }
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
