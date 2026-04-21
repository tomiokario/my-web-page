import { researchmapClassificationRules } from './researchmapClassificationRules.mjs';

const USER_ID_PLACEHOLDER = '__RESEARCHMAP_USER_ID__';

export function generateResearchmapExport(items, options = {}) {
  const researchmapUserId = options.researchmapUserId?.trim() || USER_ID_PLACEHOLDER;
  const normalizedItems = items.map((item) => normalizeExportSource(item));
  const exportItems = normalizedItems.map((item) => buildImportAction(item, researchmapUserId));

  return {
    importLines: exportItems.map((item) => JSON.stringify(item.action)),
    manualReviewItems: exportItems.filter((item) => item.review.reasons.length > 0).map((item) => item.review),
  };
}

function buildImportAction(source, fallbackUserId) {
  const fields = source.record.fields;
  const sync = source.record.sync?.researchmap || {};
  const researchmapUserId = sync.userId?.trim() || fallbackUserId;
  const reasons = [...source.review.reasons];
  const questions = [...source.review.questions];

  if (researchmapUserId === USER_ID_PLACEHOLDER) {
    reasons.push('researchmap の会員IDが未設定です');
    questions.push('researchmap の会員ID（Rから始まるID）を教えてください。');
  }
  if (!fields.title?.ja && !fields.title?.en) {
    reasons.push('タイトルを抽出できませんでした');
    questions.push('この業績の正式タイトルを日本語または英語で教えてください。');
  }
  if (!fields.contributors?.length) {
    reasons.push('著者を抽出できませんでした');
    questions.push('著者一覧を論文表記どおりに教えてください。');
  }

  const payload = buildResearchmapPayload(fields);
  const insert = compactObject({
    type: fields.type,
    user_id: researchmapUserId,
    id: sync.recordId,
  });
  const action = sync.recordId
    ? { insert, merge: payload }
    : { insert: compactObject({ type: fields.type, user_id: researchmapUserId }), force: payload };

  return {
    action,
    review: {
      publicationId: source.record.id,
      publicationName: pickLocalized(fields.title),
      reasons: unique(reasons),
      suggestedQuestions: unique(questions),
      tentativeType: fields.type,
    },
  };
}

function buildResearchmapPayload(fields) {
  const contributorRole = fields.type === 'presentations' ? 'presenter' : 'author';
  const localizedContributors = contributorsToLocalizedPeople(fields.contributors, contributorRole);
  const publicationDate = fields.dates?.published || fields.dates?.eventStart;

  return compactObject({
    ...(fields.type === 'presentations'
      ? {
          presentation_title: fields.title,
          presenters: localizedContributors,
          event: fields.venue?.name,
          presentation_type: fields.subtype,
          from_event_date: fields.dates?.eventStart || publicationDate,
          to_event_date: fields.dates?.eventEnd || fields.dates?.eventStart || publicationDate,
          is_international_presentation: fields.isInternational,
          promoter: fields.venue?.promoter,
          address_country: fields.venue?.addressCountry,
        }
      : {
          paper_title: fields.title,
          authors: localizedContributors,
          publication_name: fields.venue?.name,
          published_paper_type: fields.type === 'published_papers' ? fields.subtype : undefined,
          misc_type: fields.type === 'misc' ? fields.subtype : undefined,
          is_international_journal: fields.isInternational,
        }),
    publication_date: publicationDate,
    languages: inferLanguages(fields.title),
    identifiers: fields.identifiers?.doi ? { doi: [fields.identifiers.doi] } : undefined,
    see_also: fields.links?.map((link) =>
      compactObject({
        '@id': link.url,
        label: link.label || 'url',
        is_downloadable: link.isDownloadable,
      })
    ),
    volume: fields.bibliographic?.volume,
    number: fields.bibliographic?.number,
    starting_page: fields.bibliographic?.startPage,
    ending_page: fields.bibliographic?.endPage,
    location: fields.location,
    description: fields.description,
    referee: fields.review,
    invited: fields.invited,
    published_paper_owner_roles: fields.ownerRoles,
  });
}

function normalizeExportSource(item) {
  if (item?.fields || item?.researchmapFields) {
    return normalizeMasterSource(item);
  }

  return normalizePublicationSource(item);
}

