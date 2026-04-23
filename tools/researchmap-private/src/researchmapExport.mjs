const USER_ID_PLACEHOLDER = '__RESEARCHMAP_USER_ID__';

export function generateResearchmapExport(items, options = {}) {
  const researchmapUserId = options.researchmapUserId?.trim() || USER_ID_PLACEHOLDER;
  const exportItems = items.map((item) => buildImportAction(item, researchmapUserId));

  return {
    importLines: exportItems.map((item) => JSON.stringify(item.action)),
    manualReviewItems: exportItems.filter((item) => item.review.reasons.length > 0).map((item) => item.review),
  };
}

function buildImportAction(source, fallbackUserId) {
  const fields = source.fields;
  const sync = source.sync?.researchmap || {};
  const researchmapUserId = sync.userId?.trim() || fallbackUserId;
  const reasons = [];
  const questions = [];

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
      publicationId: source.id,
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

function pickLocalized(value) {
  return value?.ja || value?.en || '';
}

function inferLanguages(title) {
  if (!title) return undefined;
  if (title.ja) return ['jpn'];
  if (title.en) return ['eng'];
  return undefined;
}

function unique(values) {
  return [...new Set(values)];
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
