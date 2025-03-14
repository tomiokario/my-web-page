import React, { useState } from "react";
import publicationsData from "../data/publications.json";

function Publications() {
  const [selectedYear, setSelectedYear] = useState("All");

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

  return (
    <div style={{ padding: "0" }}>
      <h2>This is Publications page</h2>
      <div>
        <label htmlFor="year-select">絞り込み (Year): </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
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
