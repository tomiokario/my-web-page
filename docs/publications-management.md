# 出版物データの管理

このドキュメントでは、my-web-pageプロジェクトにおける出版物データの管理、CSVからJSONへの変換プロセス、およびデータの表示方法について説明します。

## 概要

my-web-pageでは、出版物データを以下のフローで管理しています：

1. Notionからエクスポートした出版物データをCSV形式で保存
2. CSVデータをJSONに変換するスクリプトを実行
3. 変換されたJSONデータをReactアプリケーションで表示
4. フィルタリングと並び替え機能を提供

このアプローチにより、データの管理と表示を分離し、効率的なワークフローを実現しています。

## データフロー

```mermaid
flowchart LR
    A[Notion] --> B[CSV Data<br>data/publication_data.csv]
    B --> C[convertPublications.js]
    C --> D[JSON Data<br>src/data/publications.json]
    D --> E[usePublications Hook]
    E --> F[Publications Component]
    F --> G[useFilters Hook]
    G --> H[Filtered Data]
    H --> I[PublicationsView]
```

## CSVデータ形式

CSVファイル（`data/publication_data.csv`）は以下の列を含む必要があります：

1. 未入力項目有り（Yes/No）
2. 名前（著者名と論文タイトル）
3. Japanese（日本語）（日本語での著者名と論文タイトル）
4. type（論文の種類）
5. Review（査読の有無）
6. Authorship（著者の役割）
7. Presentation type（発表の種類）
8. DOI（Digital Object Identifier）
9. web link（ウェブリンク）
10. Date（日付）
11. Others（その他の情報）
12. site（開催場所）
13. journal / conference（ジャーナル名または会議名）

### CSVファイルの例

```csv
未入力項目有り,名前（著者名と論文タイトル）,Japanese（日本語）,type,Review,Authorship,Presentation type,DOI,web link,Date,Others,site,journal / conference
No,"Tomioka R, et al. Title of the paper","冨岡莉生, 他. 論文のタイトル","Journal paper：原著論文","Peer-reviewed","First author,Corresponding author","Oral","10.1234/abcd.5678","https://example.com/paper","2022年10月1日","Additional information","Tokyo, Japan","Journal of Example Research"
```

## CSVからJSONへの変換

### 変換スクリプト

変換スクリプト（`scripts/convertPublications.js`）は、CSVファイルを読み込み、JSONに変換して保存します。

```javascript
// scripts/convertPublications.js
const fs = require('fs');
const path = require('path');
const { csvToJson, convertAndSave } = require('../src/utils/csvToJson');

function main() {
  try {
    // ファイルパスを設定
    const csvFilePath = path.join(__dirname, '../data/publication_data.csv');
    const jsonFilePath = path.join(__dirname, '../src/data/publications.json');
    
    // CSVファイルが存在するか確認
    if (!fs.existsSync(csvFilePath)) {
      console.error(`エラー: CSVファイル ${csvFilePath} が見つかりません`);
      process.exit(1);
    }
    
    // CSVをJSONに変換して保存
    const success = convertAndSave(csvFilePath, jsonFilePath);
    
    if (success) {
      // 変換されたJSONデータを読み込んで件数を表示
      const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
      console.log(`変換が完了しました。${jsonData.length}件のデータが ${jsonFilePath} に保存されました。`);
      process.exit(0);
    } else {
      console.error('変換に失敗しました。');
      process.exit(1);
    }
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトを実行
main();
```

### CSV変換ユーティリティ

CSV変換の詳細なロジックは `src/utils/csvToJson.js` に実装されています。主な機能は以下の通りです：

1. CSVファイルの読み込み
2. CSVデータの解析（引用符内のカンマを考慮）
3. データの整形と変換
4. JSONファイルへの保存

特に重要な処理として以下があります：

- **日付の処理**: 「2021年10月3日 → 2021年10月6日」のような日付範囲を解析し、開始日と終了日を抽出します。
- **配列データの処理**: カンマで区切られた値（著者の役割や発表タイプなど）を配列に変換します。
- **ソート可能な日付の生成**: 日付を「YYYYMMDD」形式に変換し、ソートを容易にします。

### 変換スクリプトの実行方法

```bash
node scripts/convertPublications.js
```

## JSONデータ構造

変換後のJSONデータ（`src/data/publications.json`）は以下の構造を持ちます：

```json
[
  {
    "hasEmptyFields": false,
    "name": "Tomioka R, et al. Title of the paper",
    "japanese": "冨岡莉生, 他. 論文のタイトル",
    "type": "Journal paper：原著論文",
    "review": "Peer-reviewed",
    "authorship": ["First author", "Corresponding author"],
    "presentationType": "Oral",
    "doi": "10.1234/abcd.5678",
    "webLink": "https://example.com/paper",
    "date": "2022年10月1日",
    "startDate": "2022-10-01",
    "endDate": "2022-10-01",
    "sortableDate": "2022-10-01",
    "others": "Additional information",
    "site": "Tokyo, Japan",
    "journalConference": "Journal of Example Research"
  }
]
```

