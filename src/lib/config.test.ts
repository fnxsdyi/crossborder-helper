import { describe, it, expect } from 'vitest'
import { isAdmin, PRO_MONTHLY_PLAN_ID, PRO_ANNUAL_PLAN_ID, OCR_FREE_LIMIT, W8BEN_FREE_LIMIT } from './config'

describe('isAdmin', () => {
  it('returns true for admin email', () => {
    expect(isAdmin('fnxsdyi@qq.com')).toBe(true)
  })

  it('returns true for admin email case-insensitive', () => {
    expect(isAdmin('FNXSDYI@QQ.COM')).toBe(true)
  })

  it('returns false for non-admin email', () => {
    expect(isAdmin('user@example.com')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isAdmin(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isAdmin(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isAdmin('')).toBe(false)
  })
})

describe('config constants', () => {
  it('has valid PayPal plan IDs', () => {
    expect(PRO_MONTHLY_PLAN_ID).toMatch(/^P-/)
    expect(PRO_ANNUAL_PLAN_ID).toMatch(/^P-/)
  })

  it('has reasonable free tier limits', () => {
    expect(OCR_FREE_LIMIT).toBeGreaterThan(0)
    expect(W8BEN_FREE_LIMIT).toBeGreaterThan(0)
  })
})
