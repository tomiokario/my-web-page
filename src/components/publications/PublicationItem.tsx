import React, { useState } from "react";
import { createStyles } from "@mantine/emotion";
import { MantineTheme } from "@mantine/core";
import { Language, Publication } from "../../types";
import locales from "../../locales";
import {
  getPublicationAuthorshipLabel,
  getPublicationPresentationTypeLabel,
  getPublicationReviewLabel,
  getPublicationTypeLabel,
} from "../../utils/publicationLabels";

// PublicationItemPropsインターフェースを追加
interface PublicationItemProps {
  publication: Publication;
  language: Language;
  index?: number;
}

// スタイルの定義
const useStyles = createStyles((theme: MantineTheme) => ({
  item: {
    background: "var(--card-bg)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--card-shadow)",
    color: "var(--fg1)",
    display: "grid",
    gap: `${theme.spacing.xs} ${theme.spacing.md}`,
    gridTemplateColumns: "44px 1fr",
    listStyleType: "none",
    marginBottom: theme.spacing.sm,
    maxWidth: "100%",
    minWidth: 0,
    padding: "18px 22px 20px",
    '@media (max-width: 640px)': {
      gridTemplateColumns: "1fr",
      padding: "16px 18px 18px",
    },
  },
  number: {
    color: "var(--accent)",
    fontSize: theme.fontSizes.xs,
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
    gridRow: "1 / span 7",
    letterSpacing: "0.05em",
    paddingTop: theme.spacing.xs,
    '@media (max-width: 640px)': {
      gridRow: "auto",
      paddingTop: 0,
    },
  },
  title: {
    fontSize: "0.95rem",
    fontWeight: "bold",
    lineHeight: 1.4,
    marginBottom: 2,
    maxWidth: "100%",
    minWidth: 0,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  tagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    maxWidth: "100%",
    minWidth: 0,
  },
  tag: {
    backgroundColor: "var(--tag-muted-bg)",
    color: "var(--tag-muted-fg)",
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "var(--radius-sm)",
    fontSize: theme.fontSizes.xs,
    fontWeight: 500,
    lineHeight: 1.35,
    maxWidth: "100%",
    minWidth: 0,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  journal: {
    color: "var(--fg2)",
    fontSize: "0.9rem",
    marginTop: theme.spacing.xs,
    maxWidth: "100%",
    minWidth: 0,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  dateLocation: {
    marginTop: theme.spacing.xs,
    fontSize: "0.8rem",
    color: "var(--fg3)",
    maxWidth: "100%",
    minWidth: 0,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  separator: {
    color: "var(--accent-soft)",
    margin: `0 ${theme.spacing.xs}`,
  },
  link: {
    color: "var(--fg2)",
    fontSize: "0.85rem",
    marginTop: theme.spacing.xs,
    maxWidth: "100%",
    minWidth: 0,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    "& a": {
      overflowWrap: "anywhere",
      wordBreak: "break-word",
    },
  },
  others: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSizes.sm,
    color: "var(--fg3)",
    maxWidth: "100%",
    minWidth: 0,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  abstractToggle: {
    background: "var(--tag-muted-bg)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    color: "var(--tag-muted-fg)",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    fontSize: theme.fontSizes.xs,
    fontWeight: 600,
    letterSpacing: "0.02em",
    marginTop: theme.spacing.sm,
    padding: "6px 12px",
  },
  abstractToggleOpen: {
    background: "var(--tag-accent-bg)",
    color: "var(--tag-accent-fg)",
  },
  abstract: {
    marginTop: theme.spacing.xs,
    padding: "14px 18px",
    backgroundColor: "var(--accent-bg)",
    borderRadius: "var(--radius-sm)",
    boxShadow: "inset 3px 0 0 var(--accent)",
    color: "var(--fg1)",
    fontSize: "0.9rem",
    lineHeight: 1.6,
    maxWidth: "100%",
    minWidth: 0,
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  }
}));

/**
 * 単一の出版物エントリを表示するコンポーネント
 * 
 * @param {Object} props
 * @param {Publication} props.publication - 出版物データ
 * @param {string} props.language - 現在の言語設定（'ja'または'en'）
 */
function PublicationItem({ publication, language, index = 1 }: PublicationItemProps) {
  const { classes, cx } = useStyles();
  const [isAbstractOpen, setIsAbstractOpen] = useState(false);
  const messages = locales[language] ?? locales.en;
  const abstractText = publication.abstract?.trim();
  const normalizedDoi = publication.doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
  const doiHref = normalizedDoi ? `https://doi.org/${normalizedDoi}` : "";
  
  return (
    <li className={classes.item} data-testid="publication-item">
      <div className={classes.number} aria-hidden="true">
        {String(index).padStart(2, "0")}
      </div>

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
                  {getPublicationAuthorshipLabel(role, language)}
                </span>
              ))
            ) : (
              // 文字列の場合は単一のタグとして表示
              <span className={classes.tag} data-testid="tag">
                {getPublicationAuthorshipLabel(publication.authorship, language)}
              </span>
            )}
          </>
        )}
        
        {publication.type && (
          <span className={classes.tag} data-testid="tag">
            {getPublicationTypeLabel(publication.type, language)}
          </span>
        )}
        
        {publication.review && (
          <span className={classes.tag} data-testid="tag">
            {getPublicationReviewLabel(publication.review, language)}
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
                  {getPublicationPresentationTypeLabel(type, language)}
                </span>
              ))
            ) : (
              // 文字列の場合は単一のタグとして表示
              <span className={classes.tag} data-testid="tag">
                {getPublicationPresentationTypeLabel(publication.presentationType, language)}
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
          <button
            type="button"
            className={cx(classes.abstractToggle, { [classes.abstractToggleOpen]: isAbstractOpen })}
            onClick={() => setIsAbstractOpen((current) => !current)}
            aria-expanded={isAbstractOpen}
            data-testid="abstract-toggle"
          >
            {isAbstractOpen
              ? messages.publications.hideAbstract
              : messages.publications.showAbstract}
          </button>
          {isAbstractOpen && (
            <div
              className={classes.abstract}
              data-testid="abstract-content"
              aria-label={messages.publications.abstractLabel}
            >
              {abstractText}
            </div>
          )}
        </>
      )}
    </li>
  );
}

export default PublicationItem;
