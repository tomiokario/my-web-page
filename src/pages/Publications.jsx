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
        webLink: pub.webLink
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
          <li key={pub.id} style={{ marginBottom: "1rem" }}>
            <strong>
              {language === 'ja' && pub.japanese ? pub.japanese : pub.name}
            </strong><br />
            <div>{pub.journal}</div>
            {pub.webLink && (
              <div>
                <a href={pub.webLink} target="_blank" rel="noopener noreferrer">
                  {pub.webLink}
                </a>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Publications;
