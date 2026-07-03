'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Upload, CheckCircle, Database } from 'lucide-react'

interface LogEntry {
  message: string
  type: 'info' | 'success' | 'error'
}

interface OldInvoice {
  invoiceNumber: string
  clientId: number
  issueDate: Date
  dueDate: Date
  status: string
  currency: string
  localCurrency?: string
  exchangeRate?: number
  paymentDate?: Date
  paymentRate?: number
  vatType: string
  vatNumber?: string
  buyerVatNumber?: string
  template: string
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes?: string
  items: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>
  ocrProcessed?: boolean
  ocrConfidence?: number
  createdAt: Date
  updatedAt: Date
}

interface OldClient {
  name: string
  email: string
  company?: string
  address?: string
  country: string
  vatNumber?: string
  createdAt: Date
}

export function MigrateData() {
  const { user, loading } = useAuthStore()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [migrating, setMigrating] = useState(false)
  const [done, setDone] = useState(false)

  function log(message: string, type: LogEntry['type'] = 'info') {
    setLogs(prev => [...prev, { message, type }])
  }

  async function startMigration() {
    if (loading) {
      log('正在加载认证信息，请稍候...', 'info')
      return
    }

    let currentUser = user
    if (!currentUser) {
      const { data: { session } } = await supabase.auth.getSession()
      currentUser = session?.user || null
    }

    if (!currentUser) {
      log('请先登录', 'error')
      return
    }

    setMigrating(true)
    log(`开始迁移，用户: ${currentUser.email}`)

    // Open IndexedDB
    const dbRequest = indexedDB.open('TaxFlowHelper')

    dbRequest.onerror = () => {
      log('无法打开 IndexedDB', 'error')
      setMigrating(false)
    }

    dbRequest.onsuccess = async (e) => {
      const db = (e.target as IDBOpenDBRequest).result

      // Migrate clients
      try {
        const clientStore = db.transaction('clients', 'readonly').objectStore('clients')
        const clients: OldClient[] = await new Promise((resolve, reject) => {
          const req = clientStore.getAll()
          req.onsuccess = () => resolve(req.result as OldClient[])
          req.onerror = () => reject(req.error)
        })

        log(`找到 ${clients.length} 个客户`)

        for (const client of clients) {
          const { error } = await supabase.from('sf_clients').insert({
            user_id: currentUser.id,
            name: client.name,
            email: client.email || '',
            company: client.company || null,
            address: client.address || null,
            country: client.country || '',
            vat_number: client.vatNumber || null,
          })
          if (error) log(`客户 "${client.name}" 失败: ${error.message}`, 'error')
          else log(`客户 "${client.name}" ✓`, 'success')
        }
      } catch (err) {
        log(`客户迁移出错: ${(err as Error).message}`, 'error')
      }

      // Migrate invoices
      try {
        const invoiceStore = db.transaction('invoices', 'readonly').objectStore('invoices')
        const invoices: OldInvoice[] = await new Promise((resolve, reject) => {
          const req = invoiceStore.getAll()
          req.onsuccess = () => resolve(req.result as OldInvoice[])
          req.onerror = () => reject(req.error)
        })

        log(`找到 ${invoices.length} 张发票`)

        for (const inv of invoices) {
          const { error } = await supabase.from('sf_invoices').insert({
            user_id: currentUser.id,
            invoice_number: inv.invoiceNumber,
            issue_date: inv.issueDate instanceof Date ? inv.issueDate.toISOString().split('T')[0] : String(inv.issueDate),
            due_date: inv.dueDate instanceof Date ? inv.dueDate.toISOString().split('T')[0] : String(inv.dueDate),
            status: inv.status || 'draft',
            currency: inv.currency || 'USD',
            local_currency: inv.localCurrency || null,
            exchange_rate: inv.exchangeRate || null,
            payment_date: inv.paymentDate instanceof Date ? inv.paymentDate.toISOString().split('T')[0] : (inv.paymentDate ? String(inv.paymentDate) : null),
            payment_rate: inv.paymentRate || null,
            vat_type: inv.vatType || 'none',
            vat_number: inv.vatNumber || null,
            buyer_vat_number: inv.buyerVatNumber || null,
            template: inv.template || 'us',
            subtotal: inv.subtotal || 0,
            tax_rate: inv.taxRate || 0,
            tax_amount: inv.taxAmount || 0,
            total: inv.total || 0,
            notes: inv.notes || null,
            items: inv.items || [],
            ocr_processed: inv.ocrProcessed || false,
            ocr_confidence: inv.ocrConfidence || null,
          })
          if (error) log(`发票 "${inv.invoiceNumber}" 失败: ${error.message}`, 'error')
          else log(`发票 "${inv.invoiceNumber}" ✓`, 'success')
        }
      } catch (err) {
        log(`发票迁移出错: ${(err as Error).message}`, 'error')
      }

      log('迁移完成！刷新页面查看数据。', 'success')
      setMigrating(false)
      setDone(true)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database size={24} className="text-blue-600" />
        <h1 className="text-2xl font-bold">数据迁移工具</h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-800">
          此工具将浏览器本地数据（IndexedDB）上传到云端（Supabase），实现跨设备同步。
        </p>
        <p className="text-sm text-amber-700 mt-2">
          <strong>注意：</strong>迁移前请确保已登录账号。迁移后本地数据不会被删除。
        </p>
      </div>

      <button
        onClick={startMigration}
        disabled={migrating || done || loading}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            加载中...
          </>
        ) : migrating ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            迁移中...
          </>
        ) : done ? (
          <>
            <CheckCircle size={20} />
            迁移完成
          </>
        ) : (
          <>
            <Upload size={20} />
            开始迁移
          </>
        )}
      </button>

      {logs.length > 0 && (
        <div className="mt-6 bg-slate-50 rounded-xl p-4 max-h-96 overflow-y-auto">
          {logs.map((entry, i) => (
            <div key={i} className={`text-sm py-0.5 ${
              entry.type === 'success' ? 'text-green-600' :
              entry.type === 'error' ? 'text-red-600' :
              'text-slate-600'
            }`}>
              {entry.type === 'success' ? '✓ ' : entry.type === 'error' ? '✗ ' : '• '}{entry.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
