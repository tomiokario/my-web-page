import React, { ReactNode, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "../contexts/LanguageContext";
import useLocale from "../hooks/useLocale";
import { loadMarkdown } from "../utils/markdownLoader";
import "./MarkdownPage.css";

interface MarkdownPageProps {
  markdownPath: string;
  footer?: ReactNode;
}

type MarkdownBlock =
  | {
      type: "section";
      title: string;
      body: string;
    }
  | {
      type: "plain";
      body: string;
    };

const sectionHeadingPattern = /^###\s+(.+)$/;

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const plainLines: string[] = [];
  let currentSection: { title: string; lines: string[] } | null = null;

  const flushPlain = () => {
    const body = plainLines.join("\n").trim();
    plainLines.length = 0;

    if (body) {
      blocks.push({ type: "plain", body });
    }
  };

  const flushSection = () => {
    if (currentSection) {
      blocks.push({
        type: "section",
        title: currentSection.title,
        body: currentSection.lines.join("\n").trim(),
      });
      currentSection = null;
    }
  };

  for (const line of content.split(/\r?\n/)) {
    const headingMatch = line.match(sectionHeadingPattern);

    if (headingMatch) {
      flushSection();
      flushPlain();

      currentSection = {
        title: headingMatch[1].trim(),
        lines: [],
      };
      continue;
    }

    if (currentSection) {
      currentSection.lines.push(line);
    } else {
      plainLines.push(line);
    }
  }

  flushSection();
  flushPlain();

  return blocks;
}

function MarkdownPage({ markdownPath, footer }: MarkdownPageProps) {
  const [content, setContent] = useState<string>("");
  const { language } = useLanguage();
  const t = useLocale();
  const displayContent = content || t.common.loading;
  const blocks = parseMarkdownBlocks(displayContent);
  let sectionNumber = 0;

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
    <div className="markdown-page">
      {blocks.length > 0 ? (
        blocks.map((block, index) => {
          if (block.type === "plain") {
            return (
              <div key={`plain-${index}`} className="markdown-page__plain">
                <ReactMarkdown>{block.body}</ReactMarkdown>
              </div>
            );
          }

          sectionNumber += 1;

          return (
            <section key={`${block.title}-${index}`} className="markdown-page__section">
              <h3 className="markdown-page__section-title">
                <span className="markdown-page__section-number" aria-hidden="true">
                  {String(sectionNumber).padStart(2, "0")}
                </span>
                <span>{block.title}</span>
              </h3>
              <div className="markdown-page__section-body">
                <ReactMarkdown>{block.body}</ReactMarkdown>
              </div>
            </section>
          );
        })
      ) : (
        <div className="markdown-page__plain">
          <ReactMarkdown>{displayContent}</ReactMarkdown>
        </div>
      )}
      {footer}
    </div>
  );
}

export default MarkdownPage;