function normalizeMasterSource(record) {
  const normalizedRecord = record.fields
    ? record
    : {
        id: record.id,
        fields: fromLegacyResearchmapFields(record.researchmapFields || {}),
        localMeta: record.localMeta || {},
        sync: record.sync || {},
      };

  return {
    record: normalizedRecord,
    review: {
      reasons: [],
      questions: [],
    },
  };
}

function normalizePublicationSource(publication) {
  const classification = classifyPublication(publication);
  const englishDetails = extractTitleAndAuthors(publication.name || '', 'en');
  const japaneseDetails = extractTitleAndAuthors(publication.japanese || '', 'ja');
  const title = buildLocalizedTitle(japaneseDetails.title, englishDetails.title);
  const contributors = buildContributors(englishDetails.authors, japaneseDetails.authors, classification.type);
  const identifiers = normalizeDoi(publication.doi) ? { doi: normalizeDoi(publication.doi) } : undefined;
  const links = buildLinks(publication.webLink);
  const reasons = [];
  const questions = [];

  if (classification.requiresReview) {
    reasons.push(classification.reviewReason);
    questions.push(classification.reviewQuestion);
  }

  return {
    record: compactObject({
      id: publication.id,
      fields: compactObject({
        type: classification.type,
        subtype: classification.subtype,
        title,
        contributors,
        venue: compactObject({
          kind: classification.type === 'presentations' ? 'event' : 'publication',
          name: buildPublicationName(publication.journalConference),
          promoter:
            classification.type === 'presentations'
              ? buildPublicationName(extractPromoter(publication))
              : undefined,
          addressCountry:
            classification.type === 'presentations'
              ? inferCountryCode(publication.site)
              : undefined,
        }),
        dates: compactObject({
          published: publication.startDate || normalizePublicationDate(publication.date),
          eventStart:
            classification.type === 'presentations'
              ? publication.startDate || normalizePublicationDate(publication.date)
              : undefined,
          eventEnd:
            classification.type === 'presentations'
              ? publication.endDate || publication.startDate || normalizePublicationDate(publication.date)
              : undefined,
        }),
        identifiers,
        links,
        bibliographic: compactObject(extractBibliographicInfo(publication)),
        location: buildPublicationName(publication.site),
        description: buildDescription(publication.abstract),
        review: resolveReferee(publication, classification),
        invited: resolveInvited(publication, classification),
        ownerRoles: mapOwnerRoles(publication.authorship),
        isInternational: classification.isInternational,
      }),
      localMeta: {
        hasEmptyFields: Boolean(publication.hasEmptyFields),
        notes: '',
      },
    }),
    review: {
      reasons,
      questions,
    },
  };
}

