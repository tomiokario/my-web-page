const PUBLICATION_TYPES = new Set(['published_papers', 'misc', 'presentations']);

export function mergeWithExistingResearchmapExport(existingRecords, generatedImportLines) {
  const generatedEntries = generatedImportLines.map((line, index) => ({
    lineNumber: index + 1,
    record: JSON.parse(line),
  }));
  const publicationRecords = existingRecords
    .filter(isPublicationRecord)
    .map((record, index) => ({
      ...record,
      reservationKey: buildReservationKey(record, index),
    }));
  const nonPublicationRecords = existingRecords.filter((record) => !isPublicationRecord(record));
  const reservedExistingKeys = new Set();
  const matchedExistingKeys = new Set();
  const matchedExistingIds = new Set();
  const mergedPublicationRecords = [];
  const reversiblePublicationRecords = [];
  const quarantinedPublicationRecords = [];
  const unmatchedGenerated = [];
  const typeMismatches = [];
  const reviewItems = [];

  for (const { lineNumber, record: generatedRecord } of generatedEntries) {
    const match = findStrictMatch(
      publicationRecords.filter((record) => !reservedExistingKeys.has(record.reservationKey)),
      generatedRecord
    );

    if (match.candidates.length > 1) {
      markReservedExistingKeys(reservedExistingKeys, match.candidates);
      reviewItems.push(
        buildReviewItem(
          lineNumber,
          generatedRecord,
          `strict match (${match.strategy}) が一意に定まりません`,
          match.strategy,
          match.candidates,
          collectAmbiguousConflictingFields(match.candidates, generatedRecord)
        )
      );
      quarantinedPublicationRecords.push(generatedRecord);
      reversiblePublicationRecords.push(generatedRecord);
      unmatchedGenerated.push(summarizeRecord(generatedRecord));
      continue;
    }

    if (match.candidates.length === 1) {
      const candidate = match.candidates[0];
      const conflictingFields = collectConflictingFields(candidate, generatedRecord);

      if (candidate.insert?.type !== generatedRecord.insert?.type) {
        typeMismatches.push({
          id: candidate.insert.id,
          existingType: candidate.insert.type,
          generatedType: generatedRecord.insert.type,
          title: extractPrimaryTitle(generatedRecord),
        });
      }

      if (candidate.insert?.type !== generatedRecord.insert?.type || conflictingFields.length > 0) {
        markReservedExistingKeys(reservedExistingKeys, [candidate]);
        reviewItems.push(
          buildReviewItem(
            lineNumber,
            generatedRecord,
            conflictingFields.length > 0
              ? 'strict match は見つかりましたが保護対象 field に差分があります'
              : 'type が一致しないため review が必要です',
            match.strategy,
            [candidate],
            conflictingFields
          )
        );
        quarantinedPublicationRecords.push(generatedRecord);
        reversiblePublicationRecords.push(generatedRecord);
        unmatchedGenerated.push(summarizeRecord(generatedRecord));
        continue;
      }

      reservedExistingKeys.add(candidate.reservationKey);
      matchedExistingKeys.add(candidate.reservationKey);
      const effectiveMatchId = getEffectiveMatchId(candidate, generatedRecord);
      if (effectiveMatchId) {
        matchedExistingIds.add(effectiveMatchId);
      }
      const mergedFields = mergePayloadByOwnership(getPayload(candidate), getPayload(generatedRecord));
      const mergedRecord = {
        insert: {
          ...candidate.insert,
          id: candidate.insert.id || generatedRecord.insert.id,
          user_id: candidate.insert.user_id || generatedRecord.insert.user_id,
        },
        merge: mergedFields,
      };
      mergedPublicationRecords.push(mergedRecord);
      reversiblePublicationRecords.push(mergedRecord);
      continue;
    }

    const titleMatches = findTitleMatches(
      publicationRecords.filter((record) => !reservedExistingKeys.has(record.reservationKey)),
      generatedRecord
    );
    if (titleMatches.length > 0) {
      markReservedExistingKeys(reservedExistingKeys, titleMatches);
      titleMatches
        .filter((record) => record.insert?.type !== generatedRecord.insert?.type)
        .forEach((record) => {
          typeMismatches.push({
            id: record.insert.id,
            existingType: record.insert.type,
            generatedType: generatedRecord.insert.type,
            title: extractPrimaryTitle(generatedRecord),
          });
        });
      reviewItems.push(
        buildReviewItem(
          lineNumber,
          generatedRecord,
          'strict match に該当しない近接候補があるため review が必要です',
          'title',
          titleMatches,
          titleMatches.length === 1
            ? collectConflictingFields(titleMatches[0], generatedRecord)
            : collectAmbiguousConflictingFields(titleMatches, generatedRecord)
        )
      );
      quarantinedPublicationRecords.push(generatedRecord);
      reversiblePublicationRecords.push(generatedRecord);
      unmatchedGenerated.push(summarizeRecord(generatedRecord));
      continue;
    }

    const reservedReviewCandidates = findPotentialReviewCandidates(
      publicationRecords.filter((record) => reservedExistingKeys.has(record.reservationKey)),
      generatedRecord
    );
    if (reservedReviewCandidates.candidates.length > 0) {
      reviewItems.push(
        buildReviewItem(
          lineNumber,
          generatedRecord,
          '同一 export 内で既に review / quarantine 対象の候補に関連しています',
          reservedReviewCandidates.strategy,
          reservedReviewCandidates.candidates,
          reservedReviewCandidates.candidates.length === 1
            ? collectConflictingFields(reservedReviewCandidates.candidates[0], generatedRecord)
            : collectAmbiguousConflictingFields(reservedReviewCandidates.candidates, generatedRecord)
        )
      );
      quarantinedPublicationRecords.push(generatedRecord);
      reversiblePublicationRecords.push(generatedRecord);
      unmatchedGenerated.push(summarizeRecord(generatedRecord));
      continue;
    }

    mergedPublicationRecords.push(generatedRecord);
    reversiblePublicationRecords.push(generatedRecord);
    unmatchedGenerated.push(summarizeRecord(generatedRecord));
  }

  const unmatchedExisting = publicationRecords
    .filter((record) => !matchedExistingKeys.has(record.reservationKey))
    .map((record) => summarizeRecord(record));

  return {
    mergedLines: [...nonPublicationRecords, ...mergedPublicationRecords].map((record) => JSON.stringify(record)),
    quarantineLines: quarantinedPublicationRecords.map((record) => JSON.stringify(record)),
    reversibleLines: [...nonPublicationRecords, ...reversiblePublicationRecords].map((record) => JSON.stringify(record)),
    mergeReview: {
      existingPublicationCount: publicationRecords.length,
      generatedPublicationCount: generatedEntries.length,
      matchedCount: matchedExistingIds.size,
      unmatchedGenerated,
      unmatchedExisting,
      typeMismatches,
      reviewItems,
    },
  };
}

