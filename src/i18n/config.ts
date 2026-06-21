import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';

i18n
  .use(initReactI18next)
  .init({
    resources: translations,
    lng: 'en', // Always start in English; App.tsx will load the user's saved preference after login
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;