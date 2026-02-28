import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import zhCN from '@/locales/zh-CN'
import enUS from '@/locales/en-US'

export const LANGS = [
  { key: 'zh-CN', label: '简体中文', icon: '🇨🇳' },
  { key: 'en-US', label: 'English',  icon: '🇺🇸' },
]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'en-US': { translation: enUS },
    },
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN', 'en-US'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18n_lang',
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
