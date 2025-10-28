import * as i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LANGUAGES } from './languages';
import en from './en';
import nodeParametersEn from './node-parameters.en';

void i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    debug: import.meta.env.DEV,
    resources: {
      en: {
        translation: en,
        nodeParameters: nodeParametersEn,
      },
    },
    lng: LANGUAGES.ENGLISH,
    fallbackLng: LANGUAGES.ENGLISH,
    interpolation: {
      escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    },
  });
