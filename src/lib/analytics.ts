import type { SyncInvoice } from '@/lib/sync'
import { calculateFXGainLoss } from '@/lib/exchangeRate'

export interface CurrencyRevenue {
  currency: string
  totalRevenue: number
  paidAmount: number
  pendingAmount: number
  invoiceCount: number
}

export interface FXEntry {
  invoiceId: string
  invoiceNumber: string
  currency: string
  localCurrency: string
  amount: number
  gainLoss: number
  percentage: number
  issueDate: string
  paymentDate: string
}

export interface MonthlyRevenue {
  month: string
  total: number
  currencies: Record<string, number>
}

export interface StatusCount {
  status: string
  count: number
  total: number
}

export interface DashboardCurrencyStats {
  currency: string
  revenue: number
  pending: number
  count: number
}

export interface DashboardSummary {
  totalRevenue: number
  totalInvoices: number
  totalClients: number
  pendingAmount: number
}

export function aggregateRevenueByCurrency(invoices: SyncInvoice[]): CurrencyRevenue[] {
  const map = new Map<string, CurrencyRevenue>()

  invoices.forEach((inv) => {
    const existing = map.get(inv.currency) || {
      currency: inv.currency,
      totalRevenue: 0,
      paidAmount: 0,
      pendingAmount: 0,
      invoiceCount: 0,
    }

    existing.invoiceCount++
    existing.totalRevenue += inv.total

    if (inv.status === 'paid') {
      existing.paidAmount += inv.total
    } else if (inv.status === 'sent' || inv.status === 'overdue') {
      existing.pendingAmount += inv.total
    }

    map.set(inv.currency, existing)
  })

  return Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue)
}

export function processFXGainLossEntries(invoices: SyncInvoice[]): FXEntry[] {
  const entries: FXEntry[] = []

  invoices
    .filter((inv) => inv.status === 'paid' && inv.localCurrency && inv.exchangeRate && inv.paymentRate)
    .forEach((inv) => {
      const result = calculateFXGainLoss(
        inv.total,
        inv.currency,
        inv.localCurrency!,
        inv.exchangeRate!,
        inv.paymentRate!
      )

      if (result) {
        entries.push({
          invoiceId: String(inv.id),
          invoiceNumber: inv.invoiceNumber,
          currency: inv.currency,
          localCurrency: inv.localCurrency!,
          amount: inv.total,
          gainLoss: result.gainLoss,
          percentage: result.percentage,
          issueDate: new Date(inv.issueDate).toISOString(),
          paymentDate: inv.paymentDate ? new Date(inv.paymentDate).toISOString() : '',
        })
      }
    })

  entries.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
  return entries
}

export function aggregateMonthlyRevenue(invoices: SyncInvoice[], months = 12): MonthlyRevenue[] {
  const monthlyMap = new Map<string, MonthlyRevenue>()

  invoices
    .filter((inv) => inv.status === 'paid')
    .forEach((inv) => {
      const date = new Date(inv.issueDate)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })

      const existing = monthlyMap.get(key) || {
        month: monthLabel,
        total: 0,
        currencies: {},
      }

      existing.total += inv.total
      existing.currencies[inv.currency] = (existing.currencies[inv.currency] || 0) + inv.total
      monthlyMap.set(key, existing)
    })

  return Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-months)
    .map(([, v]) => v)
}

export function aggregateStatusBreakdown(invoices: SyncInvoice[]): StatusCount[] {
  const map = new Map<string, StatusCount>()

  invoices.forEach((inv) => {
    const existing = map.get(inv.status) || { status: inv.status, count: 0, total: 0 }
    existing.count++
    existing.total += inv.total
    map.set(inv.status, existing)
  })

  return Array.from(map.values())
}

export function aggregateDashboardCurrencyStats(invoices: SyncInvoice[]): DashboardCurrencyStats[] {
  const currencyMap = new Map<string, DashboardCurrencyStats>()

  invoices.forEach((inv) => {
    const existing = currencyMap.get(inv.currency) || {
      currency: inv.currency,
      revenue: 0,
      pending: 0,
      count: 0,
    }
    existing.count++
    if (inv.status === 'paid') existing.revenue += inv.total
    if (inv.status === 'sent' || inv.status === 'overdue') existing.pending += inv.total
    currencyMap.set(inv.currency, existing)
  })

  return Array.from(currencyMap.values())
}

export function computeDashboardSummary(invoices: SyncInvoice[], clientCount: number): DashboardSummary {
  const totalRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0)

  const pendingAmount = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.total, 0)

  return {
    totalRevenue,
    totalInvoices: invoices.length,
    totalClients: clientCount,
    pendingAmount,
  }
}

export function totalFXGainLoss(entries: FXEntry[]): number {
  return entries.reduce((sum, e) => sum + e.gainLoss, 0)
}
