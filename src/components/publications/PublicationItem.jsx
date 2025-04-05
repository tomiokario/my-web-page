import React from "react";
import { createStyles } from "@mantine/core";

// スタイルの定義
const useStyles = createStyles((theme) => ({
  item: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontWeight: "bold",
  },
  tagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  tag: {
    backgroundColor: theme.colors.gray[1],
    padding: `${theme.spacing.xs / 2}px ${theme.spacing.xs}px`,
    borderRadius: theme.radius.sm,
    fontSize: theme.fontSizes.xs,
  },
  journal: {
    marginTop: theme.spacing.xs,
  },
  dateLocation: {
    marginTop: theme.spacing.xs / 2,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.gray[6],
  },
  separator: {
    margin: `0 ${theme.spacing.xs}px`,
  },
  link: {
    marginTop: theme.spacing.xs / 2,
  },
  others: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.gray[6],
  }
}));

/**
 * 単一の出版物エントリを表示するコンポーネント
 * 
 * @param {Object} props
 * @param {Object} props.publication - 出版物データ
 * @param {string} props.language - 現在の言語設定（'ja'または'en'）
 */
function PublicationItem({ publication, language }) {
  const { classes } = useStyles();
  
  return (
    <li className={classes.item}>
      {/* 一行目: タイトル */}
      <div className={classes.title}>
        {language === 'ja' && publication.japanese ? publication.japanese : publication.name}
      </div>
      
      {/* 二行目: タグ（Year、Authorship、type、Review、Presentation） */}
      <div className={classes.tagsContainer} data-testid="tags-container">
        {publication.year && (
          <span className={classes.tag} data-testid="tag">
            {publication.year}
          </span>
        )}
        
        {publication.authorship && (
          <>
            {Array.isArray(publication.authorship) ? (
              // 配列の場合は各要素を個別のタグとして表示
              publication.authorship.map((role, index) => (
                <span
                  key={`role-${index}`}
                  className={classes.tag}
                  data-testid="tag"
                >
                  {role}
                </span>
              ))
            ) : (
              // 文字列の場合は単一のタグとして表示
              <span className={classes.tag} data-testid="tag">
                {publication.authorship}
              </span>
            )}
          </>
        )}
        
        {publication.type && (
          <span className={classes.tag} data-testid="tag">
            {publication.type}
          </span>
        )}
        
        {publication.review && (
          <span className={classes.tag} data-testid="tag">
            {publication.review}
          </span>
        )}
        
        {publication.presentationType && (
          <>
            {Array.isArray(publication.presentationType) ? (
              // 配列の場合は各要素を個別のタグとして表示
              publication.presentationType.map((type, index) => (
                <span
                  key={`type-${index}`}
                  className={classes.tag}
                  data-testid="tag"
                >
                  {type}
                </span>
              ))
            ) : (
              // 文字列の場合は単一のタグとして表示
              <span className={classes.tag} data-testid="tag">
                {publication.presentationType}
              </span>
            )}
          </>
        )}
      </div>
      
      {/* 三行目: ジャーナル名 */}
      <div className={classes.journal}>{publication.journal}</div>
      
      {/* 四行目: 開始日、終了日、場所 */}
      {(publication.startDate || publication.site) && (
        <div className={classes.dateLocation}>
          {/* 開始日と終了日が同じ場合は開始日のみ表示 */}
          {publication.startDate && (
            <>
              {language === 'ja' ? '日付: ' : 'Date: '}
              {publication.startDate === publication.endDate ?
                publication.startDate :
                `${publication.startDate} → ${publication.endDate}`
              }
            </>
          )}
          
          {/* 場所がある場合は表示 */}
          {publication.site && (
            <>
              {publication.startDate && <span className={classes.separator}>|</span>}
              {language === 'ja' ? '場所: ' : 'Location: '}
              {publication.site}
            </>
          )}
        </div>
      )}
      
      {/* 五行目以降: DOI、URL、Others */}
      {publication.doi && (
        <div className={classes.link}>
          DOI: <a href={`https://doi.org/${publication.doi}`} target="_blank" rel="noopener noreferrer">
            {publication.doi}
          </a>
        </div>
      )}
      
      {publication.webLink && (
        <div className={classes.link}>
          <a href={publication.webLink} target="_blank" rel="noopener noreferrer">
            {publication.webLink}
          </a>
        </div>
      )}
      
      {publication.others && (
        <div className={classes.others}>
          {publication.others}
        </div>
      )}
    </li>
  );
}

export default PublicationItem;