function isPublicationRecord(record) {
  return PUBLICATION_TYPES.has(record.insert?.type);
}

function findStrictMatch(existingRecords, generatedRecord) {
  const generatedId = generatedRecord.insert?.id;
  if (generatedId) {
    const idMatches = existingRecords.filter((record) => record.insert?.id === generatedId);
    if (idMatches.length > 0) {
      return { strategy: 'record_id', candidates: idMatches };
    }
  }

  const generatedDoi = normalizeDoiFromPayload(getPayload(generatedRecord));
  if (generatedDoi) {
    const doiMatches = existingRecords.filter(
      (record) => normalizeDoiFromPayload(getPayload(record)) === generatedDoi
    );
    if (doiMatches.length > 0) {
      return { strategy: 'doi', candidates: doiMatches };
    }
  }

  const fingerprint = buildFingerprint(generatedRecord);
  if (!isEmptyFingerprint(fingerprint)) {
    const fingerprintMatches = existingRecords.filter((record) => buildFingerprint(record) === fingerprint);
    if (fingerprintMatches.length > 0) {
      return { strategy: 'fingerprint', candidates: fingerprintMatches };
    }
  }

  return { strategy: 'fingerprint', candidates: [] };
}

function findTitleMatches(existingRecords, generatedRecord) {
  const generatedTitle = normalizeText(extractPrimaryTitle(generatedRecord));
  if (!generatedTitle) return [];

  return existingRecords.filter((record) => normalizeText(extractPrimaryTitle(record)) === generatedTitle);
}

