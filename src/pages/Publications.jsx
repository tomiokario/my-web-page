import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import publicationsData from "../data/publications.json";

function Publications() {
  const [selectedYear, setSelectedYear] = useState("All");
  const { language } = useLanguage();

  // ユニークな年度を抽出
  const years = [
    "All",
    ...Array.from(new Set(publicationsData.map((pub) => pub.year))).sort()
  ];

  // 年度フィルタリング
  const filteredPublications = publicationsData.filter((pub) => {
    if (selectedYear === "All") return true;
    return pub.year === parseInt(selectedYear, 10);
  });

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
          <li key={pub.id} style={{ marginBottom: "0.5rem" }}>
            <strong>{pub.title}</strong> ({pub.year})<br />
            <em>{pub.authors}</em> - {pub.journal}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Publications;
