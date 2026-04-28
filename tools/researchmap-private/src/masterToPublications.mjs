import fs from 'fs';

export function loadMasterPublications(jsonFilePath) {
  const rawRecords = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  const records = rawRecords.map(normalizeMasterRecord);

  return {
    hasBom: false,
    headers: ['id', 'fields', 'localMeta', 'sync'],
    rawHeaderLine: 'id,fields,localMeta,sync',
    records,
    publications: records.map((record, index) => mapMasterRecordToPublication(record, index)),
    sourceRows: rawRecords.map((record, index) => ({
      id: record.id,
      lineNumber: index + 2,
      rawLine: serializeSourceRow(record),
    })),
  };
}

function serializeSourceRow(record) {
  const clonedRecord = {
    ...record,
  };

  if (clonedRecord.localMeta && typeof clonedRecord.localMeta === 'object') {
    const { notes, ...restLocalMeta } = clonedRecord.localMeta;
    if (Object.keys(restLocalMeta).length > 0) {
      clonedRecord.localMeta = restLocalMeta;
    } else {
      delete clonedRecord.localMeta;
    }
  }

  return JSON.stringify(clonedRecord);
}

function normalizeMasterRecord(record) {
  if (!record?.fields) {
    throw new Error('publication_master.json は canonical fields を持つ record である必要があります');
  }

  return {
    id: record.id,
    fields: record.fields,
    localMeta: record.localMeta || {},
    sync: record.sync || {},
  };
}

function mapMasterRecordToPublication(record, index) {
  const fields = record.fields || {};
  const localMeta = record.localMeta || {};
  const webDate = deriveWebDate(fields);
  const title = fields.title || {};
  const doi = fields.identifiers?.doi || '';
  const primaryWebLink = selectPrimaryWebLink(fields.links, doi);
  const derivedAuthorship = deriveAuthorshipCodes(fields);

  return {
    id: record.id || index + 1,
    hasEmptyFields: Boolean(localMeta.hasEmptyFields),
    name: title.en || title.ja || '',
    japanese: title.ja || '',
    abstract: fields.description?.en || fields.description?.ja || '',
    type: buildResearchmapClassificationKey(fields),
    category: fields.type,
    subtype: fields.subtype,
    review: deriveReviewCode(fields.review),
    authorship: normalizeArrayOutput(derivedAuthorship),
    doi,
    webLink: primaryWebLink?.url || '',
    date: buildWebDateText(fields),
    others: formatAdditionalSeeAlsoEntries(fields.links, primaryWebLink?.url, doi),
    site: getLocalizedTextValue(fields.location),
    journalConference: getLocalizedTextValue(fields.venue?.name),
    startDate: webDate.startDate,
    endDate: webDate.endDate,
    sortableDate: webDate.sortableDate,
  };
}

function buildResearchmapClassificationKey(fields) {
  return `${fields.type}/${fields.subtype || 'others'}`;
}

function deriveReviewCode(review) {
  if (review === true) {
    return 'peer_reviewed';
  }

  if (review === false) {
    return 'not_peer_reviewed';
  }

  return '';
}

function deriveAuthorshipCodes(fields) {
  const ownerRoles = fields.ownerRoles || [];

  if (ownerRoles.length > 0) {
    return ownerRoles;
  }

  const peopleCount = fields.contributors?.length || 0;
  return peopleCount > 1 ? ['coauthor'] : [];
}

function selectPrimaryWebLink(entries, doi) {
  if (!entries?.length) {
    return undefined;
  }

  const doiUrls = buildKnownDoiUrls(doi);
  return entries.find((entry) => !doiUrls.has(entry.url.toLowerCase()));
}

function formatAdditionalSeeAlsoEntries(entries, primaryLinkUrl, doi) {
  if (!entries?.length) {
    return '';
  }

  const doiUrls = buildKnownDoiUrls(doi);

  return entries
    .filter((entry) => entry.url !== primaryLinkUrl && !doiUrls.has(entry.url.toLowerCase()))
    .map((entry) => {
      const label = entry.label?.trim() || '';
      return label && label.toLowerCase() !== 'url' ? `${label}: ${entry.url}` : entry.url;
    })
    .join('\n');
}

function buildKnownDoiUrls(doi) {
  const normalizedDoi = normalizeDoi(doi);
  if (!normalizedDoi) {
    return new Set();
  }

  return new Set([
    `https://doi.org/${normalizedDoi}`,
    `http://doi.org/${normalizedDoi}`,
    `https://dx.doi.org/${normalizedDoi}`,
    `http://dx.doi.org/${normalizedDoi}`,
  ]);
}

function normalizeDoi(doi) {
  return doi.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').toLowerCase();
}

function deriveWebDate(fields) {
  const published = fields.dates?.published || '';
  const eventStart = fields.dates?.eventStart || published;
  const eventEnd = fields.dates?.eventEnd || '';

  if (fields.type === 'published_papers') {
    return {
      startDate: eventStart,
      endDate: eventEnd,
      sortableDate: published,
    };
  }

  return {
    startDate: eventStart,
    endDate: eventEnd || eventStart,
    sortableDate: eventStart,
  };
}

function buildWebDateText(fields) {
  const published = fields.dates?.published || '';
  const start = fields.dates?.eventStart || published;
  const end = fields.dates?.eventEnd || '';

  if (fields.type === 'published_papers') {
    return published || start;
  }

  if (!start) {
    return '';
  }

  return end && end !== start ? `${start} → ${end}` : start;
}

function getLocalizedTextValue(value) {
  return value?.en || value?.ja || '';
}

function normalizeArrayOutput(values) {
  if (!values || values.length === 0) {
    return '';
  }

  return values.length === 1 ? values[0] : values;
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (item === undefined || item === null) return false;
      if (Array.isArray(item)) return item.length > 0;
      if (typeof item === 'object') return Object.keys(item).length > 0;
      return true;
    })
  );
}
