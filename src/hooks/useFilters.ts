import { useState, useMemo, useEffect, useRef } from "react";
import { Publication } from "../types"; // 後で作成する共通型定義ファイルからインポートすることを想定

// フィルターの状態の型定義
export interface SelectedFilters {
  year: string[];
  authorship: string[];
  type: string[];
  review: string[];
  presentationType: string[];
}

// 利用可能なフィルターオプションの型定義
interface FilterOptions {
  year: string[];
  authorship: string[];
  type: string[];
  review: string[];
  presentationType: string[];
}

// useFiltersフックの戻り値の型定義
export interface UseFiltersReturn {
  selectedFilters: SelectedFilters;
  openDropdown: string | null;
  filterOptions: FilterOptions;
  filteredPublications: Publication[];
  filterRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  toggleDropdown: (dropdown: string | null) => void;
  toggleFilter: (category: keyof SelectedFilters, value: string) => void;
  resetFilters: () => void;
  updatePublications: (newPublications: Publication[]) => void; // 追加
}

/**
 * フィルタリング機能を提供するカスタムフック
 * @param {Object} options - オプション
 * @param {Publication[]} options.publications - 出版物データ
 * @returns {UseFiltersReturn} フィルタリング関連の状態と関数
 */
function useFilters({ publications: initialPublications }: { publications: Publication[] }): UseFiltersReturn {
  const [publications, setPublications] = useState<Publication[]>(initialPublications); // 内部状態として保持
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    year: [],
    authorship: [],
    type: [],
    review: [],
    presentationType: []
  });
  const filterRefs = useRef<Record<string, HTMLElement | null>>({}); // 各フィルター要素の参照を保持

  // 利用可能なフィルターオプションを抽出
  const filterOptions = useMemo<FilterOptions>(() => {
    const options: FilterOptions = {
      year: [],
      authorship: [],
      type: [],
      review: [],
      presentationType: []
    };

    publications.forEach(pub => {
      // 年度のフィルターオプション
      if (pub.year && !options.year.includes(pub.year.toString())) {
        options.year.push(pub.year.toString());
      }

      // authorshipのフィルターオプション
      if (pub.authorship) {
        if (Array.isArray(pub.authorship)) {
          // 配列の場合は各要素を個別に処理
          pub.authorship.forEach((role: string) => {
            if (!options.authorship.includes(role)) {
              options.authorship.push(role);
            }
          });
        } else if (typeof pub.authorship === 'string' && !options.authorship.includes(pub.authorship)) {
          // 文字列の場合はそのまま追加
          options.authorship.push(pub.authorship);
        }
      }

      // typeのフィルターオプション
      if (pub.type && !options.type.includes(pub.type)) {
        options.type.push(pub.type);
      }

      // reviewのフィルターオプション
      if (pub.review && !options.review.includes(pub.review)) {
        options.review.push(pub.review);
      }

      // presentationTypeのフィルターオプション
      if (pub.presentationType) {
        if (Array.isArray(pub.presentationType)) {
          // 配列の場合は各要素を個別に処理
          pub.presentationType.forEach((type: string) => {
            if (!options.presentationType.includes(type)) {
              options.presentationType.push(type);
            }
          });
        } else if (typeof pub.presentationType === 'string' && !options.presentationType.includes(pub.presentationType)) {
          // 文字列の場合はそのまま追加
          options.presentationType.push(pub.presentationType);
        }
      }
    });

    // 各オプションをソート
    options.year.sort((a, b) => parseInt(b) - parseInt(a)); // 年は降順（新しい順）
    options.authorship.sort();
    options.type.sort();
    options.review.sort();
    options.presentationType.sort();

    return options;
  }, [publications]);

  // フィルタリング
  const filteredPublications = useMemo<Publication[]>(() => {
    return publications.filter((pub) => {
      // 年度フィルター
      if (selectedFilters.year.length > 0 && pub.year && !selectedFilters.year.includes(pub.year.toString())) {
        return false;
      }

      // 著者の役割フィルター
      if (selectedFilters.authorship.length > 0) {
        // authorshipが配列の場合
        if (Array.isArray(pub.authorship)) {
          // 選択されたフィルターのいずれかが配列内に存在するかチェック
          const hasMatchingRole = pub.authorship.some((role: string) =>
            selectedFilters.authorship.includes(role)
          );
          if (!hasMatchingRole) {
            return false;
          }
        }
        // authorshipが文字列の場合
        else if (typeof pub.authorship === 'string' && !selectedFilters.authorship.includes(pub.authorship)) {
          return false;
        } else if (!pub.authorship) { // authorshipがnull/undefinedの場合
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
          const hasMatchingType = pub.presentationType.some((type: string) =>
            selectedFilters.presentationType.includes(type)
          );
          if (!hasMatchingType) {
            return false;
          }
        }
        // presentationTypeが文字列の場合
        else if (typeof pub.presentationType === 'string' && !selectedFilters.presentationType.includes(pub.presentationType)) {
          return false;
        } else if (!pub.presentationType) { // presentationTypeがnull/undefinedの場合
          return false;
        }
      }

      return true;
    });
  }, [publications, selectedFilters]);

  // ドロップダウンを開く/閉じる処理
  const toggleDropdown = (dropdown: string | null) => {
    if (openDropdown === dropdown) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(dropdown);
    }
  };

  // フィルターを選択/解除する処理
  const toggleFilter = (category: keyof SelectedFilters, value: string) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      if (newFilters[category].includes(value)) {
        // すでに選択されている場合は削除
        newFilters[category] = newFilters[category].filter((v: string) => v !== value);
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
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const currentFilterRef = filterRefs.current[openDropdown];
        if (currentFilterRef && !currentFilterRef.contains(event.target as Node)) {
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

  // 外部から出版物データを更新する関数
  const updatePublications = (newPublications: Publication[]) => {
    setPublications(newPublications);
    // フィルターオプションも再計算されるように依存配列に publications を追加済み
    // filteredPublications も再計算される
    // 必要であれば、ここでフィルター状態をリセットするなどの処理も追加可能
    // resetFilters(); // 例: データ更新時にフィルターをリセットする場合
  };

  return {
    selectedFilters,
    openDropdown,
    filterOptions,
    filteredPublications,
    filterRefs,
    toggleDropdown,
    toggleFilter,
    resetFilters,
    updatePublications // 追加
  };
}

export default useFilters;