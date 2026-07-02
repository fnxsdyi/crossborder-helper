import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { getClients, upsertClient, upsertInvoice, getSettings, upsertSettings, type SyncClient, type SyncInvoice, type SyncInvoiceItem } from '@/lib/sync'
import { Save, Plus, Trash2, Download, RefreshCw, Info } from 'lucide-react'
import { generateInvoicePDF } from '@/lib/generateInvoicePDF'
import { getExchangeRate, CURRENCIES, calculateFXGainLoss } from '@/lib/exchangeRate'
import { useI18n } from '@/hooks/useI18n'

interface InvoiceEditorProps {
  invoice: SyncInvoice | null
  onSave: () => void
  onCancel: () => void
}

export function InvoiceEditor({ invoice, onSave, onCancel }: InvoiceEditorProps) {
  const { t } = useI18n()
  const { user } = useAuthStore()
  const [clients, setClients] = useState<SyncClient[]>([])
  const [clientId, setClientId] = useState<string>(invoice?.clientId || '')
  const [invoiceNumber, setInvoiceNumber] = useState(invoice?.invoiceNumber || '')
  const [issueDate, setIssueDate] = useState(
    invoice?.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  )
  const [dueDate, setDueDate] = useState(() => {
    if (invoice?.dueDate) return new Date(invoice.dueDate).toISOString().split('T')[0]
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })
  const [currency, setCurrency] = useState(invoice?.currency || 'USD')
  const [localCurrency, setLocalCurrency] = useState(invoice?.localCurrency || '')
  const [exchangeRate, setExchangeRate] = useState<number | null>(invoice?.exchangeRate || null)
  const [paymentDate, setPaymentDate] = useState(
    invoice?.paymentDate ? new Date(invoice.paymentDate).toISOString().split('T')[0] : ''
  )
  const [paymentRate, setPaymentRate] = useState<number | null>(invoice?.paymentRate || null)
  const [loadingRate, setLoadingRate] = useState(false)
  const [taxRate, setTaxRate] = useState(invoice?.taxRate || 0)
  const [vatType, setVatType] = useState<'none' | 'standard' | 'reverse_charge' | 'exempt'>(invoice?.vatType || 'none')
  const [vatNumber, setVatNumber] = useState(invoice?.vatNumber || '')
  const [buyerVatNumber, setBuyerVatNumber] = useState(invoice?.buyerVatNumber || '')
  const [template, setTemplate] = useState<'us' | 'eu' | 'uk'>(invoice?.template || 'us')
  const [notes, setNotes] = useState(invoice?.notes || '')
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items || [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }]
  )

  useEffect(() => {
    if (user) {
      loadClients()
      if (!invoice) generateInvoiceNumber()
    }
  }, [user])

  async function loadClients() {
    if (!user) return
    try {
      const data = await getClients(user.id)
      setClients(data)
    } catch (err) {
      console.error('Failed to load clients:', err)
    }
  }

  async function generateInvoiceNumber() {
    if (!user) return
    try {
      const settings = await getSettings(user.id)
      const prefix = settings.invoicePrefix || 'INV'
      const nextNum = settings.nextInvoiceNumber || 1
      setInvoiceNumber(`${prefix}-${String(nextNum).padStart(4, '0')}`)
    } catch (err) {
      console.error('Failed to get settings:', err)
    }
  }

  function handleItemChange(index: number, field: keyof InvoiceItem, value: string | number) {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice
    }
    setItems(newItems)
  }

  function addItem() {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }])
  }

  function removeItem(index: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)

  // Reverse charge means the buyer accounts for VAT, not the seller
  const isReverseCharge = vatType === 'reverse_charge'
  const isExempt = vatType === 'exempt'

  // Calculate tax based on VAT type
  let taxAmount = 0
  let effectiveTaxRate = taxRate

  if (isReverseCharge || isExempt) {
    // No tax charged - reverse charge or exempt
    effectiveTaxRate = 0
    taxAmount = 0
  } else {
    // Standard VAT calculation
    taxAmount = subtotal * (taxRate / 100)
  }

  const total = subtotal + taxAmount

  function formatCurrency(amount: number, curr: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(amount)
  }

  async function handleSave() {
    if (!user) return

    const invoiceData = {
      id: invoice?.id,
      invoiceNumber,
      clientId: clientId || null,
      issueDate,
      dueDate,
      status: (invoice?.status || 'draft') as SyncInvoice['status'],
      currency,
      localCurrency: localCurrency || null,
      exchangeRate: exchangeRate || null,
      paymentDate: paymentDate || null,
      paymentRate: paymentRate || null,
      vatType,
      vatNumber: vatNumber || null,
      buyerVatNumber: buyerVatNumber || null,
      template,
      subtotal,
      taxRate: effectiveTaxRate,
      taxAmount,
      total,
      notes: notes || null,
      items: items as SyncInvoiceItem[],
      ocrProcessed: invoice?.ocrProcessed || false,
      ocrConfidence: invoice?.ocrConfidence || null,
    }

    await upsertInvoice(user.id, invoiceData)

    // Increment next invoice number for new invoices
    if (!invoice?.id) {
      try {
        const settings = await getSettings(user.id)
        await upsertSettings(user.id, { nextInvoiceNumber: (settings.nextInvoiceNumber || 1) + 1 })
      } catch (err) {
        console.error('Failed to update invoice number:', err)
      }
    }

    onSave()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {invoice ? t('editor.editInvoice') : t('editor.newInvoice')}
        </h1>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            {t('editor.cancel')}
          </button>
          {invoice && (
            <button
              onClick={() => generateInvoicePDF(invoice)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <Download size={16} />
              {t('editor.exportPdf')}
            </button>
          )}
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
            <Save size={16} />
            {t('editor.save')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold mb-4">{t('editor.invoiceDetails')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('editor.invoiceNumber')}</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('editor.client')}</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">{t('editor.selectClient')}</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('editor.issueDate')}</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('editor.dueDate')}</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Invoice Template */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold mb-4">{t('editor.invoiceTemplate')}</h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTemplate('us')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  template === 'us'
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-medium text-sm">{t('editor.templateUs')}</p>
                <p className="text-xs text-slate-500 mt-1">{t('editor.templateUsDesc')}</p>
              </button>
              <button
                onClick={() => setTemplate('eu')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  template === 'eu'
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-medium text-sm">{t('editor.templateEu')}</p>
                <p className="text-xs text-slate-500 mt-1">{t('editor.templateEuDesc')}</p>
              </button>
              <button
                onClick={() => setTemplate('uk')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  template === 'uk'
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-medium text-sm">{t('editor.templateUk')}</p>
                <p className="text-xs text-slate-500 mt-1">{t('editor.templateUkDesc')}</p>
              </button>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{t('editor.lineItems')}</h2>
              <button onClick={addItem} className="flex items-center gap-1 text-sm text-primary hover:text-primary/80">
                <Plus size={16} /> {t('editor.addItem')}
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="px-3 py-2 text-sm font-medium bg-slate-50 rounded-lg">
                      ${item.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold mb-4">{t('editor.notes')}</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t('editor.notesPlaceholder')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold mb-4">{t('editor.summary')}</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{t('editor.subtotal')}</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{t('editor.tax')}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    disabled={isReverseCharge || isExempt}
                    className="w-16 px-2 py-1 border border-slate-200 rounded text-sm text-right disabled:opacity-50"
                  />
                  <span className="text-slate-500">%</span>
                </div>
              </div>
              {(isReverseCharge || isExempt) && (
                <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  {isReverseCharge ? t('editor.vatReverseCharge') : t('editor.vatExempt')}
                </div>
              )}
              <div className="border-t border-slate-200 pt-3 flex justify-between font-semibold">
                <span>{t('editor.total')}</span>
                <span>{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>

          {/* VAT Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold mb-4">{t('editor.vatGst')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-500 mb-1">{t('editor.vatType')}</label>
                <select
                  value={vatType}
                  onChange={(e) => setVatType(e.target.value as typeof vatType)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="none">{t('editor.vatNone')}</option>
                  <option value="standard">{t('editor.vatStandard')}</option>
                  <option value="reverse_charge">{t('editor.vatReverseCharge')}</option>
                  <option value="exempt">{t('editor.vatExempt')}</option>
                </select>
              </div>

              {vatType === 'standard' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-500 mb-1">{t('editor.yourVatNumber')}</label>
                    <input
                      type="text"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      placeholder="e.g. DE123456789"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-500 mb-1">{t('editor.buyerVatNumber')}</label>
                    <input
                      type="text"
                      value={buyerVatNumber}
                      onChange={(e) => setBuyerVatNumber(e.target.value)}
                      placeholder="e.g. FR987654321"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </>
              )}

              {vatType === 'reverse_charge' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">{t('editor.reverseChargeInfo')}</p>
                      <p className="text-xs">
                        {t('editor.reverseChargeDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs text-blue-700 mb-1">{t('editor.buyerVatNumber')}</label>
                    <input
                      type="text"
                      value={buyerVatNumber}
                      onChange={(e) => setBuyerVatNumber(e.target.value)}
                      placeholder="e.g. FR987654321"
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}

              {vatType === 'exempt' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                  <p>{t('editor.vatExemptInfo')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold mb-4">{t('editor.currency')}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-500 mb-1">{t('editor.invoiceCurrency')}</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">{t('editor.localCurrency')}</label>
                <select
                  value={localCurrency}
                  onChange={(e) => setLocalCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="">{t('editor.none')}</option>
                  {CURRENCIES.filter(c => c.code !== currency).map((c) => (
                    <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              {localCurrency && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      setLoadingRate(true)
                      const rate = await getExchangeRate(currency, localCurrency)
                      setExchangeRate(rate)
                      setLoadingRate(false)
                    }}
                    disabled={loadingRate}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={loadingRate ? 'animate-spin' : ''} />
                    {loadingRate ? t('editor.fetching') : t('editor.getRate')}
                  </button>
                  {exchangeRate && (
                    <span className="text-sm text-slate-600">
                      1 {currency} = {exchangeRate.toFixed(4)} {localCurrency}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {localCurrency && exchangeRate && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h3 className="font-semibold text-blue-900 mb-2">{t('editor.taxReportAmount')}</h3>
              <p className="text-2xl font-bold text-blue-700">
                {(total * exchangeRate).toFixed(2)} {localCurrency}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                1 {currency} = {exchangeRate.toFixed(4)} {localCurrency}
              </p>
            </div>
          )}

          {localCurrency && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-semibold mb-4">{t('editor.paymentTracking')}</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-500 mb-1">{t('editor.paymentDate')}</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                {paymentDate && (
                  <div>
                    <label className="block text-sm text-slate-500 mb-1">{t('editor.paymentRate')}</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          setLoadingRate(true)
                          const rate = await getExchangeRate(currency, localCurrency)
                          setPaymentRate(rate)
                          setLoadingRate(false)
                        }}
                        disabled={loadingRate}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={loadingRate ? 'animate-spin' : ''} />
                        {loadingRate ? t('editor.fetching') : t('editor.getRate')}
                      </button>
                      {paymentRate && (
                        <span className="text-sm text-slate-600">
                          1 {currency} = {paymentRate.toFixed(4)} {localCurrency}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {paymentDate && paymentRate && exchangeRate && (
                  <div className="p-3 bg-slate-50 rounded-lg text-sm">
                    <p className="text-slate-600">
                      <strong>{t('editor.fxImpact')}</strong>{' '}
                      {(() => {
                        const result = calculateFXGainLoss(total, currency, localCurrency, exchangeRate, paymentRate)
                        if (result) {
                          return (
                            <span className={result.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {result.gainLoss >= 0 ? '+' : ''}{result.gainLoss.toFixed(2)} {localCurrency} ({result.gainLoss >= 0 ? '+' : ''}{result.percentage.toFixed(2)}%)
                            </span>
                          )
                        }
                        return null
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
