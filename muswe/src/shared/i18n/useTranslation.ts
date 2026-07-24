'use client'

import { useLanguageStore, Locale } from '@/shared/stores/languageStore'
import { idDictionary } from './dictionaries/id'
import { enDictionary } from './dictionaries/en'

const dictionaries = {
  id: idDictionary,
  en: enDictionary,
}

export function useTranslation() {
  const { locale, setLocale } = useLanguageStore()
  const dictionary = dictionaries[locale] || idDictionary

  return {
    t: dictionary,
    locale,
    setLocale: (newLocale: Locale) => setLocale(newLocale),
    isEnglish: locale === 'en',
  }
}
