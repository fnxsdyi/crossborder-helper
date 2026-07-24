import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  aggregateRevenueByCurrency,
  processFXGainLossEntries,
  aggregateMonthlyRevenue,
  aggregateStatusBreakdown,
  aggregateDashboardCurrencyStats,
  computeDashboardSummary,
  totalFXGainLoss,
} from './analytics'
import type { SyncInvoice } from './sync'

vi.mock('./exchangeRate', () => ({
  calculateFXGainLoss: vi.fn(),
}))

import { calculateFXGainLoss } from './exchangeRate'

const mockCalculateFXGainLoss = vi.mocked(calculateFXGainLoss)

function makeInvoice(overrides: Partial<SyncInvoice> = {}): SyncInvoice {
  return {
    id: 'inv-1',
    userId: 'user-1',
    invoiceNumber: 'INV-001',
    clientId: 'client-1',
    issueDate: '2026-07-01',
    dueDate: '2026-07-15',
    status: 'paid',
    currency: 'USD',
    localCurrency: null,
    exchangeRate: null,
    paymentDate: null,
    paymentRate: null,
    vatType: 'none',
    vatNumber: null,
    buyerVatNumber: null,
    template: 'us',
    subtotal: 100,
    taxRate: 0,
    taxAmount: 0,
    total: 100,
    notes: null,
    items: [],
    ocrProcessed: false,
    ocrConfidence: null,
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

describe('aggregateRevenueByCurrency', () => {
  it('groups invoices by currency', () => {
    const invoices = [
      makeInvoice({ currency: 'USD', total: 100, status: 'paid' }),
      makeInvoice({ id: 'inv-2', currency: 'EUR', total: 200, status: 'paid' }),
      makeInvoice({ id: 'inv-3', currency: 'USD', total: 50, status: 'sent' }),
    ]
    const result = aggregateRevenueByCurrency(invoices)

    expect(result).toHaveLength(2)
    const usd = result.find((r) => r.currency === 'USD')
    expect(usd?.totalRevenue).toBe(150)
    expect(usd?.paidAmount).toBe(100)
    expect(usd?.pendingAmount).toBe(50)
    expect(usd?.invoiceCount).toBe(2)
  })

  it('sorts by totalRevenue descending', () => {
    const invoices = [
      makeInvoice({ currency: 'EUR', total: 50, status: 'paid' }),
      makeInvoice({ id: 'inv-2', currency: 'USD', total: 200, status: 'paid' }),
    ]
    const result = aggregateRevenueByCurrency(invoices)

    expect(result[0].currency).toBe('USD')
    expect(result[1].currency).toBe('EUR')
  })

  it('tracks paid vs pending amounts separately', () => {
    const invoices = [
      makeInvoice({ currency: 'USD', total: 100, status: 'paid' }),
      makeInvoice({ id: 'inv-2', currency: 'USD', total: 200, status: 'sent' }),
      makeInvoice({ id: 'inv-3', currency: 'USD', total: 300, status: 'overdue' }),
    ]
    const result = aggregateRevenueByCurrency(invoices)
    const usd = result[0]

    expect(usd.paidAmount).toBe(100)
    expect(usd.pendingAmount).toBe(500)
    expect(usd.totalRevenue).toBe(600)
  })

  it('handles empty array', () => {
    expect(aggregateRevenueByCurrency([])).toEqual([])
  })

  it('handles single invoice', () => {
    const result = aggregateRevenueByCurrency([makeInvoice()])
    expect(result).toHaveLength(1)
    expect(result[0].currency).toBe('USD')
    expect(result[0].totalRevenue).toBe(100)
  })
})

describe('processFXGainLossEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('only includes paid invoices with FX data', () => {
    mockCalculateFXGainLoss.mockReturnValue({ gainLoss: 10, percentage: 2.5 })

    const invoices = [
      makeInvoice({
        status: 'paid',
        localCurrency: 'CNY',
        exchangeRate: 7.2,
        paymentRate: 7.1,
        paymentDate: '2026-07-10',
      }),
      makeInvoice({ id: 'inv-2', status: 'sent', localCurrency: 'CNY', exchangeRate: 7.2, paymentRate: 7.1 }),
    ]

    const result = processFXGainLossEntries(invoices)
    expect(result).toHaveLength(1)
    expect(mockCalculateFXGainLoss).toHaveBeenCalledTimes(1)
  })

  it('sorts by paymentDate descending', () => {
    mockCalculateFXGainLoss.mockReturnValue({ gainLoss: 5, percentage: 1 })

    const invoices = [
      makeInvoice({
        status: 'paid',
        localCurrency: 'CNY',
        exchangeRate: 7.2,
        paymentRate: 7.1,
        paymentDate: '2026-07-01',
      }),
      makeInvoice({
        id: 'inv-2',
        status: 'paid',
        localCurrency: 'CNY',
        exchangeRate: 7.2,
        paymentRate: 7.1,
        paymentDate: '2026-07-15',
      }),
    ]

    const result = processFXGainLossEntries(invoices)
    expect(result[0].paymentDate).toContain('2026-07-15')
    expect(result[1].paymentDate).toContain('2026-07-01')
  })

  it('excludes invoices without localCurrency/exchangeRate/paymentRate', () => {
    const invoices = [
      makeInvoice({ status: 'paid', localCurrency: null, exchangeRate: null, paymentRate: null }),
    ]

    const result = processFXGainLossEntries(invoices)
    expect(result).toHaveLength(0)
    expect(mockCalculateFXGainLoss).not.toHaveBeenCalled()
  })

  it('handles empty array', () => {
    expect(processFXGainLossEntries([])).toEqual([])
  })
})

