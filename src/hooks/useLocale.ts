import locales from "../locales";
import { useLanguage } from "../contexts/LanguageContext";
import { LocaleMessages } from "../locales/types";

function useLocale(): LocaleMessages {
  const { language } = useLanguage();

  return locales[language];
}

export default useLocale;