function findPotentialReviewCandidates(existingRecords, generatedRecord) {
  const strictMatch = findStrictMatch(existingRecords, generatedRecord);
  if (strictMatch.candidates.length > 0) {
    return strictMatch;
  }

  const titleMatches = findTitleMatches(existingRecords, generatedRecord);
  if (titleMatches.length > 0) {
    return { strategy: 'title', candidates: titleMatches };
  }

  return { strategy: 'title', candidates: [] };
}

function buildFingerprint(record) {
  const payload = getPayload(record);
  const type = record.insert?.type || '';
  const subtype = payload.published_paper_type || payload.presentation_type || payload.misc_type || payload.subtype || '';
  const title = extractLocalizedTitle(record);
  const venue = extractLocalizedVenue(record);
  const promoter = extractLocalizedPromoter(record);
  const addressCountry = normalizeText(extractAddressCountry(record));
  const date = normalizeText(extractPublicationDate(record));

  return [
    type,
    subtype,
    normalizeText(title.ja || ''),
    normalizeText(title.en || ''),
    normalizeText(venue.ja || ''),
    normalizeText(venue.en || ''),
    normalizeText(promoter.ja || ''),
    normalizeText(promoter.en || ''),
    addressCountry,
    date,
  ].join('|');
}

function isEmptyFingerprint(value) {
  return value
    .split('|')
    .slice(2)
    .every((part) => !part);
}

function collectConflictingFields(existingRecord, generatedRecord) {
  const existingPayload = getPayload(existingRecord);
  const generatedPayload = getPayload(generatedRecord);
  const conflicts = [];

  const existingId = existingRecord.insert?.id || '';
  const generatedId = generatedRecord.insert?.id || '';
  if (existingId && generatedId && existingId !== generatedId) conflicts.push('id');

  const existingDoi = normalizeDoiFromPayload(existingPayload);
  const generatedDoi = normalizeDoiFromPayload(generatedPayload);
  if (existingDoi && generatedDoi && existingDoi !== generatedDoi) conflicts.push('identifiers.doi');

  const existingTitle = normalizeText(extractPrimaryTitle(existingRecord));
  const generatedTitle = normalizeText(extractPrimaryTitle(generatedRecord));
  if (
    (existingTitle && generatedTitle && existingTitle !== generatedTitle) ||
    hasLocalizedTextConflict(extractLocalizedTitle(existingRecord), extractLocalizedTitle(generatedRecord))
  ) {
    conflicts.push('title');
  }

  const existingVenue = normalizeText(extractVenue(existingRecord));
  const generatedVenue = normalizeText(extractVenue(generatedRecord));
  if (
    (existingVenue && generatedVenue && existingVenue !== generatedVenue) ||
    hasLocalizedTextConflict(extractLocalizedVenue(existingRecord), extractLocalizedVenue(generatedRecord))
  ) {
    conflicts.push('venue');
  }

  if (
    hasLocalizedTextConflict(
      extractLocalizedPromoter(existingRecord),
      extractLocalizedPromoter(generatedRecord)
    )
  ) {
    conflicts.push('venue.promoter');
  }

  const existingAddressCountry = extractAddressCountry(existingRecord);
  const generatedAddressCountry = extractAddressCountry(generatedRecord);
  if (
    existingAddressCountry &&
    generatedAddressCountry &&
    existingAddressCountry !== generatedAddressCountry
  ) {
    conflicts.push('venue.address_country');
  }

  const existingDate = extractPublicationDate(existingRecord);
  const generatedDate = extractPublicationDate(generatedRecord);
  if (existingDate && generatedDate && existingDate !== generatedDate) conflicts.push('publication_date');

  if (hasPeopleConflict(existingPayload, generatedPayload)) conflicts.push('contributors');

  collectCoreFieldConflicts(existingRecord, generatedRecord).forEach((field) => {
    conflicts.push(field);
  });

  return conflicts;
}

