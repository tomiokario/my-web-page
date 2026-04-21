export const researchmapClassificationRules = [
  {
    id: 'optical-review',
    description: 'Optical Review は査読付き学術雑誌論文として扱い、招待論文にはしない',
    match: { journalConferenceIncludes: ['optical review'] },
    classification: { type: 'published_papers', subtype: 'scientific_journal', isInternational: true },
    overrides: { invited: false },
  },
  {
    id: 'iwh-proceedings',
    description: 'IWH は査読付き国際会議プロシーディングスとして統一する',
    match: {
      sourceTypeIncludes: ['international conference'],
      journalConferenceIncludes: ['iwh20', 'international workshop on holography and related technologies'],
    },
    classification: {
      type: 'published_papers',
      subtype: 'international_conference_proceedings',
      isInternational: true,
    },
    overrides: { referee: true },
  },
  {
    id: 'international-conference-digest',
    description: 'Technical Digest / Program and Abstracts / Proceedings などの国際会議予稿集は論文に寄せる',
    match: {
      sourceTypeIncludes: ['international conference'],
      nameIncludes: ['technical digest', 'program and abstracts', 'program and proceedings', 'proceeding', 'proceedings', 'abstracts'],
    },
    classification: {
      type: 'published_papers',
      subtype: 'international_conference_proceedings',
      isInternational: true,
    },
  },
  {
    id: 'journal-paper',
    description: '学術雑誌論文は researchmap の論文に寄せる',
    match: { sourceTypeIncludes: ['journal paper'] },
    classification: { type: 'published_papers', subtype: 'scientific_journal' },
  },
  {
    id: 'international-conference-paper',
    description: '国際会議論文は論文の国際会議プロシーディングスに寄せる',
    match: { sourceTypeIncludes: ['international conference'] },
    classification: {
      type: 'published_papers',
      subtype: 'international_conference_proceedings',
      isInternational: true,
    },
  },
  {
    id: 'ite-tech-report',
    description: 'ITE Tech. Rep. / 映情学技報 / MMS 系は MISC として統一する',
    match: {
      nameIncludes: ['ite tech. rep.', '映情学技報', 'mms202', 'mms2024', 'mms2025'],
      journalConferenceIncludes: ['mms202', 'mms2024', 'mms2025'],
    },
    classification: { type: 'misc', subtype: 'technical_report' },
  },
  {
    id: 'photonics-news',
    description: 'Photonics NEWS / フォトニクスニュースの記事は MISC として統一する',
    match: {
      journalConferenceIncludes: ['photonics news', 'フォトニクスニュース'],
      sourceTypeIncludes: ['invited paper'],
    },
    classification: { type: 'misc', subtype: 'introduction_scientific_journal' },
  },
  {
    id: 'info-photonics-discussion',
    description: '情報フォトニクス研究討論会は既存サイト運用に合わせて MISC とする',
    match: { journalConferenceIncludes: ['情報フォトニクス研究討論会'] },
    classification: { type: 'misc', subtype: 'others' },
  },
  {
    id: 'photonics-computing-area-meeting',
    description: 'フォトニックコンピューティングの領域会議シリーズは既存サイト運用に合わせて MISC とする',
    match: {
      journalConferenceIncludes: ['光の極限性能を生かすフォトニックコンピューティング 第', '領域会議'],
    },
    classification: { type: 'misc', subtype: 'others' },
  },
  {
    id: 'asd-meeting',
    description: 'ASD研究会は予稿・研究会資料として MISC に寄せる',
    match: { journalConferenceIncludes: ['第25回asd研究会'] },
    classification: { type: 'misc', subtype: 'summary_national_conference' },
  },
  {
    id: 'kyushu-biomedical-welfare-meeting',
    description: '福祉工学会九州支部大会は予稿集として MISC に寄せる',
    match: { journalConferenceIncludes: ['第7回福祉工学会九州支部大会'] },
    classification: { type: 'misc', subtype: 'summary_national_conference' },
  },
  {
    id: 'opt-neuro-workshop',
    description: '光ニューロワークショップは講演・口頭発表等にする',
    match: { journalConferenceIncludes: ['第２回光ニューロワークショップ'] },
    classification: { type: 'presentations', subtype: 'oral_presentation' },
  },
  {
    id: 'materials-meet-robots',
    description: 'Materials Meet Robots は講演・口頭発表等に寄せる',
    match: { journalConferenceIncludes: ['materials meet robots'] },
    classification: { type: 'presentations', subtype: 'oral_presentation' },
  },
  {
    id: 'photonic-computing-symposium',
    description: 'The First International Symposium on Photonic Computing は講演・口頭発表等に寄せる',
    match: { journalConferenceIncludes: ['the first international symposium on photonic computing'] },
    classification: {
      type: 'presentations',
      subtype: 'oral_presentation',
      isInternational: true,
    },
  },
  {
    id: 'public-symposium-photonics',
    description: 'Photonics for Computing 系の公開シンポジウムは講演・口頭発表等に寄せる',
    match: { journalConferenceIncludes: ['公開シンポジウム', 'photonics for computing'] },
    classification: { type: 'presentations', subtype: 'public_symposium' },
  },
  {
    id: 'jsap-autumn-meeting',
    description: '応用物理学会秋季学術講演会は講演・口頭発表等に寄せる',
    match: { journalConferenceIncludes: ['応用物理学会秋季学術講演会'] },
    classification: { type: 'presentations', subtype: 'oral_presentation' },
  },
];
