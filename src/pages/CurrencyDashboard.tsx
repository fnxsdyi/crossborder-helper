import { useEffect, useState } from 'react'
import db, { type Invoice } from '@/db'
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  RefreshCw,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getExchangeRate, CURRENCIES, calculateFXGainLoss } from '@/lib/exchangeRate'
import { PremiumGate } from '@/components/PremiumGate'
import { useI18n } from '@/hooks/useI18n'

interface CurrencyRevenue {
  currency: string
  totalRevenue: number
  paidAmount: number
  pendingAmount: number
  invoiceCount: number
}

interface FXEntry {
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

interface MonthlyRevenue {
  month: string
  total: number
  currencies: Record<string, number>
}

interface StatusCount {
  status: string
  count: number
  total: number
}

export function CurrencyDashboard() {
  const { t } = useI18n()
  const [currencyRevenue, setCurrencyRevenue] = useState<CurrencyRevenue[]>([])
  const [fxEntries, setFxEntries] = useState<FXEntry[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])
  const [statusBreakdown, setStatusBreakdown] = useState<StatusCount[]>([])
  const [totalFXGainLoss, setTotalFXGainLoss] = useState(0)
  const [converterFrom, setConverterFrom] = useState('USD')
  const [converterTo, setConverterTo] = useState('EUR')
  const [converterAmount, setConverterAmount] = useState('1')
  const [converterResult, setConverterResult] = useState<number | null>(null)
  const [loadingRate, setLoadingRate] = useState(false)
  const [baseCurrency, setBaseCurrency] = useState('USD')
  const [totalRevenueBase, setTotalRevenueBase] = useState(0)
  const [totalPendingBase, setTotalPendingBase] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const invoiceData = await db.invoices.toArray()
    const settings = await db.settings.toCollection().first()

    if (settings?.defaultCurrency) {
      setBaseCurrency(settings.defaultCurrency)
    }

