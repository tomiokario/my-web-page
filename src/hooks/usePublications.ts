import { useMemo } from "react";
import publicationsData from "../data/publications.json";
import { Publication } from "../types"; // Publication型をインポート

// 出版物の種類の順序を定義
const TYPE_ORDER: string[] = [
  "Journal paper：原著論文",
  "Invited paper：招待論文",
  "Research paper (international conference)：国際会議",
  "Research paper (domestic conference)：国内会議",
  "Miscellaneous"
];

// 出版物グループの型定義
interface PublicationGroup {
  name: string;
  items: Publication[];
}

// usePublicationsフックの戻り値の型定義
export interface UsePublicationsReturn {
  formattedPublications: Publication[];
  sortedPublications: Publication[];
  groupedPublications: PublicationGroup[];
  extractYear: (dateString: string | undefined | null) => number | null;
}

/**
 * 出版物データの取得と処理を行うカスタムフック
 * @param {Object} options - オプション
 * @param {string} options.sortOrder - 並び順 ('chronological' または 'type')
 * @param {Publication[]} options.filteredPublications - フィルタリング済みの出版物データ
 * @returns {UsePublicationsReturn} 処理済みの出版物データと関連関数
 */
function usePublications({ sortOrder, filteredPublications }: { sortOrder: string; filteredPublications: Publication[] }): UsePublicationsReturn {
  // 日付から年を抽出する関数
  const extractYear = (dateString: string | undefined | null): number | null => {
    if (!dateString) return null;
    // 日付文字列から年を抽出（例: "2021年10月3日 → 2021年10月6日" から "2021"を抽出）
    const match = dateString.match(/(\d{4})/);
    return match ? parseInt(match[1], 10) : null;
  };

  // 出版物データを整形
  const formattedPublications = useMemo<Publication[]>(() => {
    // publicationsDataの型が不明なため、anyとして扱い、Publication型にマッピング
    return (publicationsData as any[]).map((pub: any, index: number): Publication => {
      // 年度を抽出（フィルタリングに必要）
      const year = extractYear(pub.date);

      // Publication型に合うようにデータを整形
      // プロパティ名の大文字・小文字の違いに対応
      const authorshipValue = pub.authorship || pub.Authorship || '';
      const presentationTypeValue = pub.presentationType || pub['Presentation type'] || '';
      const reviewValue = pub.review || pub.Review || ''; // 修正: 大文字小文字両方に対応

      return {
        id: index, // idを追加
        hasEmptyFields: pub.hasEmptyFields || false, // デフォルト値を追加
        name: pub.name || '',
        japanese: pub.japanese || '',
        year: year || undefined, // yearは数値またはundefined
        journalConference: pub.journalConference || pub['journal / conference'] || '', // 修正: 正しいキー名を参照
        journal: pub.journal || '', // テスト用に追加
        date: pub.date || '',
        webLink: pub['web link'] || '', // プロパティ名を修正
        doi: pub.DOI || '', // プロパティ名を修正
        type: pub.type || '',
        review: reviewValue, // 修正: 大文字小文字両方に対応
        authorship: authorshipValue, // 修正: 大文字・小文字両方に対応
        presentationType: presentationTypeValue, // 修正: 大文字・小文字、スペースありに対応
        others: pub.Others || '', // プロパティ名を修正
        site: pub.site || '', // siteを追加
        startDate: pub.startDate || '',
        endDate: pub.endDate || '',
        sortableDate: pub.sortableDate || ''
      };
    });
  }, []);

  // 並び順に基づいて出版物を並べ替え
  const sortedPublications = useMemo<Publication[]>(() => {
    if (sortOrder === 'chronological') {
      // 時系列順（新しい順）- sortableDateまたは年に基づくソート
      return [...formattedPublications].sort((a, b) => {
        if (a.sortableDate && b.sortableDate) {
          return a.sortableDate > b.sortableDate ? -1 : a.sortableDate < b.sortableDate ? 1 : 0;
        }
        // sortableDateがない場合は年で比較
        const yearA = a.year || 0;
        const yearB = b.year || 0;
        return yearB - yearA;
      });
    } else {
      // 種類順
      return [...formattedPublications].sort((a, b) => {
        // まず種類で並べ替え
        const typeIndexA = TYPE_ORDER.indexOf(a.type);
        const typeIndexB = TYPE_ORDER.indexOf(b.type);

        if (typeIndexA !== typeIndexB) {
          // 見つからない種類は最後に
          if (typeIndexA === -1) return 1;
          if (typeIndexB === -1) return -1;
          return typeIndexA - typeIndexB;
        }

        // 同じ種類の場合はsortableDateまたは年の新しい順
        if (a.sortableDate && b.sortableDate) {
          return a.sortableDate > b.sortableDate ? -1 : a.sortableDate < b.sortableDate ? 1 : 0;
        }
         const yearA = a.year || 0;
        const yearB = b.year || 0;
        return yearB - yearA;
      });
    }
  }, [formattedPublications, sortOrder]);

  // 出版物をグループ化する
  const groupedPublications = useMemo<PublicationGroup[]>(() => {
    const groups: { [key: string]: Publication[] } = {};

    filteredPublications.forEach(pub => {
      let groupKey: string;

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
    let sortedGroups: PublicationGroup[] = [];

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