function fromLegacyResearchmapFields(fields) {
  const type = fields.type || 'misc';
  const title = type === 'presentations'
    ? fields.presentation_title || fields.paper_title
    : fields.paper_title || fields.presentation_title;
  const contributors = localizedPeopleToContributors(
    type === 'presentations' ? fields.presenters || fields.authors : fields.authors || fields.presenters,
    type === 'presentations' ? 'presenter' : 'author'
  );
  const venueName = type === 'presentations'
    ? fields.event || fields.publication_name
    : fields.publication_name || fields.event;

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

function resolveLegacySubtype(type, fields) {
  if (type === 'published_papers') {
    return fields.published_paper_type || fields.subtype;
  }
  if (type === 'presentations') {
    return fields.presentation_type || fields.subtype;
  }
  return fields.misc_type || fields.subtype;
}

function contributorsToLocalizedPeople(contributors, role) {
  const scoped = (contributors || []).filter((contributor) => contributor.role === role);
  if (scoped.length === 0) return undefined;

  const ja = scoped
    .map((contributor) => contributor.name?.ja)
    .filter(Boolean)
    .map((name) => ({ name }));
  const en = scoped
    .map((contributor) => contributor.name?.en)
    .filter(Boolean)
    .map((name) => ({ name }));

  return compactObject({ ja, en });
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

function buildContributors(enAuthors, jaAuthors, type) {
  const resolvedJaAuthors = jaAuthors.length ? jaAuthors : enAuthors.filter((name) => containsJapanese(name));
  const resolvedEnAuthors = enAuthors.filter((name) => !containsJapanese(name));
  const count = Math.max(resolvedJaAuthors.length, resolvedEnAuthors.length);
  const role = type === 'presentations' ? 'presenter' : 'author';
  const contributors = [];

  for (let index = 0; index < count; index += 1) {
    const name = compactObject({
      ja: resolvedJaAuthors[index],
      en: resolvedEnAuthors[index],
    });
    if (Object.keys(name).length === 0) continue;
    contributors.push({ role, name });
  }

  return contributors.length > 0 ? contributors : undefined;
}

function buildLinks(webLink) {
  const trimmed = webLink?.trim();
  if (!trimmed) return undefined;
  return [{ url: trimmed, label: 'url' }];
}

function pickLocalized(value) {
  return value?.ja || value?.en || '';
}

function inferLanguages(title) {
  if (!title) return undefined;
  if (title.ja) return ['jpn'];
  if (title.en) return ['eng'];
  return undefined;
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

function unique(values) {
  return [...new Set(values)];
}

function classifyPublication(publication) {
  const sourceType = publication.type.toLowerCase();
  const presentationText = normalizeToArray(publication.presentationType).join(' ').toLowerCase();
  const manualRule = findManualClassificationRule(publication);
  if (manualRule) {
    return stableClassification(
      manualRule.classification.type,
      manualRule.classification.subtype,
      manualRule.classification.isInternational ?? inferInternationalFlag(publication),
      manualRule.overrides || {}
    );
  }
  if (sourceType.includes('domestic conference')) {
    return reviewClassification(
      'misc',
      'summary_national_conference',
      false,
      '国内会議業績を MISC として仮分類しました',
      'この業績は MISC と講演・口頭発表等のどちらで登録したいですか。'
    );
  }
  if (sourceType.includes('miscellaneous') && presentationText) {
    return reviewClassification(
      'presentations',
      mapPresentationType(publication.presentationType),
      inferInternationalFlag(publication),
      'Miscellaneous を講演・口頭発表等として仮分類しました',
      'この業績は講演・口頭発表等で問題ないですか。'
    );
  }
  return reviewClassification(
    'misc',
    'others',
    inferInternationalFlag(publication),
    '業績種別を自動判定できなかったため MISC として仮分類しました',
    'この業績の researchmap 上の業績種別を確認したいです。'
  );
}

function findManualClassificationRule(publication) {
  const haystacks = {
    sourceType: publication.type.toLowerCase(),
    journalConference: publication.journalConference.toLowerCase(),
    name: publication.name.toLowerCase(),
  };
  return researchmapClassificationRules.find((rule) => {
    const sourceTypeMatch =
      !rule.match.sourceTypeIncludes ||
      rule.match.sourceTypeIncludes.some((keyword) => haystacks.sourceType.includes(keyword.toLowerCase()));
    const journalConferenceMatch =
      !rule.match.journalConferenceIncludes ||
      rule.match.journalConferenceIncludes.some((keyword) =>
        haystacks.journalConference.includes(keyword.toLowerCase())
      );
    const nameMatch =
      !rule.match.nameIncludes ||
      rule.match.nameIncludes.some((keyword) => haystacks.name.includes(keyword.toLowerCase()));
    return sourceTypeMatch && journalConferenceMatch && nameMatch;
  });
}

function stableClassification(type, subtype, isInternational, overrides = {}) {
  return {
    type,
    subtype,
    isInternational,
    requiresReview: false,
    reviewReason: '',
    reviewQuestion: '',
    overrides,
  };
}

function reviewClassification(type, subtype, isInternational, reviewReason, reviewQuestion) {
  return { type, subtype, isInternational, requiresReview: true, reviewReason, reviewQuestion, overrides: {} };
}

function resolveReferee(publication, classification) {
  if (Object.hasOwn(classification.overrides, 'referee')) {
    return classification.overrides.referee;
  }
  return mapReview(publication.review);
}

function mapReview(review) {
  const normalized = review.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized.includes('not')) return false;
  if (normalized.includes('peer') || normalized.includes('reviewed')) return true;
  return undefined;
}

function resolveInvited(publication, classification) {
  if (Object.hasOwn(classification.overrides, 'invited')) {
    return classification.overrides.invited;
  }
  return mapInvited(publication.presentationType);
}

function mapInvited(presentationType) {
  const normalized = normalizeToArray(presentationType).join(' ').toLowerCase();
  if (!normalized) return undefined;
  return normalized.includes('invited');
}

function mapOwnerRoles(authorship) {
  const roles = normalizeToArray(authorship).flatMap((item) => {
    const normalized = item.trim().toLowerCase();
    const mapped = [];
    if (normalized.includes('first') || normalized.includes('lead') || normalized.includes('筆頭')) mapped.push('lead');
    if (normalized.includes('last') || normalized.includes('senior')) mapped.push('last');
    if (normalized.includes('corresponding') || normalized.includes('責任')) mapped.push('corresponding');
    return mapped;
  });

  return roles.length > 0 ? unique(roles) : undefined;
}

function mapPresentationType(presentationType) {
  const normalized = normalizeToArray(presentationType)
    .map((value) => value.trim().toLowerCase())
    .find(Boolean);
  if (!normalized) return undefined;
  if (normalized.includes('poster')) return 'poster_presentation';
  if (normalized.includes('keynote')) return 'keynote_oral_presentation';
  if (normalized.includes('invited')) return 'invited_oral_presentation';
  if (normalized.includes('oral')) return 'oral_presentation';
  return normalized.replace(/\s+/g, '_');
}

function normalizeToArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function buildLocalizedTitle(jaTitle, enTitle) {
  const localized = {};

  if (jaTitle) {
    localized.ja = cleanTitle(jaTitle);
  }

  if (enTitle) {
    if (containsJapanese(enTitle) && !localized.ja) {
      localized.ja = cleanTitle(enTitle);
    } else if (!containsJapanese(enTitle)) {
      localized.en = cleanTitle(enTitle);
    }
  }

  if (localized.ja && !localized.en) {
    localized.en = localized.ja;
  }

  return Object.keys(localized).length > 0 ? localized : undefined;
}

function extractTitleAndAuthors(value, language) {
  const trimmed = normalizeQuotes((value || '').trim());

  if (!trimmed) {
    return { title: undefined, authors: [] };
  }

  const match = extractQuotedTitle(trimmed, language);
  if (!match) {
    return { title: inferPlainTitle(trimmed), authors: [] };
  }

  const authorSegment = trimmed.slice(0, match.index).trim();
  return {
    title: match.title,
    authors: parseAuthors(authorSegment, language),
  };
}

function extractQuotedTitle(value, language) {
  const patterns =
    language === 'ja'
      ? [/「([^」]+)」/, /"([^"]+)"/]
      : [/\"([^\"]+)\"/, /“([^”]+)”/, /「([^」]+)」/];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match && match.index !== undefined) {
      return { title: match[1], index: match.index };
    }
  }

  return undefined;
}

