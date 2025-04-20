// src/types.ts

export interface Publication {
  id: number; // idを必須に戻す
  hasEmptyFields: boolean;
  name: string;
  japanese: string;
  type: string;
  review: string;
  authorship: string | string[];
  presentationType: string | string[];
  doi: string;
  webLink: string;
  date: string;
  others: string;
  site: string;
  journalConference: string;
  journal?: string; // テスト用に追加
  year?: number;
  startDate?: string;
  endDate?: string;
  sortableDate?: string;
}

// 他の共通型定義もここに追加できます