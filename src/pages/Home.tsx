import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useLanguage, LanguageContextType } from "../contexts/LanguageContext";
import { loadMarkdown } from "../utils/markdownLoader";

function Home() {
  const [content, setContent] = useState<string>('Loading...');
  const { language } = useLanguage() as LanguageContextType;

  useEffect(() => {
    const fetchMarkdown = async () => {
      const markdownContent: string = await loadMarkdown('/markdown/home.md', language);
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

export default Home;