function inferPlainTitle(value) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/[,"，]/u.test(trimmed)) return undefined;
  if (/\b(vol|pp|no)\b/i.test(trimmed)) return undefined;
  return trimmed;
}

function parseAuthors(authorSegment, language) {
  const cleaned = authorSegment
    .replace(/[，,]\s*$/, '')
    .replace(/et al\./gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return [];

  const normalized =
    language === 'en'
      ? cleaned.replace(/\s+and\s+/gi, ',').replace(/，/g, ',').replace(/、/g, ',')
      : cleaned.replace(/、/g, ',').replace(/・/g, ',').replace(/，/g, ',');

  return unique(
    normalized
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
  );
}

function buildPublicationName(value) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return containsJapanese(trimmed) ? { ja: trimmed } : { en: trimmed };
}

function buildDescription(value) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return containsJapanese(trimmed) ? { ja: trimmed } : { en: trimmed };
}

function inferInternationalFlag(publication) {
  return [publication.type, publication.site, publication.journalConference, publication.name].some((field) =>
    /international|online|taiwan|hawaii|honolulu|usa/i.test(field || '')
  );
}

function inferCountryCode(site) {
  const normalized = (site || '').toLowerCase();
  if (!normalized) return undefined;
  if (normalized.includes('japan')) return 'JP';
  if (normalized.includes('usa') || normalized.includes('hawaii')) return 'US';
  if (normalized.includes('taiwan')) return 'TW';
  return undefined;
}

function extractPromoter(publication) {
  return publication.journalConference || publication.site || '';
}

