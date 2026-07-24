import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted ensures these are available when vi.mock runs
const { mockFetch, mockRatesAdd, mockRatesFirst, mockAndCallback } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockRatesAdd: vi.fn().mockResolvedValue(1),
  mockRatesFirst: vi.fn().mockResolvedValue(null),
  mockAndCallback: { current: null as ((r: Record<string, unknown>) => boolean) | null },
}))

vi.stubGlobal('fetch', mockFetch)

vi.mock('dexie', () => {
  return {
    default: vi.fn().mockImplementation(function() {
      return {
        version: vi.fn().mockReturnThis(),
        stores: vi.fn().mockReturnThis(),
        rates: {
          add: mockRatesAdd,
          where: vi.fn().mockReturnThis(),
          equals: vi.fn().mockReturnThis(),
          and: vi.fn().mockImplementation(function(cb: (r: Record<string, unknown>) => boolean) {
            mockAndCallback.current = cb
            return this
          }),
          first: mockRatesFirst,
        },
      }
    }),
  }
})

import {
  calculateFXGainLoss,
  CURRENCIES,
  getExchangeRate,
  getHistoricalRate,
} from './exchangeRate'

describe('calculateFXGainLoss', () => {
  it('returns null when invoiceDateRate is null', () => {
    expect(calculateFXGainLoss(100, 'USD', 'EUR', null, 1.1)).toBeNull()
  })

  it('returns null when paymentDateRate is null', () => {
    expect(calculateFXGainLoss(100, 'USD', 'EUR', 1.0, null)).toBeNull()
  })

  it('returns null when currencies are the same', () => {
    expect(calculateFXGainLoss(100, 'USD', 'USD', 1.0, 1.1)).toBeNull()
  })

  it('calculates gain when rate increases', () => {
    const result = calculateFXGainLoss(100, 'USD', 'EUR', 0.9, 1.0)
    expect(result).not.toBeNull()
    expect(result!.gainLoss).toBeGreaterThan(0)
  })

  it('calculates loss when rate decreases', () => {
    const result = calculateFXGainLoss(100, 'USD', 'EUR', 1.0, 0.9)
    expect(result).not.toBeNull()
    expect(result!.gainLoss).toBeLessThan(0)
  })

  it('calculates percentage correctly', () => {
    const result = calculateFXGainLoss(100, 'USD', 'EUR', 1.0, 1.1)
    expect(result!.percentage).toBeCloseTo(10)
  })

  it('handles zero invoice amount', () => {
    const result = calculateFXGainLoss(0, 'USD', 'EUR', 1.0, 1.1)
    expect(result).not.toBeNull()
    expect(result!.gainLoss).toBe(0)
    expect(result!.percentage).toBe(0)
  })

  it('handles large amounts', () => {
    const result = calculateFXGainLoss(1000000, 'USD', 'EUR', 0.9, 1.0)
    expect(result!.gainLoss).toBeCloseTo(100000)
  })

  it('handles negative rates', () => {
    const result = calculateFXGainLoss(100, 'USD', 'EUR', -0.5, -0.3)
    expect(result).not.toBeNull()
  })
})

describe('CURRENCIES', () => {
  it('contains USD', () => {
    expect(CURRENCIES.find(c => c.code === 'USD')).toBeDefined()
  })

  it('contains EUR', () => {
    expect(CURRENCIES.find(c => c.code === 'EUR')).toBeDefined()
  })

  it('contains GBP', () => {
    expect(CURRENCIES.find(c => c.code === 'GBP')).toBeDefined()
  })

  it('contains JPY', () => {
    expect(CURRENCIES.find(c => c.code === 'JPY')).toBeDefined()
  })

  it('contains CNY', () => {
    expect(CURRENCIES.find(c => c.code === 'CNY')).toBeDefined()
  })

  it('has valid structure', () => {
    CURRENCIES.forEach(c => {
      expect(c.code).toHaveLength(3)
      expect(c.name).toBeTruthy()
      expect(c.symbol).toBeTruthy()
    })
  })

  it('has at least 10 currencies', () => {
    expect(CURRENCIES.length).toBeGreaterThanOrEqual(10)
  })

  it('all codes are uppercase', () => {
    CURRENCIES.forEach(c => {
      expect(c.code).toBe(c.code.toUpperCase())
    })
  })
})