    processCurrencyRevenue(invoiceData)
    processFXEntries(invoiceData)
    processMonthlyRevenue(invoiceData)
    processStatusBreakdown(invoiceData)
    await convertTotalToBase(invoiceData, settings?.defaultCurrency || 'USD')
  }

  function processCurrencyRevenue(invoices: Invoice[]) {
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

    setCurrencyRevenue(Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue))
  }

  function processFXEntries(invoices: Invoice[]) {
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
    setFxEntries(entries)

    const total = entries.reduce((sum, e) => sum + e.gainLoss, 0)
    setTotalFXGainLoss(total)
  }

  function processMonthlyRevenue(invoices: Invoice[]) {
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

    const sorted = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([, v]) => v)

    setMonthlyRevenue(sorted)
  }

  function processStatusBreakdown(invoices: Invoice[]) {
    const map = new Map<string, StatusCount>()

    invoices.forEach((inv) => {
      const existing = map.get(inv.status) || { status: inv.status, count: 0, total: 0 }
      existing.count++
      existing.total += inv.total
      map.set(inv.status, existing)
    })

    setStatusBreakdown(Array.from(map.values()))
  }

  async function convertTotalToBase(invoices: Invoice[], targetCurrency: string) {
    let totalRevenue = 0
    let totalPending = 0

    for (const inv of invoices) {
      if (inv.currency === targetCurrency) {
        totalRevenue += inv.total
        if (inv.status === 'sent' || inv.status === 'overdue') {
          totalPending += inv.total
        }
        continue
      }

      const rate = await getExchangeRate(inv.currency, targetCurrency)
      const converted = inv.total * (rate || 1)

      if (inv.status === 'paid') {
        totalRevenue += converted
      } else if (inv.status === 'sent' || inv.status === 'overdue') {
        totalPending += converted
      }
    }

    setTotalRevenueBase(totalRevenue)
    setTotalPendingBase(totalPending)
  }

  async function handleConvert() {
    if (!converterAmount || Number(converterAmount) <= 0) return
    setLoadingRate(true)
    try {
      const rate = await getExchangeRate(converterFrom, converterTo)
      if (rate) {
        setConverterResult(Number(converterAmount) * rate)
      }
    } catch {
      setConverterResult(null)
    }
    setLoadingRate(false)
  }

  const maxMonthly = Math.max(...monthlyRevenue.map((m) => m.total), 1)

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('currency.title')}</h1>
        <p className="text-slate-500 mt-1">{t('currency.subtitle')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2.5 rounded-lg text-white">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('currency.totalRevenue')} ({baseCurrency})</p>
              <p className="text-xl font-semibold">{formatCurrency(totalRevenueBase, baseCurrency)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2.5 rounded-lg text-white">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('currency.pending')} ({baseCurrency})</p>
              <p className="text-xl font-semibold">{formatCurrency(totalPendingBase, baseCurrency)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className={`${totalFXGainLoss >= 0 ? 'bg-green-500' : 'bg-red-500'} p-2.5 rounded-lg text-white`}>
              {totalFXGainLoss >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('currency.fxGainLoss')}</p>
              <p className={`text-xl font-semibold ${totalFXGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalFXGainLoss >= 0 ? '+' : ''}{totalFXGainLoss.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 p-2.5 rounded-lg text-white">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('currency.currenciesUsed')}</p>
              <p className="text-xl font-semibold">{currencyRevenue.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Currency */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold mb-4">{t('currency.revenueByCurrency')}</h2>
          {currencyRevenue.length === 0 ? (
            <p className="text-slate-400 text-center py-8">{t('currency.noRevenue')}</p>
          ) : (
            <div className="space-y-4">
              {currencyRevenue.map((cr) => {
                const maxTotal = currencyRevenue[0]?.totalRevenue || 1
                const widthPercent = (cr.totalRevenue / maxTotal) * 100

                return (
                  <div key={cr.currency}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{cr.currency}</span>
                        <span className="text-xs text-slate-400">{cr.invoiceCount} {t('currency.invoices')}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">{formatCurrency(cr.totalRevenue, cr.currency)}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-slate-500">
                      <span className="text-green-600">{t('currency.paid')} {formatCurrency(cr.paidAmount, cr.currency)}</span>
                      {cr.pendingAmount > 0 && (
                        <span className="text-amber-600">{t('currency.pendingAmount')} {formatCurrency(cr.pendingAmount, cr.currency)}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Invoice Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold mb-4">{t('currency.invoiceStatus')}</h2>
          {statusBreakdown.length === 0 ? (
            <p className="text-slate-400 text-center py-8">{t('currency.noInvoices')}</p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map((sb) => (
                <div key={sb.status} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    {sb.status === 'paid' ? (
                      <CheckCircle2 size={18} className="text-green-500" />
                    ) : sb.status === 'overdue' ? (
                      <AlertCircle size={18} className="text-red-500" />
                    ) : sb.status === 'sent' ? (
                      <Clock size={18} className="text-blue-500" />
                    ) : (
                      <FileIcon size={18} className="text-slate-400" />
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[sb.status] || 'bg-slate-100 text-slate-700'}`}>
                      {sb.status}
                    </span>
                    <span className="text-sm text-slate-500">{sb.count} invoices</span>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(sb.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="font-semibold mb-4">{t('currency.monthlyRevenue')}</h2>
        {monthlyRevenue.length === 0 ? (
          <p className="text-slate-400 text-center py-8">{t('currency.noPaidInvoices')}</p>
        ) : (
          <div className="flex items-end gap-2 h-48 overflow-x-auto">
            {monthlyRevenue.map((m, i) => (
              <div key={i} className="flex flex-col items-center flex-1 min-w-[60px]">
                <span className="text-[10px] text-slate-400 mb-1 whitespace-nowrap">
                  {m.total >= 1000 ? `${(m.total / 1000).toFixed(1)}k` : m.total.toFixed(0)}
                </span>
                <div
                  className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                  style={{
                    height: `${(m.total / maxMonthly) * 160}px`,
                    minHeight: '4px',
                  }}
                  title={`${m.month}: ${formatCurrency(m.total)}`}
                />
                <span className="text-[10px] text-slate-500 mt-1.5 whitespace-nowrap">{m.month}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* FX Gain/Loss Table */}
        <PremiumGate feature="FX gain/loss analysis">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold mb-4">{t('currency.realizedFxGainLoss')}</h2>
            {fxEntries.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-400 text-sm">
                  {t('currency.fxTrackingHint')}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {fxEntries.map((entry) => (
                  <div
                    key={entry.invoiceId}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 text-sm"
                  >
                    <div>
                      <p className="font-medium">{entry.invoiceNumber}</p>
                      <p className="text-xs text-slate-400">
                        {formatCurrency(entry.amount, entry.currency)} → {entry.localCurrency}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${entry.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.gainLoss >= 0 ? '+' : ''}{entry.gainLoss.toFixed(2)} {entry.localCurrency}
                      </p>
                      <p className="text-xs text-slate-400">
                        {entry.gainLoss >= 0 ? '+' : ''}{entry.percentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PremiumGate>

        {/* Currency Converter */}
        <PremiumGate feature="currency converter">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <ArrowRightLeft size={18} />
              {t('currency.converter')}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 mb-1">{t('currency.from')}</label>
                  <select
                    value={converterFrom}
                    onChange={(e) => setConverterFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">{t('currency.to')}</label>
                  <select
                    value={converterTo}
                    onChange={(e) => setConverterTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">{t('currency.amount')}</label>
                <input
                  type="number"
                  value={converterAmount}
                  onChange={(e) => setConverterAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  min="0"
                  step="any"
                />
              </div>
              <button
                onClick={handleConvert}
                disabled={loadingRate}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                <RefreshCw size={16} className={loadingRate ? 'animate-spin' : ''} />
                {loadingRate ? t('currency.converting') : t('currency.convert')}
              </button>
              {converterResult !== null && (
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-blue-600">{t('currency.result')}</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(converterResult, converterTo)}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    1 {converterFrom} ≈ {(converterResult / Number(converterAmount || 1)).toFixed(4)} {converterTo}
                  </p>
                </div>
              )}
            </div>
          </div>
        </PremiumGate>
      </div>
    </div>
  )
}

function FileIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  )
}