function collectCoreFieldConflicts(existingRecord, generatedRecord) {
  const existingPayload = getPayload(existingRecord);
  const generatedPayload = getPayload(generatedRecord);
  const conflicts = [];

  const fieldPairs = [
    ['volume', existingPayload.volume, generatedPayload.volume],
    ['number', existingPayload.number, generatedPayload.number],
    ['starting_page', existingPayload.starting_page, generatedPayload.starting_page],
    ['ending_page', existingPayload.ending_page, generatedPayload.ending_page],
    ['from_event_date', existingPayload.from_event_date, generatedPayload.from_event_date],
    ['to_event_date', existingPayload.to_event_date, generatedPayload.to_event_date],
    ['location', existingPayload.location, generatedPayload.location, 'localized-object'],
    ['description', existingPayload.description, generatedPayload.description, 'localized-object'],
    ['referee', existingPayload.referee, generatedPayload.referee],
    ['invited', existingPayload.invited, generatedPayload.invited],
    [
      'published_paper_owner_roles',
      existingPayload.published_paper_owner_roles,
      generatedPayload.published_paper_owner_roles,
    ],
    [
      getInternationalFieldName(existingRecord),
      getInternationalFieldValue(existingRecord),
      getInternationalFieldValue(generatedRecord),
    ],
  ];

  fieldPairs.forEach(([fieldName, existingValue, generatedValue, compareMode]) => {
    if (
      compareMode === 'localized-object'
        ? hasLocalizedObjectConflict(existingValue, generatedValue)
        : hasFilledValueConflict(existingValue, generatedValue)
    ) {
      conflicts.push(fieldName);
    }
  });

  return conflicts;
}

function collectAmbiguousConflictingFields(existingRecords, generatedRecord) {
  const conflicts = new Set();

  existingRecords.forEach((record) => {
    collectConflictingFields(record, generatedRecord).forEach((field) => {
      conflicts.add(field);
    });
  });

  addCandidateVarianceFields(conflicts, existingRecords);

  if (conflicts.size === 0) {
    conflicts.add('id');
  }

  return [...conflicts];
}

function addCandidateVarianceFields(conflicts, existingRecords) {
  if (hasDistinctValues(existingRecords.map((record) => record.insert?.id || ''))) {
    conflicts.add('id');
  }

  if (hasDistinctValues(existingRecords.map((record) => record.insert?.type || ''))) {
    conflicts.add('type');
  }

  if (
    hasDistinctValues(
      existingRecords.map((record) =>
        getPayload(record).published_paper_type ||
        getPayload(record).presentation_type ||
        getPayload(record).misc_type ||
        getPayload(record).subtype ||
        ''
      )
    )
  ) {
    conflicts.add('subtype');
  }

  if (
    hasDistinctValues(
      existingRecords.map((record) => normalizeDoiFromPayload(getPayload(record)))
    )
  ) {
    conflicts.add('identifiers.doi');
  }

  if (
    hasDistinctValues(existingRecords.map((record) => normalizeText(extractPrimaryTitle(record))))
  ) {
    conflicts.add('title');
  }

  if (
    hasDistinctValues(existingRecords.map((record) => normalizeText(extractVenue(record))))
  ) {
    conflicts.add('venue');
  }

  if (
    hasDistinctValues(
      existingRecords.map((record) =>
        JSON.stringify(extractLocalizedPromoter(record))
      )
    )
  ) {
    conflicts.add('venue.promoter');
  }

  if (
    hasDistinctValues(existingRecords.map((record) => extractAddressCountry(record) || ''))
  ) {
    conflicts.add('venue.address_country');
  }

  if (
    hasDistinctValues(existingRecords.map((record) => extractPublicationDate(record) || ''))
  ) {
    conflicts.add('publication_date');
  }

  if (
    hasDistinctValues(
      ['ja', 'en']
        .flatMap((locale) =>
          existingRecords.map((record) =>
            JSON.stringify(extractLocalizedPeople(getPayload(record).authors || getPayload(record).presenters, locale))
          )
        )
        .filter((value) => value !== '[]')
    )
  ) {
    conflicts.add('contributors');
  }
}