function normalizePublicationDate(date) {
  const trimmed = (date || '').trim();
  if (!trimmed) return undefined;
  const fullDate = trimmed.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (fullDate) return `${fullDate[1]}-${fullDate[2].padStart(2, '0')}-${fullDate[3].padStart(2, '0')}`;
  const plainDate = trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
  if (plainDate) return trimmed;
  const yearMonth = trimmed.match(/(\d{4})年(\d{1,2})月/);
  if (yearMonth) return `${yearMonth[1]}-${yearMonth[2].padStart(2, '0')}-01`;
  return trimmed;
}

function extractBibliographicInfo(publication) {
  const candidates = [publication.name, publication.japanese, publication.others].filter(Boolean);
  const compactCitation = firstMatchedGroups(candidates, [
    /\b(\d+)\s*,\s*([A-Za-z]?\d+)\s*[-–—]\s*([A-Za-z]?\d+)\s*\(\d{4}\)/,
  ]);
  const conferencePaperCode = extractConferencePaperCode(candidates);
  const volume =
    firstMatchedValue(candidates, [
      /\bvol\.?\s*([A-Za-z0-9.-]+)/i,
      /\b(\d+)\s*\(\s*[A-Za-z0-9.-]{1,10}\s*\)\s*,/,
    ]) || compactCitation?.[0];
  const number =
    firstMatchedValue(candidates, [
      /\b(?:no|number)\b\.?\s*([A-Za-z0-9.-]+)/i,
      /\b\d+\s*\(\s*([A-Za-z0-9.-]{1,10})\s*\)\s*,\s*(?:pp?\.?\s*)?[A-Za-z]?\d+/i,
    ]) || conferencePaperCode;
  const pageRange = firstMatchedGroups(candidates, [
    /\bpp?\.\s*([A-Za-z]?\d+)\s*[-–—]\s*([A-Za-z]?\d+)/i,
    /\bpp?\s+([A-Za-z]?\d+)\s*[-–—]\s*([A-Za-z]?\d+)/i,
    /\bpages?\s+([A-Za-z]?\d+)\s*[-–—]\s*([A-Za-z]?\d+)/i,
    /\b\d+\s*,\s*([A-Za-z]?\d+)\s*[-–—]\s*([A-Za-z]?\d+)\s*\(\d{4}\)/,
  ]);
  const singlePage = pageRange
    ? undefined
    : firstMatchedValue(candidates, [/\bp\.\s*([A-Za-z]?\d+)\b/i, /\bp\s+([A-Za-z]?\d+)\b/i]);

  return compactObject({
    volume: sanitizeBibliographicToken(volume),
    number: sanitizeBibliographicToken(number),
    startPage: sanitizeBibliographicToken(pageRange?.[0] || singlePage),
    endPage: sanitizeBibliographicToken(pageRange?.[1] || singlePage),
  });
}

function extractConferencePaperCode(candidates) {
  for (const candidate of candidates) {
    const tokens = candidate.match(/\b[A-Za-z0-9]+(?:[-_/][A-Za-z0-9]+){1,4}\b/g) || [];
    const match = tokens.find(isConferencePaperCodeToken);
    if (match) return match;
  }
  return undefined;
}

function firstMatchedValue(candidates, patterns) {
  for (const candidate of candidates) {
    for (const pattern of patterns) {
      const match = candidate.match(pattern);
      if (match?.[1]) return match[1];
    }
  }
  return undefined;
}

function firstMatchedGroups(candidates, patterns) {
  for (const candidate of candidates) {
    for (const pattern of patterns) {
      const match = candidate.match(pattern);
      if (match && match.length > 2) return match.slice(1);
    }
  }
  return undefined;
}

function sanitizeBibliographicToken(value) {
  return value?.trim().replace(/[.,)]*$/u, '') || undefined;
}

function isConferencePaperCodeToken(value) {
  if (!/[A-Za-z]/.test(value)) return false;
  if (!/\d/.test(value)) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  if (/^(https?|doi)$/i.test(value)) return false;
  return true;
}

function normalizeDoi(value) {
  return (value || '').trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');
}

function normalizeQuotes(value) {
  return (value || '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/‟/g, '"');
}

function cleanTitle(value) {
  return value.trim().replace(/[,\uFF0C\u3001]+$/u, '').trim();
}

function containsJapanese(value) {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/u.test(value || '');
}