## 出版物データの表示

### データ処理フック

出版物データの処理には、2つの主要なカスタムフックを使用しています：

1. **usePublications**: 出版物データの取得、整形、並び替え、グループ化を行います。
2. **useFilters**: フィルタリング機能を提供します。

#### usePublications.js

`usePublications` フックは以下の機能を提供します：

- 出版物データの読み込みと整形
- 時系列順または種類順での並び替え
- 年度別または種類別のグループ化

```javascript
// src/hooks/usePublications.js（主要部分）
function usePublications({ sortOrder, filteredPublications }) {
  // 日付から年を抽出する関数
  const extractYear = (dateString) => {
    if (!dateString) return null;
    const match = dateString.match(/(\d{4})/);
    return match ? parseInt(match[1], 10) : null;
  };

  // 出版物データを整形
  const formattedPublications = useMemo(() => {
    return publicationsData.map((pub, index) => ({
      id: index,
      name: pub.name,
      japanese: pub.japanese,
      year: extractYear(pub.date),
      // その他のプロパティ...
    }));
  }, []);

  // 並び順に基づいて出版物を並べ替え
  const sortedPublications = useMemo(() => {
    if (sortOrder === 'chronological') {
      // 時系列順（新しい順）
      // ...
    } else {
      // 種類順
      // ...
    }
  }, [formattedPublications, sortOrder]);

  // 出版物をグループ化
  const groupedPublications = useMemo(() => {
    // グループ化ロジック...
  }, [filteredPublications, sortOrder]);

  return {
    formattedPublications,
    sortedPublications,
    groupedPublications,
    extractYear
  };
}
```

#### useFilters.js

`useFilters` フックは以下の機能を提供します：

- フィルターオプションの抽出
- フィルター状態の管理
- フィルタリングロジックの実装
- ドロップダウンUIの制御

```javascript
// src/hooks/useFilters.js（主要部分）
function useFilters({ publications }) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    year: [],
    authorship: [],
    type: [],
    review: [],
    presentationType: []
  });

  // 利用可能なフィルターオプションを抽出
  const filterOptions = useMemo(() => {
    // オプション抽出ロジック...
  }, [publications]);
  
  // フィルタリング
  const filteredPublications = useMemo(() => {
    return publications.filter((pub) => {
      // フィルタリングロジック...
    });
  }, [publications, selectedFilters]);

  // その他の関数（toggleDropdown, toggleFilter, resetFilters）...

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
```

### 出版物ページの構成

出版物ページは以下のコンポーネントで構成されています：

1. **Publications.jsx**: データ取得と状態管理を担当
2. **PublicationsView.jsx**: UIレンダリングを担当
3. **PublicationGroup.jsx**: 出版物グループを表示
4. **PublicationItem.jsx**: 個々の出版物項目を表示
5. **FilterDropdown.jsx**: フィルタードロップダウンを表示
6. **ActiveFilters.jsx**: 現在適用されているフィルターを表示

#### Publications.jsx

```jsx
// src/pages/Publications.jsx
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

  // 並び順変更ハンドラー
  const handleSortOrderChange = (newSortOrder) => {
    setSortOrder(newSortOrder);
  };

  return (
    <PublicationsView
      sortOrder={sortOrder}
      onSortOrderChange={handleSortOrderChange}
      selectedFilters={selectedFilters}
      openDropdown={openDropdown}
      filterOptions={filterOptions}
      groupedPublications={groupedPublications}
      filterRefs={filterRefs}
      toggleDropdown={toggleDropdown}
      toggleFilter={toggleFilter}
      resetFilters={resetFilters}
      language={language}
    />
  );
}
```

## 出版物データの更新方法

出版物データを更新するには、以下の手順に従ってください：

1. Notionから最新の出版物データをCSV形式でエクスポートします。
2. エクスポートしたCSVファイルを `data/publication_data.csv` に配置します。
3. 以下のコマンドを実行して、CSVデータをJSONに変換します：

   ```bash
   node scripts/convertPublications.js
   ```

4. 変換が成功すると、`src/data/publications.json` が更新されます。
5. 変更をコミットしてデプロイします。

## 注意点

- CSVファイルの形式は厳密に守る必要があります。列の順序や名前を変更すると、変換が失敗する可能性があります。
- 日付形式は「YYYY年MM月DD日」または「YYYY年MM月DD日 → YYYY年MM月DD日」の形式に従う必要があります。
- カンマを含む値は引用符（"）で囲む必要があります。
- CSVファイルは元データであるため直接編集せず、Notionでデータを管理することを推奨します。