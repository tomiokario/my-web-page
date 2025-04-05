import { useMemo } from "react";
import publicationsData from "../data/publications.json";

// 出版物の種類の順序を定義
const TYPE_ORDER = [
  "Journal paper：原著論文",
  "Invited paper：招待論文",
  "Research paper (international conference)：国際会議",
  "Research paper (domestic conference)：国内会議",
  "Miscellaneous"
];

/**
 * 出版物データの取得と処理を行うカスタムフック
 * @param {Object} options - オプション
 * @param {string} options.sortOrder - 並び順 ('chronological' または 'type')
 * @param {Object} options.filteredPublications - フィルタリング済みの出版物データ
 * @returns {Object} 処理済みの出版物データと関連関数
 */
function usePublications({ sortOrder, filteredPublications }) {
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

  return {
    formattedPublications,
    sortedPublications,
    groupedPublications,
    extractYear
  };
}

export default usePublications;