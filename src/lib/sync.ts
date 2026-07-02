import { supabase } from './supabase'

// ==========================================
// Types
// ==========================================

export interface SyncClient {
  id: string
  userId: string
  name: string
  email: string
  company: string | null
  address: string | null
  country: string
  vatNumber: string | null
  createdAt: string
}

export interface SyncInvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface SyncInvoice {
  id: string
  userId: string
  invoiceNumber: string
  clientId: string | null
  issueDate: string
  dueDate: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  currency: string
  localCurrency: string | null
  exchangeRate: number | null
  paymentDate: string | null
  paymentRate: number | null
  vatType: 'none' | 'standard' | 'reverse_charge' | 'exempt'
  vatNumber: string | null
  buyerVatNumber: string | null
  template: 'us' | 'eu' | 'uk'
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes: string | null
  items: SyncInvoiceItem[]
  ocrProcessed: boolean
  ocrConfidence: number | null
  createdAt: string
  updatedAt: string
}

export interface SyncSettings {
  id: string
  userId: string
  businessName: string
  businessAddress: string
  businessEmail: string
  businessCountry: string
  defaultCurrency: string
  defaultVatType: string
  defaultVatNumber: string
  defaultTemplate: string
  taxRate: number
  invoicePrefix: string
  nextInvoiceNumber: number
  createdAt: string
  updatedAt: string
}

// ==========================================
// Clients
// ==========================================

export async function getClients(userId: string): Promise<SyncClient[]> {
  console.log('[Sync] getClients called for user:', userId)
  const { data, error } = await supabase
    .from('sf_clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Sync] getClients error:', error)
    throw error
  }
  console.log('[Sync] getClients result:', data?.length, 'rows')
  return (data || []).map(mapClient)
}

export async function upsertClient(userId: string, client: Partial<SyncClient> & { name: string }): Promise<SyncClient> {
  const payload = {
    user_id: userId,
    name: client.name,
    email: client.email || '',
    company: client.company || null,
    address: client.address || null,
    country: client.country || '',
    vat_number: client.vatNumber || null,
  }

  if (client.id) {
    const { data, error } = await supabase
      .from('sf_clients')
      .update(payload)
      .eq('id', client.id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return mapClient(data)
  } else {
    const { data, error } = await supabase
      .from('sf_clients')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return mapClient(data)
  }
}

export async function deleteClient(userId: string, clientId: string): Promise<void> {
  const { error } = await supabase
    .from('sf_clients')
    .delete()
    .eq('id', clientId)
    .eq('user_id', userId)
  if (error) throw error
}

function mapClient(row: Record<string, unknown>): SyncClient {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    email: (row.email as string) || '',
    company: row.company as string | null,
    address: row.address as string | null,
    country: (row.country as string) || '',
    vatNumber: row.vat_number as string | null,
    createdAt: row.created_at as string,
  }
}

// ==========================================
// Invoices
// ==========================================

export async function getInvoices(userId: string): Promise<SyncInvoice[]> {
  console.log('[Sync] getInvoices called for user:', userId)
  const { data, error } = await supabase
    .from('sf_invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Sync] getInvoices error:', error)
    throw error
  }
  console.log('[Sync] getInvoices result:', data?.length, 'rows')
  return (data || []).map(mapInvoice)
}

