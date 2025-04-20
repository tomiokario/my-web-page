import { Publication } from '../../types'; // Publication型をインポート

// Publicationのデフォルト値を生成する関数
const getDefaultPublicationValues = (index: number): Publication => ({
  hasEmptyFields: false,
  name: `Test Publication ${index + 1}`,
  japanese: `テスト出版物 ${index + 1}`,
  type: 'Journal paper：原著論文',
  review: 'Peer-reviewed',
  authorship: ['First author'],
  presentationType: 'Oral',
  doi: `10.1234/test.${index + 1}`,
  webLink: `https://example.com/test-${index + 1}`,
  date: `${2023 - index}年${10 - index}月${1 + index}日`, // 例として年、月、日を変化させる
  startDate: `${2023 - index}-${String(10 - index).padStart(2, '0')}-${String(1 + index).padStart(2, '0')}`,
  endDate: `${2023 - index}-${String(10 - index).padStart(2, '0')}-${String(1 + index).padStart(2, '0')}`,
  sortableDate: `${2023 - index}${String(10 - index).padStart(2, '0')}${String(1 + index).padStart(2, '0')}`,
  others: `Additional info ${index + 1}`,
  site: `Test Site ${index + 1}`,
  journalConference: `Test Journal ${index + 1}`,
  // groupedPublicationsテストで使用される可能性のあるプロパティも追加
  id: index,
  year: 2023 - index,
});

// Publicationオブジェクトを生成するファクトリ関数
export const createPublication = (overrides: Partial<Publication> = {}, index: number = 0): Publication => {
  return {
    ...getDefaultPublicationValues(index),
    ...overrides, // 引数で渡された値でデフォルト値を上書き
  };
};

// 複数のPublicationオブジェクトを生成するヘルパー関数
export const createPublications = (count: number, overrides?: Partial<Publication>[]): Publication[] => {
  return Array.from({ length: count }, (_, i) => createPublication(overrides?.[i] || {}, i));
};