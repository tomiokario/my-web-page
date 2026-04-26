import React from "react";
import { createStyles } from "@mantine/emotion";
import { MantineTheme } from "@mantine/core";
import PublicationItem from "./PublicationItem";
import { Language, Publication } from "../../types";

// PublicationGroupPropsインターフェースを追加
interface PublicationGroupProps {
  name: string;
  items: Publication[];
  language: Language;
}

// スタイルの定義
const useStyles = createStyles((theme: MantineTheme) => ({
  group: {
    marginBottom: "2.25rem",
  },
  header: {
    alignItems: "center",
    background: "var(--card-bg)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--card-shadow)",
    color: "var(--accent-text)",
    display: "flex",
    fontSize: "1.05rem",
    fontWeight: 700,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    maxWidth: "100%",
    minWidth: 0,
    padding: `${theme.spacing.md} 1.25rem`,
    "&::after": {
      color: "var(--accent)",
      content: "attr(data-count)",
      flex: "0 0 auto",
      fontSize: theme.fontSizes.xs,
      fontVariantNumeric: "tabular-nums",
      fontWeight: 600,
      letterSpacing: "0.1em",
      marginLeft: "auto",
      whiteSpace: "nowrap",
    },
    '@media (max-width: 640px)': {
      alignItems: "flex-start",
      gap: theme.spacing.sm,
      padding: `${theme.spacing.sm} 1rem`,
    },
  },
  headerAccent: {
    background: "var(--accent)",
    borderRadius: "var(--radius-xs)",
    display: "inline-block",
    flex: "0 0 auto",
    height: 22,
    width: 6,
  },
  headerText: {
    flex: "1 1 auto",
    maxWidth: "100%",
    minWidth: 0,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  list: {
    listStyle: "none",
    marginTop: 0,
    padding: `${theme.spacing.xs} 0 0`,
    maxWidth: "100%",
    minWidth: 0,
  },
}));

/**
 * 出版物グループを表示するコンポーネント
 * 
 * @param {Object} props
 * @param {string} props.name - グループ名
 * @param {Publication[]} props.items - 出版物アイテムの配列
 * @param {string} props.language - 現在の言語設定（'ja'または'en'）
 */
function PublicationGroup({ name, items, language }: PublicationGroupProps) {
  const { classes } = useStyles();
  
  return (
    <div className={classes.group}>
      {/* グループヘッダー */}
      <h3
        className={classes.header}
        data-count={`${String(items.length).padStart(2, "0")} ${
          items.length === 1 ? "ITEM" : "ITEMS"
        }`}
      >
        <span className={classes.headerAccent} aria-hidden="true" />
        <span className={classes.headerText}>{name}</span>
      </h3>
      
      {/* グループ内の出版物リスト（番号は1から始まる） */}
      <ol start={1} className={classes.list}>
        {items.map((publication, index) => (
          <PublicationItem
            key={publication.id}
            publication={publication}
            language={language}
            index={index + 1}
          />
        ))}
      </ol>
    </div>
  );
}

export default PublicationGroup;