export async function getInvoice(userId: string, invoiceId: string): Promise<SyncInvoice | null> {
  const { data, error } = await supabase
    .from('sf_invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('user_id', userId)
    .single()

  if (error) return null
  return mapInvoice(data)
}

export async function upsertInvoice(userId: string, invoice: Partial<SyncInvoice> & { invoiceNumber: string }): Promise<SyncInvoice> {
  const payload = {
    user_id: userId,
    invoice_number: invoice.invoiceNumber,
    client_id: invoice.clientId || null,
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate,
    status: invoice.status || 'draft',
    currency: invoice.currency || 'USD',
    local_currency: invoice.localCurrency || null,
    exchange_rate: invoice.exchangeRate || null,
    payment_date: invoice.paymentDate || null,
    payment_rate: invoice.paymentRate || null,
    vat_type: invoice.vatType || 'none',
    vat_number: invoice.vatNumber || null,
    buyer_vat_number: invoice.buyerVatNumber || null,
    template: invoice.template || 'us',
    subtotal: invoice.subtotal || 0,
    tax_rate: invoice.taxRate || 0,
    tax_amount: invoice.taxAmount || 0,
    total: invoice.total || 0,
    notes: invoice.notes || null,
    items: invoice.items || [],
    ocr_processed: invoice.ocrProcessed || false,
    ocr_confidence: invoice.ocrConfidence || null,
  }

  if (invoice.id) {
    const { data, error } = await supabase
      .from('sf_invoices')
      .update(payload)
      .eq('id', invoice.id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return mapInvoice(data)
  } else {
    const { data, error } = await supabase
      .from('sf_invoices')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return mapInvoice(data)
  }
}

export async function deleteInvoice(userId: string, invoiceId: string): Promise<void> {
  const { error } = await supabase
    .from('sf_invoices')
    .delete()
    .eq('id', invoiceId)
    .eq('user_id', userId)
  if (error) throw error
}

function mapInvoice(row: Record<string, unknown>): SyncInvoice {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    invoiceNumber: row.invoice_number as string,
    clientId: row.client_id as string | null,
    issueDate: row.issue_date as string,
    dueDate: row.due_date as string,
    status: (row.status as SyncInvoice['status']) || 'draft',
    currency: (row.currency as string) || 'USD',
    localCurrency: row.local_currency as string | null,
    exchangeRate: row.exchange_rate as number | null,
    paymentDate: row.payment_date as string | null,
    paymentRate: row.payment_rate as number | null,
    vatType: (row.vat_type as SyncInvoice['vatType']) || 'none',
    vatNumber: row.vat_number as string | null,
    buyerVatNumber: row.buyer_vat_number as string | null,
    template: (row.template as SyncInvoice['template']) || 'us',
    subtotal: (row.subtotal as number) || 0,
    taxRate: (row.tax_rate as number) || 0,
    taxAmount: (row.tax_amount as number) || 0,
    total: (row.total as number) || 0,
    notes: row.notes as string | null,
    items: (row.items as SyncInvoiceItem[]) || [],
    ocrProcessed: (row.ocr_processed as boolean) || false,
    ocrConfidence: row.ocr_confidence as number | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

// ==========================================
// Settings
// ==========================================

export async function getSettings(userId: string): Promise<SyncSettings> {
  console.log('[Sync] getSettings called for user:', userId)
  const { data, error } = await supabase
    .from('sf_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('[Sync] getSettings query error:', error)
  }

  if (error || !data) {
    // Create default settings
    const defaultSettings = {
      user_id: userId,
      business_name: '',
      business_address: '',
      business_email: '',
      business_country: '',
      default_currency: 'USD',
      default_vat_type: 'none',
      default_vat_number: '',
      default_template: 'us',
      tax_rate: 0,
      invoice_prefix: 'INV',
      next_invoice_number: 1,
    }
    const { data: created, error: createError } = await supabase
      .from('sf_settings')
      .insert(defaultSettings)
      .select()
      .single()
    if (createError) throw createError
    return mapSettings(created)
  }

  return mapSettings(data)
}

export async function upsertSettings(userId: string, settings: Partial<SyncSettings>): Promise<SyncSettings> {
  const payload: Record<string, unknown> = { user_id: userId }
  if (settings.businessName !== undefined) payload.business_name = settings.businessName
  if (settings.businessAddress !== undefined) payload.business_address = settings.businessAddress
  if (settings.businessEmail !== undefined) payload.business_email = settings.businessEmail
  if (settings.businessCountry !== undefined) payload.business_country = settings.businessCountry
  if (settings.defaultCurrency !== undefined) payload.default_currency = settings.defaultCurrency
  if (settings.defaultVatType !== undefined) payload.default_vat_type = settings.defaultVatType
  if (settings.defaultVatNumber !== undefined) payload.default_vat_number = settings.defaultVatNumber
  if (settings.defaultTemplate !== undefined) payload.default_template = settings.defaultTemplate
  if (settings.taxRate !== undefined) payload.tax_rate = settings.taxRate
  if (settings.invoicePrefix !== undefined) payload.invoice_prefix = settings.invoicePrefix
  if (settings.nextInvoiceNumber !== undefined) payload.next_invoice_number = settings.nextInvoiceNumber

  const { data, error } = await supabase
    .from('sf_settings')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) throw error
  return mapSettings(data)
}

function mapSettings(row: Record<string, unknown>): SyncSettings {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    businessName: (row.business_name as string) || '',
    businessAddress: (row.business_address as string) || '',
    businessEmail: (row.business_email as string) || '',
    businessCountry: (row.business_country as string) || '',
    defaultCurrency: (row.default_currency as string) || 'USD',
    defaultVatType: (row.default_vat_type as string) || 'none',
    defaultVatNumber: (row.default_vat_number as string) || '',
    defaultTemplate: (row.default_template as string) || 'us',
    taxRate: (row.tax_rate as number) || 0,
    invoicePrefix: (row.invoice_prefix as string) || 'INV',
    nextInvoiceNumber: (row.next_invoice_number as number) || 1,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

// ==========================================
// Dashboard Stats
// ==========================================

export async function getDashboardStats(userId: string) {
  const invoices = await getInvoices(userId)

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0)

  const totalInvoices = invoices.length
  const paidCount = invoices.filter(inv => inv.status === 'paid').length
  const pendingCount = invoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').length
  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length

  return {
    totalRevenue,
    totalInvoices,
    paidCount,
    pendingCount,
    overdueCount,
    invoices,
  }
}
