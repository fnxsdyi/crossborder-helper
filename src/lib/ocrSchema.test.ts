import { describe, it, expect } from 'vitest'
import { validateOcrResult, validateOcrConfirm } from './ocrSchema'

describe('validateOcrResult', () => {
  it('returns null for non-object input', () => {
    expect(validateOcrResult(null)).toBeNull()
    expect(validateOcrResult(undefined)).toBeNull()
    expect(validateOcrResult('string')).toBeNull()
    expect(validateOcrResult(123)).toBeNull()
  })

  it('returns null for empty object', () => {
    expect(validateOcrResult({})).not.toBeNull()
  })

  it('validates complete result', () => {
    const data = {
      invoice_number: 'INV-001',
      date: '2024-01-15',
      amount: 100.50,
      currency: 'CNY',
      vendor_name: 'Test Company',
      tax_id: '123456789012345',
      confidence: 0.95,
    }
    const result = validateOcrResult(data)
    expect(result).not.toBeNull()
    expect(result!.invoice_number).toBe('INV-001')
    expect(result!.date).toBe('2024-01-15')
    expect(result!.amount).toBe(100.50)
    expect(result!.currency).toBe('CNY')
    expect(result!.vendor_name).toBe('Test Company')
    expect(result!.tax_id).toBe('123456789012345')
    expect(result!.confidence).toBe(0.95)
  })

  it('handles partial data with defaults', () => {
    const data = { amount: 50 }
    const result = validateOcrResult(data)
    expect(result).not.toBeNull()
    expect(result!.invoice_number).toBeNull()
    expect(result!.date).toBeNull()
    expect(result!.amount).toBe(50)
    expect(result!.currency).toBeNull()
    expect(result!.confidence).toBe(0)
  })

  it('handles invalid types gracefully', () => {
    const data = {
      invoice_number: 123,
      date: true,
      amount: 'not a number',
      currency: 456,
      vendor_name: null,
      tax_id: undefined,
      confidence: 'high',
    }
    const result = validateOcrResult(data)
    expect(result).not.toBeNull()
    expect(result!.invoice_number).toBeNull()
    expect(result!.date).toBeNull()
    expect(result!.amount).toBeNull()
    expect(result!.currency).toBeNull()
    expect(result!.confidence).toBe(0)
  })
})

describe('validateOcrConfirm', () => {
  it('returns false for non-object input', () => {
    expect(validateOcrConfirm(null)).toBe(false)
    expect(validateOcrConfirm(undefined)).toBe(false)
    expect(validateOcrConfirm('string')).toBe(false)
  })

  it('returns false for incomplete data', () => {
    expect(validateOcrConfirm({})).toBe(false)
    expect(validateOcrConfirm({ invoice_number: 'INV-001' })).toBe(false)
  })

  it('returns true for valid confirm data', () => {
    const data = {
      invoice_number: 'INV-001',
      date: '2024-01-15',
      amount: 100.50,
      currency: 'CNY',
      vendor_name: 'Test Company',
      tax_id: '123456789012345',
    }
    expect(validateOcrConfirm(data)).toBe(true)
  })

  it('returns false when amount is zero', () => {
    const data = {
      invoice_number: 'INV-001',
      date: '2024-01-15',
      amount: 0,
      currency: 'CNY',
      vendor_name: 'Test Company',
    }
    expect(validateOcrConfirm(data)).toBe(false)
  })

  it('returns false when amount is negative', () => {
    const data = {
      invoice_number: 'INV-001',
      date: '2024-01-15',
      amount: -100,
      currency: 'CNY',
      vendor_name: 'Test Company',
    }
    expect(validateOcrConfirm(data)).toBe(false)
  })

  it('returns false for empty strings', () => {
    const data = {
      invoice_number: '',
      date: '',
      amount: 100,
      currency: '',
      vendor_name: '',
    }
    expect(validateOcrConfirm(data)).toBe(false)
  })
})