describe('aggregateMonthlyRevenue', () => {
  it('groups paid invoices by month', () => {
    const invoices = [
      makeInvoice({ status: 'paid', issueDate: '2026-01-15', total: 100, currency: 'USD' }),
      makeInvoice({ id: 'inv-2', status: 'paid', issueDate: '2026-01-20', total: 200, currency: 'EUR' }),
      makeInvoice({ id: 'inv-3', status: 'paid', issueDate: '2026-02-10', total: 150, currency: 'USD' }),
    ]

    const result = aggregateMonthlyRevenue(invoices)
    expect(result).toHaveLength(2)
    expect(result[0].total).toBe(300)
    expect(result[0].currencies).toEqual({ USD: 100, EUR: 200 })
    expect(result[1].total).toBe(150)
  })

  it('limits to last N months', () => {
    const invoices = Array.from({ length: 15 }, (_, i) =>
      makeInvoice({
        id: `inv-${i}`,
        status: 'paid',
        issueDate: `2025-${String((i % 12) + 1).padStart(2, '0')}-01`,
        total: 100,
      })
    )

    const result = aggregateMonthlyRevenue(invoices, 12)
    expect(result.length).toBeLessThanOrEqual(12)
  })

  it('sorts chronologically ascending', () => {
    const invoices = [
      makeInvoice({ status: 'paid', issueDate: '2026-03-01', total: 100 }),
      makeInvoice({ id: 'inv-2', status: 'paid', issueDate: '2026-01-01', total: 200 }),
    ]

    const result = aggregateMonthlyRevenue(invoices)
    expect(result[0].month).toContain('Jan')
    expect(result[1].month).toContain('Mar')
  })

  it('excludes unpaid invoices', () => {
    const invoices = [
      makeInvoice({ status: 'sent', issueDate: '2026-01-01', total: 100 }),
      makeInvoice({ id: 'inv-2', status: 'draft', issueDate: '2026-01-01', total: 200 }),
    ]

    const result = aggregateMonthlyRevenue(invoices)
    expect(result).toHaveLength(0)
  })

  it('handles empty array', () => {
    expect(aggregateMonthlyRevenue([])).toEqual([])
  })
})

