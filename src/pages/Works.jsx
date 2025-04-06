import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "../contexts/LanguageContext";
import { loadMarkdown } from "../utils/markdownLoader";

function Works() {
  const [content, setContent] = useState('Loading...');
  const { language } = useLanguage();

  useEffect(() => {
    const fetchMarkdown = async () => {
      const markdownContent = await loadMarkdown('/markdown/works.md', language);
      setContent(markdownContent);
    };

    fetchMarkdown();
  }, [language]); // 言語が変更されたときにマークダウンを再読み込み

  return (
    <div style={{ padding: "0rem" }}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export default Works;