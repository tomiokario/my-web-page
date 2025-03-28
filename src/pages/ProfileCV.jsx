import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { loadMarkdown } from "../utils/markdownLoader";

function ProfileCV() {
  const [content, setContent] = useState('# Loading...');

  useEffect(() => {
    const fetchMarkdown = async () => {
      const markdownContent = await loadMarkdown('/markdown/profilecv.md');
      setContent(markdownContent);
    };

    fetchMarkdown();
  }, []);

  return (
    <div style={{ padding: "0rem" }}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export default ProfileCV;
