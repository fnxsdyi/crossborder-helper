import Dexie, { type EntityTable } from 'dexie'

export interface Client {
  id?: number
  name: string
  email: string
  company?: string
  address?: string
  country: string
  vatNumber?: string
  createdAt: Date
}

export interface Invoice {
  id?: number
  invoiceNumber: string
  clientId: number
  issueDate: Date
  dueDate: Date
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  currency: string
  localCurrency?: string
  exchangeRate?: number
  paymentDate?: Date
  paymentRate?: number
  vatType: 'none' | 'standard' | 'reverse_charge' | 'exempt'
  vatNumber?: string
  buyerVatNumber?: string
  template: 'us' | 'eu' | 'uk'
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes?: string
  items: InvoiceItem[]
  createdAt: Date
  updatedAt: Date
}

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface TaxProfile {
  id?: number
  fullName: string
  country: string
  taxResidenceCountry: string
  permanentAddress: string
  mailingAddress?: string
  dateOfBirth?: string
  nationality?: string
  usTaxpayer?: boolean
  usTin?: string
  foreignTin?: string
  treatyCountry?: string
  treatyArticle?: string
  treatyRate?: number
  signature?: string
  createdAt: Date
  updatedAt: Date
}

export interface Settings {
  id?: number
  businessName: string
  businessAddress: string
  businessEmail: string
  businessCountry: string
  defaultCurrency: string
  defaultVatType: 'none' | 'standard' | 'reverse_charge' | 'exempt'
  defaultVatNumber: string
  defaultTemplate: 'us' | 'eu' | 'uk'
  taxRate: number
  invoicePrefix: string
  nextInvoiceNumber: number
  isPremium: boolean
  licenseKey?: string
}

const db = new Dexie('CrossBorderHelper') as Dexie & {
  clients: EntityTable<Client, 'id'>
  invoices: EntityTable<Invoice, 'id'>
  taxProfiles: EntityTable<TaxProfile, 'id'>
  settings: EntityTable<Settings, 'id'>
}

db.version(1).stores({
  clients: '++id, name, email, country, createdAt',
  invoices: '++id, invoiceNumber, clientId, status, currency, issueDate, createdAt',
  taxProfiles: '++id, country, createdAt',
  settings: '++id',
})

export default db
