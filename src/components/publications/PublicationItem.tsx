import React, { useState } from "react";
import { createStyles } from "@mantine/emotion";
import { Button, Collapse, MantineTheme } from "@mantine/core";
import { Language, Publication } from "../../types";
import locales from "../../locales";

// PublicationItemPropsインターフェースを追加
interface PublicationItemProps {
  publication: Publication;
  language: Language;
}

// スタイルの定義
const useStyles = createStyles((theme: MantineTheme) => ({
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
    padding: `${theme.spacing.xs} ${theme.spacing.xs}`,
    borderRadius: theme.radius.sm,
    fontSize: theme.fontSizes.xs,
  },
  journal: {
    marginTop: theme.spacing.xs,
  },
  dateLocation: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.gray[6],
  },
  separator: {
    margin: `0 ${theme.spacing.xs}`,
  },
  link: {
    marginTop: theme.spacing.xs,
  },
  others: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.gray[6],
  },
  abstractToggle: {
    marginTop: theme.spacing.sm,
  },
  abstract: {
    marginTop: theme.spacing.xs,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.gray[0],
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.gray[2]}`,
    whiteSpace: "pre-wrap",
  }
}));

/**
 * 単一の出版物エントリを表示するコンポーネント
 * 
 * @param {Object} props
 * @param {Publication} props.publication - 出版物データ
 * @param {string} props.language - 現在の言語設定（'ja'または'en'）
 */
function PublicationItem({ publication, language }: PublicationItemProps) {
  const { classes } = useStyles();
  const [isAbstractOpen, setIsAbstractOpen] = useState(false);
  const messages = locales[language] ?? locales.en;
  const abstractText = publication.abstract?.trim();
  const normalizedDoi = publication.doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
  const doiHref = normalizedDoi ? `https://doi.org/${normalizedDoi}` : "";
  
  return (
    <li className={classes.item} data-testid="publication-item">
      {/* 一行目: タイトル */}
      <div className={classes.title} data-testid="publication-title">
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
      <div className={classes.journal}>{publication.journalConference || publication.journal}</div>
      
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
      {normalizedDoi && (
        <div className={classes.link}>
          DOI: <a href={doiHref} target="_blank" rel="noopener noreferrer">
            {normalizedDoi}
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

      {abstractText && (
        <>
          <Button
            variant="light"
            size="xs"
            className={classes.abstractToggle}
            onClick={() => setIsAbstractOpen((current) => !current)}
            aria-expanded={isAbstractOpen}
            data-testid="abstract-toggle"
          >
            {isAbstractOpen
              ? messages.publications.hideAbstract
              : messages.publications.showAbstract}
          </Button>
          <Collapse in={isAbstractOpen} transitionDuration={0}>
            <div
              className={classes.abstract}
              data-testid="abstract-content"
              aria-label={messages.publications.abstractLabel}
            >
              {abstractText}
            </div>
          </Collapse>
        </>
      )}
    </li>
  );
}

export default PublicationItem;
