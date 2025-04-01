import React, { useState, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import publicationsData from "../data/publications.json";

function Publications() {
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedTags, setSelectedTags] = useState([]);
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

  // ユニークな年度を抽出
  const years = useMemo(() => {
    const uniqueYears = Array.from(
      new Set(formattedPublications.map((pub) => pub.year).filter(Boolean))
    ).sort();
    return ["All", ...uniqueYears];
  }, [formattedPublications]);

  // タグによるフィルタリング
  const filteredPublications = useMemo(() => {
    return formattedPublications.filter((pub) => {
      // 年度フィルター
      if (selectedYear !== "All" && pub.year !== parseInt(selectedYear, 10)) {
        return false;
      }
      
      // タグフィルター
      if (selectedTags.length > 0) {
        // 選択されたすべてのタグに一致するかチェック
        for (const tag of selectedTags) {
          const pubTags = [
            pub.year?.toString(),
            pub.authorship,
            pub.type,
            pub.review,
            pub.presentationType
          ].filter(Boolean);
          
          if (!pubTags.includes(tag)) {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [formattedPublications, selectedYear, selectedTags]);

  // タグをクリックしたときの処理
  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      // すでに選択されている場合は削除
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      // 選択されていない場合は追加
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // フィルターをリセットする処理
  const resetFilters = () => {
    setSelectedYear("All");
    setSelectedTags([]);
  };

  // 言語に応じたラベル
  const filterLabel = language === 'ja' ? '絞り込み (年度)' : 'Filter by Year';
  const allLabel = language === 'ja' ? 'すべて' : 'All';
  const resetLabel = language === 'ja' ? 'フィルターをリセット' : 'Reset Filters';

  return (
    <div style={{ padding: "0" }}>
      <div>
        <label htmlFor="year-select">{filterLabel}: </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year === "All" ? allLabel : year}
            </option>
          ))}
        </select>
      </div>
      
      {/* フィルターリセットボタン */}
      {(selectedTags.length > 0 || selectedYear !== "All") && (
        <button
          onClick={resetFilters}
          style={{
            marginLeft: "1rem",
            padding: "0.25rem 0.5rem",
            backgroundColor: "#f0f0f0",
            border: "none",
            borderRadius: "0.25rem",
            cursor: "pointer"
          }}
        >
          {resetLabel}
        </button>
      )}
      
      {/* 選択されているタグを表示 */}
      {selectedTags.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          <span>{language === 'ja' ? '選択中のタグ: ' : 'Selected tags: '}</span>
          {selectedTags.map(tag => (
            <span
              key={tag}
              style={{
                backgroundColor: "#e0e0e0",
                padding: "0.2rem 0.5rem",
                borderRadius: "0.25rem",
                fontSize: "0.85rem",
                marginRight: "0.5rem",
                cursor: "pointer"
              }}
              onClick={() => handleTagClick(tag)}
            >
              {tag} ✕
            </span>
          ))}
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
                <span
                  className="tag"
                  style={{
                    backgroundColor: selectedTags.includes(pub.year.toString()) ? "#c0e0ff" : "#f0f0f0",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "0.25rem",
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                  onClick={() => handleTagClick(pub.year.toString())}
                >
                  {pub.year}
                </span>
              )}
              {pub.authorship && (
                <span
                  className="tag"
                  style={{
                    backgroundColor: selectedTags.includes(pub.authorship) ? "#c0e0ff" : "#f0f0f0",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "0.25rem",
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                  onClick={() => handleTagClick(pub.authorship)}
                >
                  {pub.authorship}
                </span>
              )}
              {pub.type && (
                <span
                  className="tag"
                  style={{
                    backgroundColor: selectedTags.includes(pub.type) ? "#c0e0ff" : "#f0f0f0",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "0.25rem",
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                  onClick={() => handleTagClick(pub.type)}
                >
                  {pub.type}
                </span>
              )}
              {pub.review && (
                <span
                  className="tag"
                  style={{
                    backgroundColor: selectedTags.includes(pub.review) ? "#c0e0ff" : "#f0f0f0",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "0.25rem",
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                  onClick={() => handleTagClick(pub.review)}
                >
                  {pub.review}
                </span>
              )}
              {pub.presentationType && (
                <span
                  className="tag"
                  style={{
                    backgroundColor: selectedTags.includes(pub.presentationType) ? "#c0e0ff" : "#f0f0f0",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "0.25rem",
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                  onClick={() => handleTagClick(pub.presentationType)}
                >
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
