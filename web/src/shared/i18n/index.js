import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import hi from './locales/hi.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    supportedLngs: ['en', 'hi'],
    fallbackLng: 'en',
    load: 'languageOnly', // hi-IN → hi, en-US → en
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    detection: {
      // Порядок определения языка: localStorage -> navigator
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'app_language',
      caches: ['localStorage'],
    },
  });

export default i18n;
