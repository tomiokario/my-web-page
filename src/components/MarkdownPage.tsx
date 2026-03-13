import React, { ReactNode, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "../contexts/LanguageContext";
import useLocale from "../hooks/useLocale";
import { loadMarkdown } from "../utils/markdownLoader";

interface MarkdownPageProps {
  markdownPath: string;
  footer?: ReactNode;
}

function MarkdownPage({ markdownPath, footer }: MarkdownPageProps) {
  const [content, setContent] = useState<string>("");
  const { language } = useLanguage();
  const t = useLocale();

  useEffect(() => {
    let isMounted = true;

    const fetchMarkdown = async () => {
      const markdownContent = await loadMarkdown(markdownPath, language);

      if (isMounted) {
        setContent(markdownContent);
      }
    };

    fetchMarkdown();

    return () => {
      isMounted = false;
    };
  }, [language, markdownPath]);

  return (
    <div style={{ padding: "0rem" }}>
      <ReactMarkdown>{content || t.common.loading}</ReactMarkdown>
      {footer}
    </div>
  );
}

export default MarkdownPage;
