import {
  importComparableFingerprint,
  reconstructedCitationFingerprint,
  sourceCitationFingerprint,
  sourceComparableFingerprint,
} from './researchmapCitationRoundTrip.mjs';

export function buildReversibleExport(publications, importLines, csvMetadata) {
  const importRecords = importLines
    .map((line) => JSON.parse(line))
    .filter((record) => ['published_papers', 'misc', 'presentations'].includes(record.insert?.type));
  const unusedImportIndexes = new Set(importRecords.map((_, index) => index));

  return {
    version: 1,
    hasBom: csvMetadata.hasBom,
    headers: csvMetadata.headers,
    rawHeaderLine: csvMetadata.rawHeaderLine,
    rows: publications.map((publication, index) => {
      const match = findMatchingImportRecord(publication, importRecords, unusedImportIndexes);
      return {
        id: publication.id,
        lineNumber: csvMetadata.sourceRows[index]?.lineNumber,
        rawLine: csvMetadata.sourceRows[index]?.rawLine || '',
        importRecord: match?.record || null,
        matchStrategy: match?.strategy || 'unmatched',
        sourceFingerprint: sourceCitationFingerprint(publication),
        importFingerprint: match?.record ? reconstructedCitationFingerprint(match.record) : '',
        sourceComparableFingerprint: match?.record
          ? sourceComparableFingerprint(publication, match.record.insert?.type)
          : '',
        importComparableFingerprint: match?.record ? importComparableFingerprint(match.record) : '',
      };
    }),
  };
}

function findMatchingImportRecord(publication, importRecords, unusedImportIndexes) {
  const comparableFingerprints = new Map(
    [...unusedImportIndexes].map((index) => {
      const record = importRecords[index];
      return [index, sourceComparableFingerprint(publication, record.insert?.type)];
    })
  );

  const exactComparableMatches = [...unusedImportIndexes].filter((index) => {
    return importComparableFingerprint(importRecords[index]) === comparableFingerprints.get(index);
  });
  if (exactComparableMatches.length === 1) {
    const index = exactComparableMatches[0];
    unusedImportIndexes.delete(index);
    return {
      index,
      score: 250,
      record: importRecords[index],
      strategy: 'comparable-fingerprint',
    };
  }

  const sourceFingerprint = sourceCitationFingerprint(publication);
  if (sourceFingerprint) {
    const exactMatches = [...unusedImportIndexes].filter((index) => {
      return reconstructedCitationFingerprint(importRecords[index]) === sourceFingerprint;
    });
    if (exactMatches.length === 1) {
      const index = exactMatches[0];
      unusedImportIndexes.delete(index);
      return {
        index,
        score: 200,
        record: importRecords[index],
        strategy: 'fingerprint',
      };
    }
  }

  const publicationDoi = normalizeDoi(publication.doi);
  if (publicationDoi) {
    const doiMatches = [...unusedImportIndexes].filter((index) => {
      const payload = importRecords[index].merge || importRecords[index].force || {};
      return normalizeDoi(payload.identifiers?.doi?.[0]) === publicationDoi;
    });
    if (doiMatches.length === 1) {
      const index = doiMatches[0];
      unusedImportIndexes.delete(index);
      return {
        index,
        record: importRecords[index],
        strategy: 'doi',
      };
    }
  }

  const metadataMatches = [...unusedImportIndexes].filter((index) => {
    const payload = importRecords[index].merge || importRecords[index].force || {};
    return (
      normalizeText(publication.startDate || publication.date) === normalizeText(payload.publication_date) &&
      normalizeText(publication.journalConference) === normalizeText(payload.publication_name?.en || payload.publication_name?.ja || payload.event?.en || payload.event?.ja) &&
      normalizeText(extractPublicationTitle(publication)) === normalizeText(payload.paper_title?.en || payload.paper_title?.ja || payload.presentation_title?.en || payload.presentation_title?.ja)
    );
  });
  if (metadataMatches.length === 1) {
    const index = metadataMatches[0];
    unusedImportIndexes.delete(index);
    return {
      index,
      record: importRecords[index],
      strategy: 'metadata-fingerprint',
    };
  }

  return null;
}

function extractPublicationTitle(publication) {
  const value = (publication.name || publication.japanese || '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  const match = value.match(/"([^"]+)"|「([^」]+)」/);
  return (match?.[1] || match?.[2] || value).trim();
}

function normalizeText(value) {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[.,;:)\]]+$/g, '')
    .replace(/\s+/g, ' ');
}

function normalizeDoi(value) {
  return (value || '').trim().replace(/^https?:\/\/doi\.org\//i, '').toLowerCase();
}
