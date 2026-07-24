import { describe, it, expect } from 'vitest'
import { ThemeContext } from './themeContext'
import type { Theme, ThemeContextType } from './themeContext'

describe('themeContext', () => {
  it('exports ThemeContext', () => {
    expect(ThemeContext).toBeDefined()
  })

  it('ThemeContext has Provider and Consumer', () => {
    expect(ThemeContext.Provider).toBeDefined()
    expect(ThemeContext.Consumer).toBeDefined()
  })

  it('Theme type allows light, dark, system', () => {
    const light: Theme = 'light'
    const dark: Theme = 'dark'
    const system: Theme = 'system'
    expect(light).toBe('light')
    expect(dark).toBe('dark')
    expect(system).toBe('system')
  })

  it('ThemeContextType interface has required fields', () => {
    const ctx: ThemeContextType = {
      theme: 'light',
      setTheme: () => {},
      resolvedTheme: 'light',
    }
    expect(ctx.theme).toBe('light')
    expect(ctx.resolvedTheme).toBe('light')
    expect(typeof ctx.setTheme).toBe('function')
  })
})
