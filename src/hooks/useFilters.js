import { useState, useMemo, useEffect, useRef } from "react";

/**
 * フィルタリング機能を提供するカスタムフック
 * @param {Object} options - オプション
 * @param {Array} options.publications - 出版物データ
 * @returns {Object} フィルタリング関連の状態と関数
 */
function useFilters({ publications }) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    year: [],
    authorship: [],
    type: [],
    review: [],
    presentationType: []
  });
  const filterRefs = useRef({}); // 各フィルター要素の参照を保持

  // 利用可能なフィルターオプションを抽出
  const filterOptions = useMemo(() => {
    const options = {
      year: [],
      authorship: [],
      type: [],
      review: [],
      presentationType: []
    };
    
    publications.forEach(pub => {
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
  }, [publications]);
  
  // フィルタリング
  const filteredPublications = useMemo(() => {
    return publications.filter((pub) => {
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
  }, [publications, selectedFilters]);

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

  return {
    selectedFilters,
    openDropdown,
    filterOptions,
    filteredPublications,
    filterRefs,
    toggleDropdown,
    toggleFilter,
    resetFilters
  };
}

export default useFilters;