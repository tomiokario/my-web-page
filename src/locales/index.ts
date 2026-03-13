import { Language } from "../types";
import en from './en';
import ja from './ja';
import { LocaleMessages } from "./types";

// 言語リソースをまとめたオブジェクト
const locales: Record<Language, LocaleMessages> = {
  en,
  ja
};

export type { LocaleMessages } from "./types";
export default locales;
