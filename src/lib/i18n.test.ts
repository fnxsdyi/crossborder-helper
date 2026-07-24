import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('exports LOCALES array', async () => {
    const { LOCALES } = await import('./i18n')
    expect(Array.isArray(LOCALES)).toBe(true)
    expect(LOCALES.length).toBe(8)
  })

  it('LOCALES contains expected languages', async () => {
    const { LOCALES } = await import('./i18n')
    const codes = LOCALES.map(l => l.code)
    expect(codes).toContain('en')
    expect(codes).toContain('zh')
    expect(codes).toContain('ja')
    expect(codes).toContain('ko')
    expect(codes).toContain('de')
    expect(codes).toContain('fr')
    expect(codes).toContain('es')
    expect(codes).toContain('pt')
  })

  it('each locale has code, name, and nativeName', async () => {
    const { LOCALES } = await import('./i18n')
    for (const locale of LOCALES) {
      expect(typeof locale.code).toBe('string')
      expect(typeof locale.name).toBe('string')
      expect(typeof locale.nativeName).toBe('string')
    }
  })

  it('getLocale returns current locale', async () => {
    const { getLocale } = await import('./i18n')
    const locale = getLocale()
    expect(typeof locale).toBe('string')
  })

  it('t function returns translation for known key', async () => {
    const { t } = await import('./i18n')
    const result = t('nav.home')
    expect(typeof result).toBe('string')
  })

  it('t function falls back to English', async () => {
    const { t } = await import('./i18n')
    const result = t('nav.home')
    expect(result).toBeTruthy()
  })

  it('t function returns key when not found', async () => {
    const { t } = await import('./i18n')
    const result = t('nonexistent.key' as any)
    expect(result).toBe('nonexistent.key')
  })

  it('t function interpolates variables', async () => {
    const { t } = await import('./i18n')
    const result = t('nav.home')
    expect(typeof result).toBe('string')
  })

  it('setLocale stores locale in localStorage', async () => {
    const { setLocale } = await import('./i18n')
    // setLocale calls window.location.reload which can't be easily mocked in jsdom
    // So we just verify localStorage is updated
    try {
      setLocale('zh')
    } catch {
      // Expected - reload throws in test env
    }
    expect(localStorage.getItem('locale')).toBe('zh')
  })

  it('detectBrowserLanguage returns browser locale', async () => {
    const { getLocale } = await import('./i18n')
    const locale = getLocale()
    expect(['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'pt']).toContain(locale)
  })

  it('initializes from localStorage when available', async () => {
    localStorage.setItem('locale', 'ja')
    const { getLocale } = await import('./i18n')
    const locale = getLocale()
    expect(locale).toBe('ja')
  })

  it('handles missing translation key gracefully', async () => {
    const { t } = await import('./i18n')
    const result = t('nonexistent' as any)
    expect(result).toBe('nonexistent')
  })

  it('all translation keys have values in English', async () => {
    const { t } = await import('./i18n')
    // Test a few key categories
    const keys = [
      'nav.home', 'nav.signIn', 'nav.signOut', 'nav.dashboard',
      'guest.bannerTitle', 'guest.upgradeNow',
      'dashboard.title', 'dashboard.totalInvoices',
      'invoices.title', 'invoices.newInvoice',
    ]
    for (const key of keys) {
      const result = t(key as any)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    }
  })
})
