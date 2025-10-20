import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import ja from './locales/ja.json';
import uz from './locales/uz.json';
import { LANGUAGE_CODES, DEFAULT_LANGUAGE, type LanguageCode } from './languages';

const detectedLocale = Localization.getLocales()[0]?.languageCode;
const normalizedLocale = detectedLocale?.split?.('-')[0] ?? DEFAULT_LANGUAGE;
const initialLanguage: LanguageCode = LANGUAGE_CODES.includes(
  normalizedLocale as LanguageCode,
)
  ? (normalizedLocale as LanguageCode)
  : DEFAULT_LANGUAGE;

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ja: { translation: ja },
    uz: { translation: uz },
  },
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
});

export default i18n;
