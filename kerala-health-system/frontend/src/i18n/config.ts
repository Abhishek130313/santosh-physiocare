import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import mlTranslations from './locales/ml.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  hi: {
    translation: hiTranslations,
  },
  ml: {
    translation: mlTranslations,
  },
};

// Get saved language from localStorage or default to Malayalam
const savedLanguage = localStorage.getItem('kerala-health-language') || 'ml';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Namespace configuration
    defaultNS: 'translation',
    
    // React i18next options
    react: {
      useSuspense: false, // We handle loading states manually
    },
    
    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',
  });

// Save language preference when it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('kerala-health-language', lng);
  
  // Update document language and direction
  document.documentElement.lang = lng;
  
  // Set font class based on language
  document.body.classList.remove('text-malayalam', 'text-hindi');
  if (lng === 'ml') {
    document.body.classList.add('text-malayalam');
  } else if (lng === 'hi') {
    document.body.classList.add('text-hindi');
  }
});

export default i18n;