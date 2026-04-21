export function reconstructCitationFromImportLine(importLine) {
  const record = typeof importLine === 'string' ? JSON.parse(importLine) : importLine;
  const payload = record.merge || record.force || {};
  const title = pickLocalizedText(payload.paper_title || payload.presentation_title);
  const venue = pickLocalizedText(payload.publication_name || payload.event);
  const volume = payload.volume ? `vol. ${payload.volume}` : '';
  const number = payload.number ? `no. ${payload.number}` : '';
  const pages = formatPages(payload.starting_page, payload.ending_page);
  const publisher = pickLocalizedText(payload.publisher);
  const date = payload.publication_date || payload.from_event_date || '';

  return [title, venue, volume, number, pages, publisher, date].filter(Boolean).join(', ');
}

export function normalizeCitationForComparison(value) {
  return (value || '')
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[，、]/g, ',')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\bpages?\b/g, 'pp.')
    .replace(/\bp\.\s*(\d+)/g, 'pp. $1-$1')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\(\s*/g, '(')
    .replace(/\s*\)/g, ')')
    .trim();
}

export function canonicalizeCitation(value) {
  const normalized = normalizeCitationForComparison(value);
  const volume = firstMatch(normalized, [
    /\bvol\.?\s*([a-z0-9.-]+)/i,
    /\b(\d+)\s*\(\s*[a-z0-9.-]{1,10}\s*\)\s*,\s*pp?\.?\s*[a-z]?\d+/i,
    /\b([0-9]+),\s*[0-9]+-[0-9]+\s*\(\d{4}\)/i,
  ]);
  const number = firstMatch(normalized, [
    /(?:^|,)\s*no\.?\s*([a-z0-9_/-]+)(?=\s*(?:,|\(|$))/i,
    /\b\d+\s*\(\s*([a-z0-9.-]{1,10})\s*\)\s*,\s*pp?\.?\s*[a-z]?\d+/i,
    /(?:^|,)\s*paper\s+([a-z0-9_/-]+)(?=\s*(?:,|\(|$))/i,
    /(?:^|,)\s*((?=[a-z0-9/-]*[a-z])[a-z0-9]{1,4}(?:-[a-z0-9]+)+(?:\/(?=[a-z0-9/-]*[a-z])[a-z0-9]{1,4}(?:-[a-z0-9]+)+)?)(?=\s*(?:,|\(|$))/i,
  ]);
  const pageRange = firstGroups(normalized, [/\bpp\.?\s*([a-z]?\d+)\s*-\s*([a-z]?\d+)/i, /\b([0-9]+)\s*,\s*([0-9]+)-([0-9]+)\s*\(\d{4}\)/i]);
  const venue = inferVenue(normalized);
  const date = firstMatch(normalized, [/\b\d{4}-\d{2}-\d{2}\b/, /\(\w{3}\.?\s+\d{4}\)/i, /\(\d{4}\)/]);

  return [venue, volume ? `vol. ${volume}` : '', number ? `no. ${number}` : '', formatCanonicalPages(pageRange), canonicalizeDate(date)]
    .filter(Boolean)
    .join(', ');
}

export function bibliographicFingerprint(value) {
  const normalized = normalizeCitationForComparison(value);
  const volume = firstMatch(normalized, [
    /\bvol\.?\s*([a-z0-9.-]+)/i,
    /\b(\d+)\s*\(\s*[a-z0-9.-]{1,10}\s*\)\s*,\s*pp?\.?\s*[a-z]?\d+/i,
    /\b([0-9]+),\s*[0-9]+-[0-9]+\s*\(\d{4}\)/i,
  ]);
  const number = firstMatch(normalized, [
    /(?:^|,)\s*no\.?\s*([a-z0-9_/-]+)(?=\s*(?:,|\(|$))/i,
    /\b\d+\s*\(\s*([a-z0-9.-]{1,10})\s*\)\s*,\s*pp?\.?\s*[a-z]?\d+/i,
    /(?:^|,)\s*paper\s+([a-z0-9_/-]+)(?=\s*(?:,|\(|$))/i,
    /(?:^|,)\s*((?=[a-z0-9/-]*[a-z])[a-z0-9]{1,4}(?:-[a-z0-9]+)+(?:\/(?=[a-z0-9/-]*[a-z])[a-z0-9]{1,4}(?:-[a-z0-9]+)+)?)(?=\s*(?:,|\(|$))/i,
  ]);
  const pageRange = firstGroups(normalized, [/\bpp\.?\s*([a-z]?\d+)\s*-\s*([a-z]?\d+)/i, /\b([0-9]+)\s*,\s*([0-9]+)-([0-9]+)\s*\(\d{4}\)/i]);
  const date = firstMatch(normalized, [/\b\d{4}-\d{2}-\d{2}\b/, /\(\w{3}\.?\s+\d{4}\)/i, /\(\d{4}\)/]);

  return [
    volume ? `vol.${volume}` : '',
    number ? `no.${number}` : '',
    pageRange ? `pp.${pageRange[0]}-${pageRange[1]}` : '',
    canonicalizeDate(date),
  ]
    .filter(Boolean)
    .join('|');
}

export function titleVenueFingerprint(value) {
  const normalized = normalizeCitationForComparison(value);
  const title = inferTitle(normalized);
  const venue = inferVenue(normalized);
  return [title, venue].filter(Boolean).join('|');
}

export function decomposeCitation(value) {
  const normalized = normalizeCitationForComparison(value);
  return {
    title: inferTitle(normalized),
    venue: inferVenue(normalized),
  };
}

export function extractComparableCitationFromSource(publication) {
  const bibliographic = extractBibliographicSegment(publication.name || '');
  if (!bibliographic) return '';

  const normalizedDate = normalizeSourceDate(publication.date || '');
  return [bibliographic, normalizedDate].filter(Boolean).join(', ');
}

export function extractSourceTitleVenue(publication) {
  const normalized = normalizeQuotes(publication.name || '');
  const titleMatch = normalized.match(/"([^"]+)"|「([^」]+)」/);
  const rawTitle = titleMatch
    ? (titleMatch[1] || titleMatch[2] || '')
    : (publication.name || publication.japanese || '');
  const title = rawTitle.trim().replace(/[,\uFF0C\u3001]+$/u, '');
  const venue = extractSourceVenue(publication, normalized);
  return {
    title: normalizeCitationForComparison(title),
    venue: normalizeCitationForComparison(venue),
  };
}

export function sourceTitleVenueFingerprint(publication) {
  const source = extractSourceTitleVenue(publication);
  return [source.title, source.venue].filter(Boolean).join('|');
}

export function sourceCitationFingerprint(publication) {
  const source = extractSourceTitleVenue(publication);
  const bibliographic = bibliographicFingerprint(extractComparableCitationFromSource(publication));
  return [source.title, source.venue, bibliographic].filter(Boolean).join('|');
}

export function reconstructedCitationFingerprint(importLine) {
  const reconstructed = reconstructCitationFromImportLine(importLine);
  const parts = decomposeCitation(reconstructed);
  const bibliographic = bibliographicFingerprint(reconstructed);
  return [parts.title, parts.venue, bibliographic].filter(Boolean).join('|');
}

export function sourceComparableFingerprint(publication, recordType) {
  const source = extractSourceTitleVenue(publication);
  const date = normalizeSourceDate(publication.date || publication.startDate || '');
  if (recordType === 'presentations') {
    return [source.title, source.venue, date].filter(Boolean).join('|');
  }
  const bibliographic = bibliographicFingerprint(extractComparableCitationFromSource(publication));
  return [source.title, source.venue, bibliographic].filter(Boolean).join('|');
}

export function importComparableFingerprint(importLine) {
  const record = typeof importLine === 'string' ? JSON.parse(importLine) : importLine;
  if (record.insert?.type === 'presentations') {
    const reconstructed = decomposeCitation(reconstructCitationFromImportLine(record));
    const payload = record.merge || record.force || {};
    const date = payload.publication_date || payload.from_event_date || '';
    return [reconstructed.title, reconstructed.venue, date].filter(Boolean).join('|');
  }
  return reconstructedCitationFingerprint(record);
}

function extractBibliographicSegment(value) {
  const normalized = normalizeQuotes(value);
  const titleMatch = normalized.match(/"[^"]+"|「[^」]+」/);
  if (!titleMatch) return normalized.trim();
  return normalized.slice(titleMatch.index + titleMatch[0].length).replace(/^[,\s]+/, '').trim();
}

function pickLocalizedText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.en || value.ja || '';
}

function formatPages(startingPage, endingPage) {
  if (!startingPage) return '';
  if (endingPage && endingPage !== startingPage) return `pp. ${startingPage}-${endingPage}`;
  return `pp. ${startingPage}-${startingPage}`;
}

function normalizeSourceDate(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const firstDate = trimmed.split('→')[0].trim();
  const fullDate = firstDate.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (fullDate) return `${fullDate[1]}-${fullDate[2].padStart(2, '0')}-${fullDate[3].padStart(2, '0')}`;
  const yearMonth = firstDate.match(/(\d{4})年(\d{1,2})月/);
  if (yearMonth) return `${yearMonth[1]}-${yearMonth[2].padStart(2, '0')}`;
  const yearOnly = firstDate.match(/(\d{4})年/);
  if (yearOnly) return yearOnly[1];
  return trimmed;
}

function firstMatch(value, patterns) {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
    if (match?.[0] && !match[1]) return match[0];
  }
  return '';
}

function firstGroups(value, patterns) {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (!match) continue;
    if (match.length >= 3) {
      if (pattern.source.includes('\\s*,\\s*([0-9]+)-([0-9]+)')) return [match[2], match[3]];
      return [match[1], match[2]];
    }
  }
  return undefined;
}

function inferVenue(value) {
  const segments = value.split(',').map((item) => item.trim()).filter(Boolean);
  for (const segment of segments) {
    if (/\b(vol\.|no\.|pp\.|\d{4}-\d{2}-\d{2}|\d{4}\)|paper\b)/i.test(segment)) continue;
    if (segment.includes('"')) continue;
    if (segment === inferTitle(value)) continue;
    return segment;
  }
  return '';
}

function inferTitle(value) {
  const segments = value.split(',').map((item) => item.trim()).filter(Boolean);
  return segments[0] || '';
}

function formatCanonicalPages(pageRange) {
  if (!pageRange) return '';
  return `pp. ${pageRange[0]}-${pageRange[1]}`;
}

function canonicalizeDate(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const monthYear = value.match(/\(?([a-z]{3})\.?\s+(\d{4})\)?/i);
  if (monthYear) return `${monthYear[2]}-${monthNameToNumber(monthYear[1])}`;
  const yearOnly = value.match(/\(?(\d{4})\)?/);
  if (yearOnly) return yearOnly[1];
  return value;
}

function monthNameToNumber(value) {
  const months = {
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12',
  };
  return months[value.toLowerCase()] || value.toLowerCase();
}

function normalizeQuotes(value) {
  return value.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
}

function extractSourceVenue(publication, normalizedName) {
  const journalConference = (publication.journalConference || '').trim();
  if (journalConference) return journalConference;

  const titleMatch = normalizedName.match(/"([^"]+)"|「([^」]+)」/);
  const afterTitle = titleMatch
    ? normalizedName.slice((titleMatch.index || 0) + titleMatch[0].length).replace(/^[,\s]+/, '')
    : normalizedName;
  const segments = afterTitle.split(',').map((item) => item.trim()).filter(Boolean);
  return segments[0] || '';
}
