import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import fr from './locales/fr';
import en from './locales/en';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
};

const languageTag = Localization.getLocales()[0]?.languageCode ?? 'fr';
const supportedLanguages = ['fr', 'en'];
const detectedLanguage = supportedLanguages.includes(languageTag) ? languageTag : 'fr';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectedLanguage,
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });

export default i18n;
export { detectedLanguage };
