import { useEffect, useState } from 'react'
import db, { type Invoice } from '@/db'
import { Plus, FileText, Edit, Trash2, Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { InvoiceEditor } from '@/components/InvoiceEditor'
import { generateInvoicePDF } from '@/lib/generateInvoicePDF'
import { useI18n } from '@/hooks/useI18n'

export function Invoices() {
  const { t } = useI18n()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showEditor, setShowEditor] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    loadInvoices()
  }, [])

  async function loadInvoices() {
    const data = await db.invoices.orderBy('createdAt').reverse().toArray()
    setInvoices(data)
  }

  function handleCreate() {
    setEditingInvoice(null)
    setShowEditor(true)
  }

  function handleEdit(invoice: Invoice) {
    setEditingInvoice(invoice)
    setShowEditor(true)
  }

  async function handleDelete(id: number) {
    if (confirm(t('common.confirm'))) {
      await db.invoices.delete(id)
      loadInvoices()
    }
  }

  function handleSave() {
    setShowEditor(false)
    setEditingInvoice(null)
    loadInvoices()
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
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          {t('invoices.newInvoice')}
        </button>
      </div>

      {invoices.length === 0 ? (
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
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
                    {formatDate(invoice.issueDate)}
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
                        onClick={() => generateInvoicePDF(invoice)}
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
                        onClick={() => handleDelete(invoice.id!)}
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
