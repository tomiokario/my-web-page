import locales from "../locales";
import { Language } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { LocaleMessages } from "../locales/types";

function useLocale(): LocaleMessages {
  const { language } = useLanguage();

  return locales[language as Language];
}

export default useLocale;
