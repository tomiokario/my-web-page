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
  if (record.fields) {
    return record;
  }

  return {
    id: record.id,
    fields: fromLegacyResearchmapFields(record.researchmapFields || {}),
    localMeta: record.localMeta || {},
    sync: record.sync || {},
  };
}

function fromLegacyResearchmapFields(fields) {
  const type = fields.type || 'misc';
  const title = type === 'presentations'
    ? fields.presentation_title || fields.paper_title
    : fields.paper_title || fields.presentation_title;
  const venueName = type === 'presentations'
    ? fields.event || fields.publication_name
    : fields.publication_name || fields.event;
  const contributors = localizedPeopleToContributors(
    type === 'presentations' ? fields.presenters || fields.authors : fields.authors || fields.presenters,
    type === 'presentations' ? 'presenter' : 'author'
  );

  return compactObject({
    type,
    subtype: resolveLegacySubtype(type, fields),
    title,
    contributors,
    venue: venueName
      ? compactObject({
          kind: type === 'presentations' ? 'event' : 'publication',
          name: venueName,
          promoter: fields.promoter,
          addressCountry: fields.address_country,
        })
      : undefined,
    dates: compactObject({
      published: fields.publication_date || fields.from_event_date,
      eventStart: fields.from_event_date,
      eventEnd: fields.to_event_date || fields.from_event_date,
    }),
    identifiers: fields.identifiers?.doi?.[0] ? { doi: fields.identifiers.doi[0] } : undefined,
    links: fields.see_also?.map((entry) => ({
      url: entry['@id'],
      label: entry.label || 'url',
      isDownloadable: entry.is_downloadable,
    })),
    bibliographic: compactObject({
      volume: fields.volume,
      number: fields.number,
      startPage: fields.starting_page,
      endPage: fields.ending_page,
    }),
    location: fields.location,
    description: fields.description,
    review: fields.referee,
    invited: fields.invited,
    ownerRoles: fields.published_paper_owner_roles,
    isInternational:
      type === 'presentations'
        ? fields.is_international_presentation
        : fields.is_international_journal,
  });
}

function localizedPeopleToContributors(people, role) {
  if (!people) return undefined;

  const count = Math.max(people.ja?.length || 0, people.en?.length || 0);
  const contributors = [];

  for (let index = 0; index < count; index += 1) {
    const name = compactObject({
      ja: people.ja?.[index]?.name,
      en: people.en?.[index]?.name,
    });
    if (Object.keys(name).length === 0) continue;
    contributors.push({ role, name });
  }

  return contributors.length > 0 ? contributors : undefined;
}

function resolveLegacySubtype(type, fields) {
  if (type === 'published_papers') {
    return fields.published_paper_type || fields.subtype;
  }
  if (type === 'presentations') {
    return fields.presentation_type || fields.subtype;
  }
  return fields.misc_type || fields.subtype;
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
