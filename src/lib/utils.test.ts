import { describe, it, expect } from 'vitest'
import { cn, formatCurrency, formatDate } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'end')).toBe('base end')
  })

  it('resolves conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

describe('formatCurrency', () => {
  it('formats USD by default', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats EUR', () => {
    expect(formatCurrency(100, 'EUR')).toContain('100')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('handles negative numbers', () => {
    expect(formatCurrency(-50)).toContain('50')
  })
})

describe('formatDate', () => {
  it('formats Date object', () => {
    const date = new Date('2024-01-15')
    const result = formatDate(date)
    expect(result).toContain('Jan')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })

  it('formats date string', () => {
    const result = formatDate('2024-06-20')
    expect(result).toContain('Jun')
    expect(result).toContain('20')
  })
})
