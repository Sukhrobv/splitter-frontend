import { ReactNode, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { useAppStore } from '@/shared/lib/stores/app-store';
import { LANGUAGE_CODES, type LanguageCode } from '@/shared/config/languages';
import i18n from '../../shared/config/i18n';

const supportedLanguages = LANGUAGE_CODES;

interface I18nProviderProps {
  children: ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  useEffect(() => {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      const baseCode = lng.split('-')[0] as LanguageCode;
      if (!supportedLanguages.includes(baseCode)) return;
      if (baseCode !== language) {
        setLanguage(baseCode);
      }
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [language, setLanguage]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
