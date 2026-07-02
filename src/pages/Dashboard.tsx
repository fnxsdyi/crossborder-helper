'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { getInvoices, getClients, type SyncInvoice } from '@/lib/sync'
import { FileText, Users, DollarSign, Clock, Plus } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { useAppStore } from '@/stores/appStore'

interface CurrencyStats {
  currency: string
  revenue: number
  pending: number
  count: number
}

export function Dashboard() {
  const { t } = useI18n()
  const { user } = useAuthStore()
  const { setCurrentView } = useAppStore()
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalClients: 0,
    totalRevenue: 0,
    pendingAmount: 0,
  })
  const [recentInvoices, setRecentInvoices] = useState<SyncInvoice[]>([])
  const [currencyStats, setCurrencyStats] = useState<CurrencyStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadStats()
    } else {
      setLoading(false)
    }
  }, [user])

  async function loadStats() {
    if (!user) return
    try {
      setLoading(true)
      const invoices = await getInvoices(user.id)
      const clients = await getClients(user.id)

      const totalRevenue = invoices
        .filter((i) => i.status === 'paid')
        .reduce((sum: number, i) => sum + i.total, 0)

      const pendingAmount = invoices
        .filter((i) => i.status === 'sent' || i.status === 'overdue')
        .reduce((sum: number, i) => sum + i.total, 0)

      // Currency breakdown
      const currencyMap = new Map<string, CurrencyStats>()
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

      setStats({
        totalInvoices: invoices.length,
        totalClients: clients.length,
        totalRevenue,
        pendingAmount,
      })

      setRecentInvoices(
        invoices
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
      )

      setCurrencyStats(Array.from(currencyMap.values()))
    } catch (err) {
      console.error('Failed to load dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: t('dashboard.totalInvoices'), value: stats.totalInvoices, icon: FileText, color: 'bg-blue-500' },
    { label: t('dashboard.totalClients'), value: stats.totalClients, icon: Users, color: 'bg-green-500' },
    { label: t('dashboard.revenue'), value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'bg-purple-500' },
    { label: t('dashboard.pending'), value: formatCurrency(stats.pendingAmount), icon: Clock, color: 'bg-amber-500' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h1>
        <p className="text-slate-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`${card.color} p-2.5 rounded-lg text-white`}>
                <card.icon size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="text-xl font-semibold">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {currencyStats.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-8">
          <h2 className="font-semibold mb-4">{t('currency.revenueByCurrency')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currencyStats.map((cs) => (
              <div key={cs.currency} className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">{cs.currency}</p>
                <p className="text-lg font-semibold">{formatCurrency(cs.revenue, cs.currency)}</p>
                {cs.pending > 0 && (
                  <p className="text-xs text-amber-600">
                    {formatCurrency(cs.pending, cs.currency)} {t('currency.pending')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h2 className="font-semibold">{t('dashboard.recentInvoices')}</h2>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-slate-400">{t('common.loading')}</p>
            </div>
          ) : recentInvoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">
                {t('dashboard.noInvoices')}
              </p>
              <button
                onClick={() => setCurrentView('invoices')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus size={16} />
                {t('invoices.newInvoice')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-slate-500">{formatDate(new Date(invoice.issueDate))}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(invoice.total, invoice.currency)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}