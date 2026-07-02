import { useState } from 'react'
import { CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { useOcrStore } from '@/stores/ocrStore'
import { useAuthStore } from '@/stores/authStore'
import type { OcrResult as OcrResultType } from '@/lib/ocrSchema'
import { getClients, upsertClient, upsertInvoice, getSettings, upsertSettings } from '@/lib/sync'

interface OcrResultProps {
  onRescan: () => void
  onSaved: () => void
}

export function OcrResult({ onRescan, onSaved }: OcrResultProps) {
  const { t } = useI18n()
  const { result, image } = useOcrStore()
  const { user } = useAuthStore()
  const [editing, setEditing] = useState<OcrResultType | null>(result)
  const [saving, setSaving] = useState(false)

  if (!result || !editing) return null

  const confidencePercent = Math.round(result.confidence * 100)
  const isLowConfidence = result.confidence < 0.5

  function getConfidenceColor(conf: number) {
    if (conf >= 0.8) return 'text-green-600 dark:text-green-400'
    if (conf >= 0.5) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  function getConfidenceBarColor(conf: number) {
    if (conf >= 0.8) return 'bg-green-500'
    if (conf >= 0.5) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  function isFieldLowConfidence(value: string | number | null) {
    return value === null || value === '' || value === 0
  }

  async function handleSave() {
    if (!editing || !user) return
    setSaving(true)

    try {
      // Find or create client by vendor_name
      let clientId: string | null = null
      const clients = await getClients(user.id)
      const existingClient = clients.find(c => c.name === editing.vendor_name)
      if (existingClient) {
        clientId = existingClient.id
      } else {
        const newClient = await upsertClient(user.id, {
          name: editing.vendor_name || 'Unknown Vendor',
          email: '',
          company: editing.vendor_name || '',
          country: '',
        })
        clientId = newClient.id
      }

      // Create invoice
      const settings = await getSettings(user.id)
      const prefix = settings.invoicePrefix || 'INV'
      const nextNum = settings.nextInvoiceNumber || 1

      await upsertInvoice(user.id, {
        invoiceNumber: editing.invoice_number || `${prefix}-${String(nextNum).padStart(4, '0')}`,
        clientId,
        issueDate: editing.date || new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft',
        currency: editing.currency || 'USD',
        vatType: 'none',
        template: 'us',
        subtotal: editing.amount || 0,
        taxRate: 0,
        taxAmount: 0,
        total: editing.amount || 0,
        items: [{
          description: editing.vendor_name || 'Invoice item',
          quantity: 1,
          unitPrice: editing.amount || 0,
          amount: editing.amount || 0,
        }],
        ocrProcessed: true,
        ocrConfidence: result?.confidence || null,
      })

      // Update next invoice number
      await upsertSettings(user.id, { nextInvoiceNumber: nextNum + 1 })

      onSaved()
    } catch (err) {
      console.error('Failed to save invoice:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t('ocr.resultTitle')}
        </h1>
        <div className="flex items-center justify-center gap-2">
          <span className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
            {t('ocr.confidence')}: {confidencePercent}%
          </span>
          <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getConfidenceBarColor(result.confidence)} transition-all`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>
        {isLowConfidence && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
            <AlertTriangle size={14} />
            {t('ocr.verifyManually')}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t('editor.invoiceNumber')}
          </label>
          <input
            type="text"
            value={editing.invoice_number || ''}
            onChange={(e) => setEditing({ ...editing, invoice_number: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white ${
              isFieldLowConfidence(editing.invoice_number) ? 'border-amber-400' : 'border-slate-200 dark:border-slate-600'
            }`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('editor.issueDate')}
            </label>
            <input
              type="date"
              value={editing.date || ''}
              onChange={(e) => setEditing({ ...editing, date: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white ${
                isFieldLowConfidence(editing.date) ? 'border-amber-400' : 'border-slate-200 dark:border-slate-600'
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('invoices.amount')}
            </label>
            <input
              type="number"
              step="0.01"
              value={editing.amount || ''}
              onChange={(e) => setEditing({ ...editing, amount: parseFloat(e.target.value) || 0 })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white ${
                isFieldLowConfidence(editing.amount) ? 'border-amber-400' : 'border-slate-200 dark:border-slate-600'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('editor.currency')}
            </label>
            <select
              value={editing.currency || 'USD'}
              onChange={(e) => setEditing({ ...editing, currency: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-white"
            >
              <option value="USD">USD</option>
              <option value="CNY">CNY</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('editor.vendorName')}
            </label>
            <input
              type="text"
              value={editing.vendor_name || ''}
              onChange={(e) => setEditing({ ...editing, vendor_name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white ${
                isFieldLowConfidence(editing.vendor_name) ? 'border-amber-400' : 'border-slate-200 dark:border-slate-600'
              }`}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t('editor.taxId')}
          </label>
          <input
            type="text"
            value={editing.tax_id || ''}
            onChange={(e) => setEditing({ ...editing, tax_id: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={onRescan}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw size={18} />
          {t('ocr.rescan')}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <CheckCircle size={18} />
          )}
          {t('ocr.saveInvoice')}
        </button>
      </div>

      {image && (
        <div className="mt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{t('ocr.originalImage')}</p>
          <img
            src={image}
            alt="Invoice"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700"
          />
        </div>
      )}
    </div>
  )
}