describe('getExchangeRate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRatesFirst.mockResolvedValue(null)
  })

  it('returns 1 when from and to are the same', async () => {
    const rate = await getExchangeRate('USD', 'USD')
    expect(rate).toBe(1)
  })

  it('returns cached rate when available', async () => {
    mockRatesFirst.mockResolvedValue({ rate: 0.92 })

    const rate = await getExchangeRate('USD', 'EUR')
    expect(rate).toBe(0.92)
  })

  it('fetches from primary API on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rates: { EUR: 0.92 } }),
    })

    const rate = await getExchangeRate('USD', 'EUR')
    expect(rate).toBe(0.92)
    expect(mockRatesAdd).toHaveBeenCalled()
  })

  it('falls back to alternative API on primary failure', async () => {
    // First call (primary) fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })
    // Second call (alternative) succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ rates: { EUR: 0.91 } }),
    })

    const rate = await getExchangeRate('USD', 'EUR')
    expect(rate).toBe(0.91)
  })

  it('returns fallback rate when both APIs fail', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const rate = await getExchangeRate('USD', 'EUR')
    expect(rate).toBe(0.92) // Fallback rate
  })

  it('returns null for unknown currency pair', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const rate = await getExchangeRate('XYZ', 'ABC')
    expect(rate).toBeNull()
  })

  it('returns fallback rate when API returns empty rates', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rates: {} }),
    })

    const rate = await getExchangeRate('USD', 'EUR')
    expect(rate).toBe(0.92) // Fallback rate
  })

  it('invokes .and() callback with today date for cache lookup', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rates: { EUR: 0.92 } }),
    })

    await getExchangeRate('USD', 'EUR')

    expect(mockAndCallback.current).not.toBeNull()
    const today = new Date().toISOString().split('T')[0]
    expect(mockAndCallback.current!({ date: today })).toBe(true)
    expect(mockAndCallback.current!({ date: '2020-01-01' })).toBe(false)
  })
})

describe('getHistoricalRate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRatesFirst.mockResolvedValue(null)
  })

  it('returns 1 when from and to are the same', async () => {
    const rate = await getHistoricalRate('USD', 'USD', '2024-01-01')
    expect(rate).toBe(1)
  })

  it('returns cached rate when available', async () => {
    mockRatesFirst.mockResolvedValue({ rate: 0.92 })

    const rate = await getHistoricalRate('USD', 'EUR', '2024-01-01')
    expect(rate).toBe(0.92)
  })

  it('fetches historical rate from API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rates: { EUR: 0.92 } }),
    })

    const rate = await getHistoricalRate('USD', 'EUR', '2024-01-01')
    expect(rate).toBe(0.92)
    expect(mockRatesAdd).toHaveBeenCalled()
  })

  it('returns null when API fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const rate = await getHistoricalRate('USD', 'EUR', '2024-01-01')
    expect(rate).toBeNull()
  })

  it('returns null when rate not in response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rates: {} }),
    })

    const rate = await getHistoricalRate('USD', 'EUR', '2024-01-01')
    expect(rate).toBeNull()
  })

  it('invokes .and() callback with specified date for cache lookup', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rates: { EUR: 0.92 } }),
    })

    await getHistoricalRate('USD', 'EUR', '2024-06-15')

    expect(mockAndCallback.current).not.toBeNull()
    expect(mockAndCallback.current!({ date: '2024-06-15' })).toBe(true)
    expect(mockAndCallback.current!({ date: '2024-06-16' })).toBe(false)
  })
})
