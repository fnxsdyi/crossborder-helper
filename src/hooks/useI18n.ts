import { useState, useCallback } from 'react'
import { t, setLocale, getLocale, type Locale, LOCALES } from '@/lib/i18n'

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(getLocale())

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    setLocale(newLocale)
  }, [])

  return {
    locale,
    t,
    changeLocale,
    locales: LOCALES,
  }
}