function hasDistinctValues(values) {
  return new Set(values).size > 1;
}

function hasPeopleConflict(existingPayload, generatedPayload) {
  return ['ja', 'en'].some((locale) => {
    const existingPeople = extractLocalizedPeople(
      existingPayload.authors || existingPayload.presenters,
      locale
    );
    const generatedPeople = extractLocalizedPeople(
      generatedPayload.authors || generatedPayload.presenters,
      locale
    );

    if (existingPeople.length === 0 || generatedPeople.length === 0) return false;
    if (existingPeople.length !== generatedPeople.length) return true;
    return existingPeople.some((name, index) => normalizeText(name) !== normalizeText(generatedPeople[index]));
  });
}

function flattenPeople(value = {}) {
  return [...(value.ja || []), ...(value.en || [])]
    .map((person) => person.name)
    .filter(Boolean);
}

function extractLocalizedPeople(value = {}, locale) {
  return (value?.[locale] || []).map((person) => person.name).filter(Boolean);
}

function summarizeRecord(record) {
  return {
    id: record.insert?.id,
    type: record.insert?.type || '',
    title: extractPrimaryTitle(record),
    publicationDate: extractPublicationDate(record),
  };
}

function extractPrimaryTitle(record) {
  const title = extractLocalizedTitle(record);
  return title.ja || title.en || '';
}

function extractLocalizedTitle(record) {
  const payload = getPayload(record);
  return payload.paper_title || payload.presentation_title || {};
}

function extractVenue(record) {
  const venue = extractLocalizedVenue(record);
  return venue.ja || venue.en || '';
}

function extractLocalizedVenue(record) {
  const payload = getPayload(record);
  return payload.publication_name || payload.event || {};
}

function extractLocalizedPromoter(record) {
  const payload = getPayload(record);
  return payload.promoter || {};
}

function extractAddressCountry(record) {
  return getPayload(record).address_country || '';
}

function extractPublicationDate(record) {
  const payload = getPayload(record);
  return payload.publication_date || payload.from_event_date || '';
}

function normalizeDoiFromPayload(payload) {
  const doi = payload.identifiers?.doi?.[0];
  return doi ? doi.trim().toLowerCase() : '';
}

function buildReservationKey(record, index) {
  return record.insert?.id || `__publication-${index + 1}`;
}

function getReservationKey(record) {
  return record.reservationKey || record.insert?.id || '';
}

function getEffectiveMatchId(existingRecord, generatedRecord) {
  return (
    existingRecord.insert?.id ||
    generatedRecord.insert?.id ||
    getReservationKey(existingRecord)
  );
}

function getInternationalFieldName(record) {
  return record.insert?.type === 'presentations'
    ? 'is_international_presentation'
    : 'is_international_journal';
}

function getInternationalFieldValue(record) {
  const payload = getPayload(record);
  return record.insert?.type === 'presentations'
    ? payload.is_international_presentation
    : payload.is_international_journal;
}

function hasFilledValueConflict(existingValue, generatedValue) {
  if (!isFilled(existingValue) || !isFilled(generatedValue)) return false;
  return normalizeComparableValue(existingValue) !== normalizeComparableValue(generatedValue);
}

