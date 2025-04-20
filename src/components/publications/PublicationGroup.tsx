import React from "react";
import { createStyles } from "@mantine/emotion";
import { MantineTheme } from "@mantine/core";
import PublicationItem from "./PublicationItem";
import { Publication } from "../../types";

// PublicationGroupPropsインターフェースを追加
interface PublicationGroupProps {
  name: string;
  items: Publication[];
  language: string;
}

// スタイルの定義
const useStyles = createStyles((theme: MantineTheme) => ({
  group: {
    marginBottom: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xs,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.gray[1],
    borderRadius: theme.radius.sm,
  },
  list: {
    marginTop: theme.spacing.md,
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
      <h3 className={classes.header}>{name}</h3>
      
      {/* グループ内の出版物リスト（番号は1から始まる） */}
      <ol start={1} className={classes.list}>
        {items.map((publication) => (
          <PublicationItem
            key={publication.id}
            publication={publication}
            language={language}
          />
        ))}
      </ol>
    </div>
  );
}

export default PublicationGroup;