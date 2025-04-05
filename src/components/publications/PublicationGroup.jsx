import React from "react";
import { createStyles } from "@mantine/core";
import PublicationItem from "./PublicationItem";

// スタイルの定義
const useStyles = createStyles((theme) => ({
  group: {
    marginBottom: theme.spacing.xl * 2,
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
 * @param {Array} props.items - 出版物アイテムの配列
 * @param {string} props.language - 現在の言語設定（'ja'または'en'）
 */
function PublicationGroup({ name, items, language }) {
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