function hasLocalizedObjectConflict(existingValue, generatedValue) {
  const locales = new Set([
    ...Object.keys(existingValue || {}),
    ...Object.keys(generatedValue || {}),
  ]);

  for (const locale of locales) {
    const existingText = normalizeText(existingValue?.[locale] || '');
    const generatedText = normalizeText(generatedValue?.[locale] || '');
    if (existingText && generatedText && existingText !== generatedText) {
      return true;
    }
  }

  return false;
}

function normalizeComparableValue(value) {
  if (Array.isArray(value)) {
    return stableValueKey(value);
  }
  if (value && typeof value === 'object') {
    return stableValueKey(value);
  }
  if (typeof value === 'string') {
    return value.trim().replace(/\s+/g, ' ');
  }
  return value;
}

function hasLocalizedTextConflict(existingValue, generatedValue) {
  return (
    hasLocalizedTextConflictForLocale(existingValue, generatedValue, 'ja') ||
    hasLocalizedTextConflictForLocale(existingValue, generatedValue, 'en')
  );
}

function hasLocalizedTextConflictForLocale(existingValue, generatedValue, locale) {
  const existingText = normalizeText(existingValue?.[locale] || '');
  const generatedText = normalizeText(generatedValue?.[locale] || '');
  return Boolean(existingText && generatedText && existingText !== generatedText);
}

function getPayload(record) {
  return record.merge || record.force || {};
}

function markReservedExistingKeys(reservedExistingKeys, records) {
  records.forEach((record) => {
    const reservationKey = getReservationKey(record);
    if (reservationKey) {
      reservedExistingKeys.add(reservationKey);
    }
  });
}

function buildReviewItem(lineNumber, generatedRecord, reason, matchStrategy, candidateRecords, conflictingFields) {
  return {
    lineNumber,
    reason,
    matchStrategy,
    sourceRecord: summarizeRecord(generatedRecord),
    candidateRecords: candidateRecords.map(summarizeRecord),
    conflictingFields,
  };
}

function mergePayloadByOwnership(existingValue, generatedValue, path = []) {
  if (generatedValue === undefined) return cloneValue(existingValue);
  if (existingValue === undefined || existingValue === null) return cloneValue(generatedValue);

  if (Array.isArray(existingValue) || Array.isArray(generatedValue)) {
    if (path[path.length - 1] === 'see_also') {
      return mergeArrayByOwnership(existingValue, generatedValue);
    }
    return isFilled(generatedValue) ? cloneValue(generatedValue) : cloneValue(existingValue);
  }

  if (typeof existingValue !== 'object' || typeof generatedValue !== 'object') {
    return isFilled(generatedValue) ? generatedValue : existingValue;
  }

  const merged = {};
  const keys = new Set([...Object.keys(generatedValue), ...Object.keys(existingValue)]);
  for (const key of keys) {
    merged[key] = mergePayloadByOwnership(existingValue[key], generatedValue[key], [...path, key]);
  }
  return compactObject(merged);
}

function mergeArrayByOwnership(existingValue, generatedValue) {
  const merged = [];
  const seen = new Set();

  for (const item of existingValue) {
    const key = getArrayMergeKey(item, 'see_also');
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(cloneValue(item));
  }

  for (const item of generatedValue) {
    const key = getArrayMergeKey(item, 'see_also');
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(cloneValue(item));
  }

  return merged;
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map((item) => cloneValue(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)]));
  }
  return value;
}

function stableValueKey(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableValueKey(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${key}:${stableValueKey(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function getArrayMergeKey(value, fieldName) {
  if (fieldName === 'see_also') {
    return normalizeText(value?.['@id'] || value?.url || '');
  }
  return stableValueKey(value);
}

function isFilled(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
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

function normalizeText(value) {
  return (value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[“”„‟]/g, '"')
    .replace(/[‘’‛]/g, "'")
    .replace(/[‐‑‒–—―ーｰ−]/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/[.,;:!?()[\]{}"'`]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
