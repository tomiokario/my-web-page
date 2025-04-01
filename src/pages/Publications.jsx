import React, { useState, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import publicationsData from "../data/publications.json";

function Publications() {
  const [selectedYear, setSelectedYear] = useState("All");
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

  // 年度フィルタリング
  const filteredPublications = useMemo(() => {
    return formattedPublications.filter((pub) => {
      if (selectedYear === "All") return true;
      return pub.year === parseInt(selectedYear, 10);
    });
  }, [formattedPublications, selectedYear]);

  // 言語に応じたラベル
  const filterLabel = language === 'ja' ? '絞り込み (年度)' : 'Filter by Year';
  const allLabel = language === 'ja' ? 'すべて' : 'All';

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

      <ul style={{ marginTop: "1rem" }}>
        {filteredPublications.map((pub) => (
          <li key={pub.id} style={{ marginBottom: "1.5rem" }}>
            {/* 一行目: タイトル */}
            <strong>
              {language === 'ja' && pub.japanese ? pub.japanese : pub.name}
            </strong>
            
            {/* 二行目: タグ（Authorship、type、Review、Presentation） */}
            <div className="tags-container" style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {pub.authorship && (
                <span className="tag" style={{
                  backgroundColor: "#f0f0f0",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.85rem"
                }}>
                  {pub.authorship}
                </span>
              )}
              {pub.type && (
                <span className="tag" style={{
                  backgroundColor: "#f0f0f0",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.85rem"
                }}>
                  {pub.type}
                </span>
              )}
              {pub.review && (
                <span className="tag" style={{
                  backgroundColor: "#f0f0f0",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.85rem"
                }}>
                  {pub.review}
                </span>
              )}
              {pub.presentationType && (
                <span className="tag" style={{
                  backgroundColor: "#f0f0f0",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.85rem"
                }}>
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
