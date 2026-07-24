import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted ensures these are available when vi.mock runs
const { mockAdd, mockOrderBy, mockReverse, mockLimit, mockToArray, mockClear } = vi.hoisted(() => ({
  mockAdd: vi.fn().mockResolvedValue(1),
  mockOrderBy: vi.fn().mockReturnThis(),
  mockReverse: vi.fn().mockReturnThis(),
  mockLimit: vi.fn().mockReturnThis(),
  mockToArray: vi.fn().mockResolvedValue([]),
  mockClear: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('dexie', () => {
  return {
    default: vi.fn().mockImplementation(function() {
      return {
        version: vi.fn().mockReturnThis(),
        stores: vi.fn().mockReturnThis(),
        queries: {
          add: mockAdd,
          orderBy: mockOrderBy,
          reverse: mockReverse,
          limit: mockLimit,
          toArray: mockToArray,
          clear: mockClear,
        },
      }
    }),
  }
})

import { saveRateQuery, getRateHistory, clearRateHistory } from './rateHistory'

describe('saveRateQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('saves rate query to database', async () => {
    await saveRateQuery('USD', 'EUR', 0.92, 100, 92)
    expect(mockAdd).toHaveBeenCalledWith({
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.92,
      amount: 100,
      result: 92,
      queriedAt: expect.any(Date),
    })
  })

  it('saves with different currencies', async () => {
    await saveRateQuery('GBP', 'CNY', 9.2, 50, 460)
    expect(mockAdd).toHaveBeenCalledWith({
      fromCurrency: 'GBP',
      toCurrency: 'CNY',
      rate: 9.2,
      amount: 50,
      result: 460,
      queriedAt: expect.any(Date),
    })
  })
})

describe('getRateHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns rate history with default limit', async () => {
    const mockData = [
      { id: 1, fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92, amount: 100, result: 92 },
    ]
    mockToArray.mockResolvedValue(mockData)

    const result = await getRateHistory()
    expect(result).toEqual(mockData)
    expect(mockOrderBy).toHaveBeenCalledWith('queriedAt')
    expect(mockReverse).toHaveBeenCalled()
    expect(mockLimit).toHaveBeenCalledWith(20)
  })

  it('returns rate history with custom limit', async () => {
    mockToArray.mockResolvedValue([])

    await getRateHistory(5)
    expect(mockLimit).toHaveBeenCalledWith(5)
  })
})

describe('clearRateHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('clears all rate history', async () => {
    await clearRateHistory()
    expect(mockClear).toHaveBeenCalled()
  })
})
