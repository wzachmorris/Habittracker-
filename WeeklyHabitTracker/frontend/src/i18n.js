import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from './locales/en/common.json';
import esCommon from './locales/es/common.json';
import ptCommon from './locales/pt/common.json';

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    resources: {
      en: {
        common: enCommon
      },
      es: {
        common: esCommon
      },
      pt: {
        common: ptCommon
      }
    },
    fallbackLng: 'en', // Default language
    debug: process.env.NODE_ENV === 'development',
    
    // Default namespace
    ns: ['common'],
    defaultNS: 'common',
    
    // React config
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    detection: {
      // Order of detection
      order: ['localStorage', 'navigator'],
      // Cache language in localStorage
      caches: ['localStorage'],
      lookupLocalStorage: 'language'
    }
  });

export default i18n;