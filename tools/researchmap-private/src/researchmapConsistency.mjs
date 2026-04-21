import {
  extractSourceTitleVenue,
  importComparableFingerprint,
  sourceComparableFingerprint,
} from './researchmapCitationRoundTrip.mjs';

export function analyzeResearchmapConsistency(publications, importLines) {
  const records = importLines.map((line) => (typeof line === 'string' ? JSON.parse(line) : line));
  const items = publications.map((publication, index) => {
    const record = records[index];
    const issues = [];
    const warnings = [];

    if (!record) {
      issues.push({
        code: 'missing_import_record',
        message: `Import record is missing at index=${index}`,
      });

      return {
        publicationId: publication.id,
        type: '',
        title: '',
        issues,
        warnings,
      };
    }

    const payload = record?.merge || record?.force || {};
    const title = payload.paper_title || payload.presentation_title || {};
    const people = payload.authors || payload.presenters || {};
    const venue = payload.publication_name || payload.event || {};

    const sourceTitles = extractSourceTitles(publication);
    const sourceVenue = publication.journalConference || '';
    const sourceDoi = normalizeDoi(publication.doi);
    const importDoi = payload.identifiers?.doi?.[0] || '';
    const comparableSource = sourceComparableFingerprint(publication, record.insert?.type);
    const comparableImport = importComparableFingerprint(record);

    if ((publication.startDate || '') !== (payload.publication_date || '')) {
      issues.push({
        code: 'date_mismatch',
        message: `publication_date mismatch: source=${publication.startDate || ''} import=${payload.publication_date || ''}`,
      });
    }

    if ((sourceDoi || importDoi) && sourceDoi !== importDoi) {
      issues.push({
        code: 'doi_mismatch',
        message: `DOI mismatch: source=${sourceDoi} import=${importDoi}`,
      });
    }

    if (sourceTitles.ja && title.ja && sourceTitles.ja !== title.ja) {
      issues.push({
        code: 'ja_title_mismatch',
        message: `Japanese title mismatch: source=${sourceTitles.ja} import=${title.ja}`,
      });
    }

    if (sourceTitles.en && title.en && sourceTitles.en !== title.en) {
      issues.push({
        code: 'en_title_mismatch',
        message: `English title mismatch: source=${sourceTitles.en} import=${title.en}`,
      });
    }

    if (sourceVenue && venue.ja && sourceVenue !== venue.ja && !isLocalizedVenuePair(sourceVenue, venue.ja)) {
      issues.push({
        code: 'ja_venue_mismatch',
        message: `Japanese venue mismatch: source=${sourceVenue} import=${venue.ja}`,
      });
    }

    if (sourceVenue && venue.en && sourceVenue !== venue.en && !isLocalizedVenuePair(sourceVenue, venue.en)) {
      issues.push({
        code: 'en_venue_mismatch',
        message: `English venue mismatch: source=${sourceVenue} import=${venue.en}`,
      });
    }

    if (comparableSource !== comparableImport) {
      issues.push({
        code: 'bibliography_mismatch',
        message: `Comparable bibliography mismatch: source=${comparableSource} import=${comparableImport}`,
      });
    }

    const sourceAuthors = extractSourceAuthors(publication);
    const importJaAuthors = flattenNames(people.ja);
    const importEnAuthors = flattenNames(people.en);
    if (sourceAuthors.ja.length && importJaAuthors.length && !sameOrderedNames(sourceAuthors.ja, importJaAuthors)) {
      issues.push({
        code: 'ja_authors_mismatch',
        message: `Japanese author mismatch: source=${sourceAuthors.ja.join(' / ')} import=${importJaAuthors.join(' / ')}`,
      });
    }
    if (sourceAuthors.en.length && importEnAuthors.length && !sameOrderedNames(sourceAuthors.en, importEnAuthors)) {
      issues.push({
        code: 'en_authors_mismatch',
        message: `English author mismatch: source=${sourceAuthors.en.join(' / ')} import=${importEnAuthors.join(' / ')}`,
      });
    }

    if (payload.languages?.includes('jpn') && title.en && containsJapanese(title.en)) {
      warnings.push({
        code: 'japanese_fallback_in_en_title',
        message: 'languages=jpn but title.en still contains Japanese fallback text',
      });
    }

    if (payload.languages?.includes('jpn') && !venue.ja && venue.en) {
      warnings.push({
        code: 'jpn_with_en_only_venue',
        message: 'languages=jpn but venue is stored only in en',
      });
    }

    if (payload.languages?.includes('jpn') && payload.location?.en && !payload.location?.ja) {
      warnings.push({
        code: 'jpn_with_en_only_location',
        message: 'languages=jpn but location is stored only in en',
      });
    }

    return {
      publicationId: publication.id,
      type: record.insert?.type || '',
      title: pickLocalized(title),
      issues,
      warnings,
    };
  });

  return {
    issues: items.filter((item) => item.issues.length > 0),
    warnings: items.filter((item) => item.warnings.length > 0),
  };
}

function extractSourceTitles(publication) {
  const fromJapanese = extractQuotedTitle(publication.japanese || '');
  const fromName = extractQuotedTitle(publication.name || '');
  const hasJapaneseTitle = fromJapanese || containsJapanese(fromName);

  return {
    ja: fromJapanese || (hasJapaneseTitle ? fromName : ''),
    en: hasJapaneseTitle ? '' : fromName,
  };
}

function extractQuotedTitle(value) {
  const normalized = normalizeQuotes(value);
  const match = normalized.match(/"([^"]+)"|「([^」]+)」|“([^”]+)”/);
  return (match?.[1] || match?.[2] || match?.[3] || '').trim().replace(/[,\uFF0C\u3001]+$/u, '');
}

function extractSourceAuthors(publication) {
  return {
    ja: extractQuotedAuthors(publication.japanese || '', 'ja'),
    en: extractQuotedAuthors(publication.name || '', 'en'),
  };
}

function extractQuotedAuthors(value, language) {
  const source = normalizeQuotes(value);
  const titleMatch = source.match(/"([^"]+)"|「([^」]+)」|“([^”]+)”/);
  const segment = titleMatch ? source.slice(0, titleMatch.index).trim() : '';
  if (!segment) return [];
  const normalized =
    language === 'ja'
      ? segment.replace(/、/g, ',').replace(/，/g, ',')
      : segment.replace(/\s+and\s+/gi, ',').replace(/，/g, ',').replace(/、/g, ',');
  return normalized
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function flattenNames(value = []) {
  return value.map((item) => item.name).filter(Boolean);
}

function sameOrderedNames(left, right) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function pickLocalized(value) {
  return value?.ja || value?.en || '';
}

function containsJapanese(value) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(value || '');
}

function normalizeDoi(value) {
  return (value || '').trim().replace(/^https?:\/\/doi\.org\//i, '');
}

function normalizeQuotes(value) {
  return (value || '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
}

function isLocalizedVenuePair(sourceVenue, importVenue) {
  const knownPairs = new Map([
    ['Photonics NEWS', 'フォトニクスニュース'],
  ]);
  return knownPairs.get(sourceVenue) === importVenue;
}
