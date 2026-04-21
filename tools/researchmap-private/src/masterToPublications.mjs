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
  const startDate = fields.dates?.eventStart || fields.dates?.published || '';
  const endDate = fields.dates?.eventEnd || fields.dates?.eventStart || fields.dates?.published || '';
  const title = fields.title || {};
  const derivedAuthorship = deriveAuthorshipLabels(fields);
  const derivedPresentationType = derivePresentationTypeLabels(fields);

  return {
    id: record.id || index + 1,
    hasEmptyFields: Boolean(localMeta.hasEmptyFields),
    name: title.en || title.ja || '',
    japanese: title.ja || '',
    abstract: fields.description?.en || fields.description?.ja || '',
    type: getLegacyTypeLabel(fields),
    review: fields.review === true ? 'Reviewed' : fields.review === false ? 'Not reviewed' : '',
    authorship: normalizeArrayOutput(derivedAuthorship),
    presentationType: normalizeArrayOutput(derivedPresentationType),
    doi: fields.identifiers?.doi || '',
    webLink: fields.links?.[0]?.url || '',
    date: buildLegacyDateText(fields),
    others: '',
    site: getLocalizedTextValue(fields.location),
    journalConference: getLocalizedTextValue(fields.venue?.name),
    startDate,
    endDate,
    sortableDate: startDate,
  };
}

function getLegacyTypeLabel(fields) {
  if (fields.type === 'published_papers' && fields.subtype === 'scientific_journal') {
    return 'Journal paper：原著論文';
  }

  if (fields.type === 'misc' && fields.subtype === 'introduction_scientific_journal') {
    return 'Invited paper：招待論文';
  }

  if (
    fields.type === 'published_papers' &&
    fields.subtype === 'international_conference_proceedings'
  ) {
    return 'Research paper (international conference)：国際会議';
  }

  if (fields.type === 'misc' && fields.subtype === 'summary_national_conference') {
    return 'Research paper (domestic conference)：国内会議';
  }

  return 'Miscellaneous';
}

function deriveAuthorshipLabels(fields) {
  const ownerRoleMap = {
    lead: 'Lead author',
    corresponding: 'Corresponding author',
    last: 'Last author',
  };
  const ownerRoles = fields.ownerRoles || [];

  if (ownerRoles.length > 0) {
    return ownerRoles.map((role) => ownerRoleMap[role] || role);
  }

  const peopleCount = fields.contributors?.length || 0;
  return peopleCount > 1 ? ['Co-author'] : [];
}

function derivePresentationTypeLabels(fields) {
  const presentationTypeMap = {
    oral_presentation: 'Oral',
    poster_presentation: 'Poster',
    invited_oral_presentation: 'Invited',
    keynote_oral_presentation: 'Keynote',
    public_symposium: 'Public symposium',
    others: 'Other',
  };

  return fields.type === 'presentations' && fields.subtype
    ? [presentationTypeMap[fields.subtype] || fields.subtype]
    : [];
}

function buildLegacyDateText(fields) {
  const start = fields.dates?.eventStart || fields.dates?.published || '';
  const end = fields.dates?.eventEnd || '';

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
