import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import itCommon from './locales/it/common.json'
import itAuth from './locales/it/auth.json'
import itCatches from './locales/it/catches.json'
import itDashboard from './locales/it/dashboard.json'
import itErrors from './locales/it/errors.json'

import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enCatches from './locales/en/catches.json'
import enDashboard from './locales/en/dashboard.json'
import enErrors from './locales/en/errors.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      it: { common: itCommon, auth: itAuth, catches: itCatches, dashboard: itDashboard, errors: itErrors },
      en: { common: enCommon, auth: enAuth, catches: enCatches, dashboard: enDashboard, errors: enErrors },
    },
    fallbackLng: 'en',
    supportedLngs: ['it', 'en'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  })

export default i18n
