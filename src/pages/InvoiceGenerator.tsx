import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, Printer, FileText } from 'lucide-react'

type LineItem = { id: number; desc: string; qty: number; price: number }

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'SGD', 'INR', 'CHF', 'SEK', 'NZD']

function fmtMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount || 0)
  } catch {
    return currency + ' ' + (amount || 0).toFixed(2)
  }
}

const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-400 focus:outline-none'

export function InvoiceGenerator() {
  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [fromAddress, setFromAddress] = useState('')
  const [toName, setToName] = useState('')
  const [toEmail, setToEmail] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('INV-001')
  const [issueDate, setIssueDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [taxRate, setTaxRate] = useState(0)
  const [note, setNote] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ id: 1, desc: 'Consulting services', qty: 1, price: 500 }])

  useEffect(() => {
    document.title = 'Free Invoice Generator — Create & Download Invoices (PDF) | TaxFlow'
    const meta = document.querySelector('meta[name="description"]')
    if (meta)
      meta.setAttribute(
        'content',
        'Free invoice generator for freelancers. Create professional, multi-currency invoices in seconds, add tax, and download or print as PDF. No signup required.'
      )
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canon) {
      canon = document.createElement('link')
      canon.setAttribute('rel', 'canonical')
      document.head.appendChild(canon)
    }
    canon.setAttribute('href', 'https://tax.flowingpulse.com/tools/invoice-generator')
  }, [])

  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0)
  const taxAmt = subtotal * (Number(taxRate) || 0) / 100
  const total = subtotal + taxAmt

  function addItem() {
    setItems([...items, { id: Date.now(), desc: '', qty: 1, price: 0 }])
  }
  function removeItem(id: number) {
    if (items.length > 1) setItems(items.filter((i) => i.id !== id))
  }
  function updateItem(id: number, field: keyof LineItem, value: string | number) {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  return (
    <div className="min-h-screen bg-[#0a0e27] text-slate-200">
      <style>{`@media print { body * { visibility: hidden; } #invoice-print, #invoice-print * { visibility: visible; } #invoice-print { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } }`}</style>
      <header className="no-print border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <span className="font-bold text-xl text-white">TaxFlow</span>
          </a>
          <a href="/tools" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft size={14} /> Free Tools
          </a>
        </div>
      </header>

      <main className="no-print max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 mb-4">
            <FileText size={13} /> Free Tool
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Free Invoice Generator</h1>
          <p className="text-slate-400 max-w-2xl leading-relaxed">
            Create a clean, professional invoice in seconds — multi-currency, tax-ready, and ready to download as PDF. No account, no watermarks, no fees.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* FORM */}
          <div className="space-y-6">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-white">From</h2>
              <input className={inputCls} placeholder="Your name or company" value={fromName} onChange={(e) => setFromName(e.target.value)} />
              <input className={inputCls} placeholder="Email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
              <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Address" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} />
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-white">Bill to</h2>
              <input className={inputCls} placeholder="Client name or company" value={toName} onChange={(e) => setToName(e.target.value)} />
              <input className={inputCls} placeholder="Email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} />
              <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Address" value={toAddress} onChange={(e) => setToAddress(e.target.value)} />
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Invoice number</label>
                  <input className={inputCls} value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Currency</label>
                  <select className={inputCls} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c} className="bg-slate-900">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Issue date</label>
                  <input type="date" className={inputCls} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Due date</label>
                  <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tax rate (%)</label>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-3">
              <h2 className="font-semibold text-white">Line items</h2>
              {items.map((it) => (
                <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className={inputCls + ' col-span-5'}
                    placeholder="Description"
                    value={it.desc}
                    onChange={(e) => updateItem(it.id, 'desc', e.target.value)}
                  />
                  <input
                    type="number"
                    min={0}
                    className={inputCls + ' col-span-2'}
                    placeholder="Qty"
                    value={it.qty}
                    onChange={(e) => updateItem(it.id, 'qty', Number(e.target.value) || 0)}
                  />
                  <input
                    type="number"
                    min={0}
                    className={inputCls + ' col-span-3'}
                    placeholder="Price"
                    value={it.price}
                    onChange={(e) => updateItem(it.id, 'price', Number(e.target.value) || 0)}
                  />
                  <button
                    onClick={() => removeItem(it.id)}
                    className="col-span-2 h-10 rounded-xl bg-white/5 text-slate-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center justify-center"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button
                onClick={addItem}
                className="w-full py-2.5 rounded-xl bg-cyan-500/10 text-cyan-300 text-sm font-medium hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-1"
              >
                <Plus size={15} /> Add line item
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Note</label>
              <textarea
                className={inputCls + ' resize-none'}
                rows={2}
                placeholder="Thank you for your business"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-cyan-400 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Printer size={16} /> Download / Print PDF
            </button>
          </div>

          {/* PREVIEW */}
          <div>
            <div id="invoice-print" className="bg-white text-slate-900 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight">INVOICE</div>
                  <div className="text-sm text-slate-700 mt-1 font-medium">{fromName || 'Your Company'}</div>
                  {fromEmail && <div className="text-xs text-slate-500">{fromEmail}</div>}
                  {fromAddress && <div className="text-xs text-slate-500 whitespace-pre-line mt-1">{fromAddress}</div>}
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold text-slate-700">{invoiceNo}</div>
                  <div className="text-slate-500 mt-1">Issued: {issueDate || '—'}</div>
                  <div className="text-slate-500">Due: {dueDate || '—'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">From</div>
                  <div className="text-sm text-slate-700">{fromName || 'Your Company'}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bill to</div>
                  <div className="text-sm text-slate-700">{toName || 'Client Name'}</div>
                  {toEmail && <div className="text-xs text-slate-500">{toEmail}</div>}
                  {toAddress && <div className="text-xs text-slate-500 whitespace-pre-line">{toAddress}</div>}
                </div>
              </div>

              <table className="w-full text-sm mb-6">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-400 text-xs uppercase">
                    <th className="text-left py-2 font-semibold">Description</th>
                    <th className="text-right py-2 font-semibold">Qty</th>
                    <th className="text-right py-2 font-semibold">Price</th>
                    <th className="text-right py-2 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-b border-slate-100">
                      <td className="py-2 text-slate-700">{it.desc || '—'}</td>
                      <td className="py-2 text-right text-slate-600">{it.qty}</td>
                      <td className="py-2 text-right text-slate-600">{fmtMoney(Number(it.price) || 0, currency)}</td>
                      <td className="py-2 text-right text-slate-800 font-medium">
                        {fmtMoney((Number(it.qty) || 0) * (Number(it.price) || 0), currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-56 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-800">{fmtMoney(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax ({taxRate}%)</span>
                    <span className="text-slate-800">{fmtMoney(taxAmt, currency)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                    <span className="text-slate-900">Total</span>
                    <span className="text-cyan-600">{fmtMoney(total, currency)}</span>
                  </div>
                </div>
              </div>

              {note && <div className="mt-8 text-xs text-slate-500 border-t border-slate-100 pt-4">{note}</div>}
            </div>
          </div>
        </div>

        <div className="no-print mt-12 bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border border-cyan-500/30 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Want invoices that file themselves?</h2>
          <p className="text-slate-400 text-sm mb-5 max-w-lg mx-auto">
            TaxFlow scans your invoices, tracks every W-8BEN, and manages multi-currency taxes in one place — so you spend less time on paperwork.
          </p>
          <a
            href="/#pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
          >
            Start free with TaxFlow
          </a>
        </div>
      </main>
    </div>
  )
}

export default InvoiceGenerator
