'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { getInvoices, deleteInvoice, type SyncInvoice } from '@/lib/sync'
import { Plus, FileText, Edit, Trash2, Download, Archive, Loader2, Lock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { InvoiceEditor } from '@/components/InvoiceEditor'
import { generateInvoicePDF } from '@/lib/generateInvoicePDF'
import { batchExportInvoicesPDF } from '@/lib/batchExportPDF'
import { checkBatchExportUsage, recordBatchExportUsage } from '@/lib/batchExportUsage'
import { useI18n } from '@/hooks/useI18n'

export function Invoices() {
  const { t } = useI18n()
  const { user } = useAuthStore()
  const [invoices, setInvoices] = useState<SyncInvoice[]>([])
  const [showEditor, setShowEditor] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<SyncInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [batchExporting, setBatchExporting] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 })
  const [batchUsage, setBatchUsage] = useState<{ allowed: boolean; used: number; limit: number; hasSubscription: boolean } | null>(null)

  useEffect(() => {
    if (user) {
      loadInvoicesFromSupabase()
    } else {
      // Guest mode: load from localStorage
      loadGuestInvoices()
    }
    checkBatchExportUsage(user?.id).then(setBatchUsage)
  }, [user])

  async function loadInvoicesFromSupabase() {
    if (!user) return
    try {
      setLoading(true)
      const data = await getInvoices(user.id)
      setInvoices(data)
    } catch (err) {
      console.error('Failed to load invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  function loadGuestInvoices() {
    try {
      setLoading(true)
      const guestInvoices = JSON.parse(localStorage.getItem('guest_invoices') || '[]')
      setInvoices(guestInvoices)
    } catch (err) {
      console.error('Failed to load guest invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleCreate() {
    setEditingInvoice(null)
    setShowEditor(true)
  }

  function handleEdit(invoice: SyncInvoice) {
    setEditingInvoice(invoice)
    setShowEditor(true)
  }

  async function handleDelete(id: string) {
    if (confirm(t('common.confirm'))) {
      try {
        if (user) {
          await deleteInvoice(user.id, id)
        } else {
          // Guest mode: remove from localStorage
          const guestInvoices = JSON.parse(localStorage.getItem('guest_invoices') || '[]')
          const filtered = guestInvoices.filter((inv: any) => inv.id !== id)
          localStorage.setItem('guest_invoices', JSON.stringify(filtered))
        }
        if (user) {
          loadInvoicesFromSupabase()
        } else {
          loadGuestInvoices()
        }
      } catch (err) {
        console.error('Failed to delete invoice:', err)
        alert(t('common.error'))
      }
    }
  }

  function handleSave() {
    setShowEditor(false)
    setEditingInvoice(null)
    if (user) {
      loadInvoicesFromSupabase()
    } else {
      loadGuestInvoices()
    }
  }

  async function handleBatchExport() {
    if (invoices.length === 0) return

    const usage = await checkBatchExportUsage(user?.id)
    if (!usage.allowed) {
      setBatchUsage(usage)
      return
    }

    setBatchExporting(true)
    setBatchProgress({ current: 0, total: invoices.length })

    try {
      await batchExportInvoicesPDF(
        invoices,
        user?.id,
        (current, total) => setBatchProgress({ current, total })
      )
      await recordBatchExportUsage(user?.id)
      const newUsage = await checkBatchExportUsage(user?.id)
      setBatchUsage(newUsage)
    } catch (err) {
      console.error('Batch export failed:', err)
    } finally {
      setBatchExporting(false)
      setBatchProgress({ current: 0, total: 0 })
    }
  }

  if (showEditor) {
    return (
      <InvoiceEditor
        invoice={editingInvoice}
        onSave={handleSave}
        onCancel={() => {
          setShowEditor(false)
          setEditingInvoice(null)
        }}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('invoices.title')}</h1>
          <p className="text-slate-500 mt-1">{t('invoices.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {invoices.length > 0 && (
            <div className="flex flex-col items-end">
              <button
                onClick={handleBatchExport}
                disabled={batchExporting || (batchUsage ? !batchUsage.allowed : false)}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {batchExporting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {batchProgress.current}/{batchProgress.total}
                  </>
                ) : batchUsage && !batchUsage.allowed ? (
                  <>
                    <Lock size={18} />
                    {t('invoices.exportAll')}
                  </>
                ) : (
                  <>
                    <Archive size={18} />
                    {t('invoices.exportAll')}
                  </>
                )}
              </button>
              {batchUsage && !batchUsage.hasSubscription && (
                <span className="text-xs text-slate-400 mt-1">
                  {batchUsage.used}/{batchUsage.limit} {t('invoices.freeUsed')}
                </span>
              )}
            </div>
          )}
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            {t('invoices.newInvoice')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">{t('common.loading')}</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">{t('invoices.noInvoices')}</h3>
          <p className="text-slate-400 mb-4">{t('invoices.createFirst')}</p>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            {t('invoices.newInvoice')}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-sm font-medium text-slate-600">{t('invoices.invoice')}</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-slate-600">{t('invoices.date')}</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-slate-600">{t('invoices.status')}</th>
                <th className="text-right px-5 py-3 text-sm font-medium text-slate-600">{t('invoices.amount')}</th>
                <th className="text-right px-5 py-3 text-sm font-medium text-slate-600">{t('invoices.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDate(new Date(invoice.issueDate))}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => generateInvoicePDF(invoice as any)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600"
                        title={t('common.download')}
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
