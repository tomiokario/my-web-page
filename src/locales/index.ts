import en from './en';
import ja from './ja';

export interface Locales {
  en: typeof en;
  ja: typeof ja;
}

// 言語リソースをまとめたオブジェクト
const locales: Locales = {
  en,
  ja
};

export default locales;