describe('aggregateStatusBreakdown', () => {
  it('counts invoices per status', () => {
    const invoices = [
      makeInvoice({ status: 'paid', total: 100 }),
      makeInvoice({ id: 'inv-2', status: 'paid', total: 200 }),
      makeInvoice({ id: 'inv-3', status: 'sent', total: 300 }),
    ]

    const result = aggregateStatusBreakdown(invoices)
    expect(result).toHaveLength(2)
    const paid = result.find((r) => r.status === 'paid')
    expect(paid?.count).toBe(2)
    expect(paid?.total).toBe(300)
  })

  it('handles all four statuses', () => {
    const invoices = [
      makeInvoice({ status: 'draft', total: 100 }),
      makeInvoice({ id: 'inv-2', status: 'sent', total: 200 }),
      makeInvoice({ id: 'inv-3', status: 'paid', total: 300 }),
      makeInvoice({ id: 'inv-4', status: 'overdue', total: 400 }),
    ]

    const result = aggregateStatusBreakdown(invoices)
    expect(result).toHaveLength(4)
  })

  it('handles empty array', () => {
    expect(aggregateStatusBreakdown([])).toEqual([])
  })
})

describe('aggregateDashboardCurrencyStats', () => {
  it('tracks revenue for paid invoices', () => {
    const invoices = [
      makeInvoice({ currency: 'USD', status: 'paid', total: 100 }),
      makeInvoice({ id: 'inv-2', currency: 'USD', status: 'sent', total: 200 }),
    ]

    const result = aggregateDashboardCurrencyStats(invoices)
    const usd = result.find((r) => r.currency === 'USD')
    expect(usd?.revenue).toBe(100)
    expect(usd?.pending).toBe(200)
    expect(usd?.count).toBe(2)
  })

  it('tracks pending for sent/overdue invoices', () => {
    const invoices = [
      makeInvoice({ currency: 'EUR', status: 'sent', total: 100 }),
      makeInvoice({ id: 'inv-2', currency: 'EUR', status: 'overdue', total: 200 }),
    ]

    const result = aggregateDashboardCurrencyStats(invoices)
    const eur = result.find((r) => r.currency === 'EUR')
    expect(eur?.pending).toBe(300)
    expect(eur?.revenue).toBe(0)
  })

  it('handles empty array', () => {
    expect(aggregateDashboardCurrencyStats([])).toEqual([])
  })
})

describe('computeDashboardSummary', () => {
  it('computes totalRevenue from paid invoices only', () => {
    const invoices = [
      makeInvoice({ status: 'paid', total: 100 }),
      makeInvoice({ id: 'inv-2', status: 'sent', total: 200 }),
    ]

    const result = computeDashboardSummary(invoices, 5)
    expect(result.totalRevenue).toBe(100)
    expect(result.totalInvoices).toBe(2)
    expect(result.totalClients).toBe(5)
  })

  it('computes pendingAmount from sent/overdue invoices', () => {
    const invoices = [
      makeInvoice({ status: 'sent', total: 100 }),
      makeInvoice({ id: 'inv-2', status: 'overdue', total: 200 }),
      makeInvoice({ id: 'inv-3', status: 'paid', total: 300 }),
    ]

    const result = computeDashboardSummary(invoices, 0)
    expect(result.pendingAmount).toBe(300)
    expect(result.totalRevenue).toBe(300)
  })

  it('handles empty invoices', () => {
    const result = computeDashboardSummary([], 0)
    expect(result.totalRevenue).toBe(0)
    expect(result.totalInvoices).toBe(0)
    expect(result.totalClients).toBe(0)
    expect(result.pendingAmount).toBe(0)
  })
})

describe('totalFXGainLoss', () => {
  it('sums gainLoss across entries', () => {
    const entries = [
      { gainLoss: 10 } as any,
      { gainLoss: -5 } as any,
      { gainLoss: 3 } as any,
    ]
    expect(totalFXGainLoss(entries)).toBe(8)
  })

  it('returns 0 for empty array', () => {
    expect(totalFXGainLoss([])).toBe(0)
  })

  it('handles negative values', () => {
    const entries = [{ gainLoss: -100 }, { gainLoss: -50 }] as any[]
    expect(totalFXGainLoss(entries)).toBe(-150)
  })
})
