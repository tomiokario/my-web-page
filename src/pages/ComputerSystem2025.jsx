import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { loadMarkdown } from "../utils/markdownLoader";

function ComputerSystem2025() {
  const [content, setContent] = useState('Loading...');
  const [error, setError] = useState(null);
  const { language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        // 特定のマークダウンファイルのパスを直接指定
        const markdownContent = await loadMarkdown('/markdown/works/computer-system-2025.md', language);
        setContent(markdownContent);
        setError(null);
      } catch (err) {
        console.error("Error loading computer system content:", err);
        setError("Failed to load content");
        setContent("# Content not found");
      }
    };

    fetchMarkdown();
  }, [language]); // 言語が変更されたときにマークダウンを再読み込み

  // エラー時に戻るボタンを表示
  if (error) {
    return (
      <div>
        <div>{content}</div>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "0rem" }}>
      <ReactMarkdown>{content}</ReactMarkdown>
      <div style={{ marginTop: "2rem" }}>
        <button onClick={() => navigate("/works")} style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#f4f4f4",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}>
          ← Back to Works
        </button>
      </div>
    </div>
  );
}

export default ComputerSystem2025;