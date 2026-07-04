'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Upload, CheckCircle, Database, AlertTriangle } from 'lucide-react'

interface LogEntry {
  message: string
  type: 'info' | 'success' | 'error' | 'warn'
}

export function MigrateData() {
  const { user, loading } = useAuthStore()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [migrating, setMigrating] = useState(false)
  const [done, setDone] = useState(false)
  const [stats, setStats] = useState({ clients: 0, invoices: 0, settings: 0 })

  function log(message: string, type: LogEntry['type'] = 'info') {
    setLogs(prev => [...prev, { message, type }])
  }

  async function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('TaxFlowHelper')
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(new Error('无法打开 IndexedDB'))
    })
  }

  function getAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result as T[])
      req.onerror = () => reject(req.error)
    })
  }

  async function migrateClients(db: IDBDatabase, userId: string): Promise<Map<number, string>> {
    const oldClients = await getAllFromStore<any>(db, 'clients')
    log(`找到 ${oldClients.length} 个客户`)

    const idMap = new Map<number, string>()

    for (const client of oldClients) {
      // Check if client already exists by name
      const { data: existing } = await supabase
        .from('sf_clients')
        .select('id')
        .eq('user_id', userId)
        .eq('name', client.name)
        .maybeSingle()

      if (existing) {
        idMap.set(client.id, existing.id)
        log(`客户 "${client.name}" 已存在，跳过`, 'warn')
        continue
      }

      const { data, error } = await supabase
        .from('sf_clients')
        .insert({
          user_id: userId,
          name: client.name,
          email: client.email || '',
          company: client.company || null,
          address: client.address || null,
          country: client.country || '',
          vat_number: client.vatNumber || null,
        })
        .select('id')
        .single()

      if (error) {
        log(`客户 "${client.name}" 失败: ${error.message}`, 'error')
      } else {
        idMap.set(client.id, data.id)
        log(`客户 "${client.name}" ✓`, 'success')
      }
    }

    setStats(prev => ({ ...prev, clients: idMap.size }))
    return idMap
  }

  async function migrateInvoices(db: IDBDatabase, userId: string, clientIdMap: Map<number, string>) {
    const oldInvoices = await getAllFromStore<any>(db, 'invoices')
    log(`找到 ${oldInvoices.length} 张发票`)

    let count = 0

    for (const inv of oldInvoices) {
      // Check if invoice already exists by invoice_number
      const { data: existing } = await supabase
        .from('sf_invoices')
        .select('id')
        .eq('user_id', userId)
        .eq('invoice_number', inv.invoiceNumber)
        .maybeSingle()

      if (existing) {
        log(`发票 "${inv.invoiceNumber}" 已存在，跳过`, 'warn')
        count++
        continue
      }

      // Map old numeric clientId to new UUID
      const newClientId = inv.clientId ? (clientIdMap.get(inv.clientId) || null) : null

      const { error } = await supabase.from('sf_invoices').insert({
        user_id: userId,
        client_id: newClientId,
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
      else { log(`发票 "${inv.invoiceNumber}" ✓`, 'success'); count++ }
    }

    setStats(prev => ({ ...prev, invoices: count }))
  }

  async function migrateSettings(db: IDBDatabase, userId: string) {
    const oldSettings = await getAllFromStore<any>(db, 'settings')
    if (oldSettings.length === 0) {
      log('无设置数据', 'info')
      return
    }

    const settings = oldSettings[0]
    log('开始迁移设置...')

    // Check existing settings
    const { data: existing } = await supabase
      .from('sf_settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    const payload = {
      user_id: userId,
      business_name: settings.businessName || '',
      business_address: settings.businessAddress || '',
      business_email: settings.businessEmail || '',
      business_country: settings.businessCountry || '',
      default_currency: settings.defaultCurrency || 'USD',
      default_vat_type: settings.defaultVatType || 'none',
      default_vat_number: settings.defaultVatNumber || '',
      default_template: settings.defaultTemplate || 'us',
      tax_rate: settings.taxRate || 0,
      invoice_prefix: settings.invoicePrefix || 'INV',
      next_invoice_number: settings.nextInvoiceNumber || 1,
    }

    if (existing) {
      const { error } = await supabase
        .from('sf_settings')
        .update(payload)
        .eq('id', existing.id)
      if (error) log(`设置更新失败: ${error.message}`, 'error')
      else { log('设置已更新 ✓', 'success'); setStats(prev => ({ ...prev, settings: 1 })) }
    } else {
      const { error } = await supabase.from('sf_settings').insert(payload)
      if (error) log(`设置迁移失败: ${error.message}`, 'error')
      else { log('设置迁移成功 ✓', 'success'); setStats(prev => ({ ...prev, settings: 1 })) }
    }
  }

  async function startMigration() {
    if (loading) {
      log('正在加载认证信息，请稍候...', 'info')
      return
    }

    if (!user) {
      log('请先登录', 'error')
      return
    }

    setMigrating(true)
    setLogs([])
    setStats({ clients: 0, invoices: 0, settings: 0 })
    log(`开始迁移，用户: ${user.email}`)

    try {
      const db = await openDB()
      log('IndexedDB 已打开')

      // 1. Migrate clients first (build ID map)
      const clientIdMap = await migrateClients(db, user.id)

      // 2. Migrate invoices with correct client ID mapping
      await migrateInvoices(db, user.id, clientIdMap)

      // 3. Migrate settings
      await migrateSettings(db, user.id)

      log(`迁移完成！客户 ${stats.clients} 个，发票 ${stats.invoices} 张，设置 ${stats.settings} 项`, 'success')
      log('刷新页面查看云端数据。', 'info')
      setDone(true)
    } catch (err) {
      log(`迁移出错: ${(err as Error).message}`, 'error')
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database size={24} className="text-blue-600" />
        <h1 className="text-2xl font-bold">数据迁移工具</h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-2">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-amber-800">
              此工具将浏览器本地数据（IndexedDB）上传到云端（Supabase），实现跨设备同步。
            </p>
            <p className="text-sm text-amber-700 mt-2">
              <strong>注意：</strong>迁移前请确保已登录账号。已存在的数据会自动跳过，不会重复。迁移后本地数据不会被删除。
            </p>
          </div>
        </div>
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

      {done && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2 text-green-800 font-medium mb-1">
            <CheckCircle size={16} />
            迁移结果
          </div>
          <div className="text-sm text-green-700 space-y-0.5">
            <p>客户: {stats.clients} 个</p>
            <p>发票: {stats.invoices} 张</p>
            <p>设置: {stats.settings} 项</p>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-6 bg-slate-50 rounded-xl p-4 max-h-96 overflow-y-auto">
          {logs.map((entry, i) => (
            <div key={i} className={`text-sm py-0.5 ${
              entry.type === 'success' ? 'text-green-600' :
              entry.type === 'error' ? 'text-red-600' :
              entry.type === 'warn' ? 'text-amber-600' :
              'text-slate-600'
            }`}>
              {entry.type === 'success' ? '✓ ' : entry.type === 'error' ? '✗ ' : entry.type === 'warn' ? '⚠ ' : '• '}{entry.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
