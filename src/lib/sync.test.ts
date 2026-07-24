import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mocks before importing the module
const createMockChain = (finalResult: any = { data: null, error: null }) => {
  const chain: any = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockResolvedValue(finalResult)
  chain.single = vi.fn().mockResolvedValue(finalResult)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.upsert = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  return chain
}

let mockChain = createMockChain()

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => mockChain),
  },
}))

// Import after mocks are set up
import {
  getClients,
  upsertClient,
  deleteClient,
  getInvoices,
  getInvoice,
  upsertInvoice,
  deleteInvoice,
  getSettings,
  upsertSettings,
} from './sync'

const mockClient = {
  id: '1',
  user_id: 'user1',
  name: 'Test Client',
  email: 'test@example.com',
  company: 'Test Co',
  address: null,
  country: 'US',
  vat_number: null,
  created_at: '2024-01-01',
}

const mockInvoice = {
  id: '1',
  user_id: 'user1',
  invoice_number: 'INV-001',
  client_id: null,
  issue_date: '2024-01-15',
  due_date: '2024-02-15',
  status: 'draft',
  currency: 'USD',
  local_currency: null,
  exchange_rate: null,
  payment_date: null,
  payment_rate: null,
  vat_type: 'none',
  vat_number: null,
  buyer_vat_number: null,
  template: 'us',
  subtotal: 100,
  tax_rate: 0,
  tax_amount: 0,
  total: 100,
  notes: null,
  items: [],
  ocr_processed: false,
  ocr_confidence: null,
  created_at: '2024-01-15',
  updated_at: '2024-01-15',
}

const mockSettings = {
  id: '1',
  user_id: 'user1',
  business_name: 'My Business',
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
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

describe('getClients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain = createMockChain({ data: [mockClient], error: null })
  })

  it('returns clients for user', async () => {
    const result = await getClients('user1')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Test Client')
  })
})

describe('upsertClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates new client when no id', async () => {
    mockChain = createMockChain({ data: mockClient, error: null })

    const result = await upsertClient('user1', { name: 'New Client' })
    expect(result.name).toBe('Test Client')
  })

  it('updates existing client when id provided', async () => {
    mockChain = createMockChain({ data: { ...mockClient, name: 'Updated' }, error: null })

    const result = await upsertClient('user1', { id: '1', name: 'Updated' })
    expect(result.name).toBe('Updated')
  })
})

describe('deleteClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain = createMockChain({ data: null, error: null })
  })

  it('deletes client', async () => {
    await expect(deleteClient('user1', 'client1')).resolves.not.toThrow()
  })
})

describe('getInvoices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns invoices for user', async () => {
    mockChain = createMockChain({ data: [mockInvoice], error: null })

    const result = await getInvoices('user1')
    expect(result).toHaveLength(1)
    expect(result[0].invoiceNumber).toBe('INV-001')
  })
})

describe('getInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns single invoice', async () => {
    mockChain = createMockChain({ data: mockInvoice, error: null })

    const result = await getInvoice('user1', '1')
    expect(result).not.toBeNull()
    expect(result!.invoiceNumber).toBe('INV-001')
  })

  it('returns null when not found', async () => {
    mockChain = createMockChain({ data: null, error: { message: 'Not found' } })

    const result = await getInvoice('user1', '999')
    expect(result).toBeNull()
  })
})

describe('upsertInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates new invoice when no id', async () => {
    mockChain = createMockChain({ data: mockInvoice, error: null })

    const result = await upsertInvoice('user1', { invoiceNumber: 'INV-001', issueDate: '2024-01-15', dueDate: '2024-02-15' })
    expect(result.invoiceNumber).toBe('INV-001')
  })

  it('updates existing invoice when id provided', async () => {
    mockChain = createMockChain({ data: { ...mockInvoice, invoice_number: 'INV-001-UPDATED' }, error: null })

    const result = await upsertInvoice('user1', { id: '1', invoiceNumber: 'INV-001-UPDATED', issueDate: '2024-01-15', dueDate: '2024-02-15' })
    expect(result.invoiceNumber).toBe('INV-001-UPDATED')
  })

  it('uses default values when optional fields missing', async () => {
    mockChain = createMockChain({ data: mockInvoice, error: null })

    const result = await upsertInvoice('user1', { invoiceNumber: 'INV-001', issueDate: '2024-01-15', dueDate: '2024-02-15' })
    expect(result).toBeDefined()
  })

  it('throws error when create fails', async () => {
    mockChain = createMockChain({ data: null, error: { message: 'Create failed' } })

    await expect(upsertInvoice('user1', { invoiceNumber: 'INV-001', issueDate: '2024-01-15', dueDate: '2024-02-15' })).rejects.toThrow()
  })

  it('throws error when update fails', async () => {
    mockChain = createMockChain({ data: null, error: { message: 'Update failed' } })

    await expect(upsertInvoice('user1', { id: '1', invoiceNumber: 'INV-001', issueDate: '2024-01-15', dueDate: '2024-02-15' })).rejects.toThrow()
  })

  it('creates invoice with all optional fields', async () => {
    mockChain = createMockChain({ data: mockInvoice, error: null })

    const result = await upsertInvoice('user1', {
      invoiceNumber: 'INV-001',
      issueDate: '2024-01-15',
      dueDate: '2024-02-15',
      status: 'sent',
      currency: 'EUR',
      localCurrency: 'USD',
      exchangeRate: 1.1,
      paymentDate: '2024-02-01',
      paymentRate: 1.12,
      vatType: 'standard',
      vatNumber: '123456',
      buyerVatNumber: '789012',
      template: 'eu',
      subtotal: 100,
      taxRate: 20,
      taxAmount: 20,
      total: 120,
      notes: 'Test invoice',
      items: [{ description: 'Item 1', quantity: 1, unitPrice: 100, amount: 100 }],
      ocrProcessed: true,
      ocrConfidence: 0.95,
    })
    expect(result).toBeDefined()
  })
})

describe('deleteInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain = createMockChain({ data: null, error: null })
  })

  it('deletes invoice', async () => {
    await expect(deleteInvoice('user1', 'invoice1')).resolves.not.toThrow()
  })

  it('throws error when delete fails', async () => {
    // Set up chain to return error on the last eq() call
    mockChain = createMockChain({ data: null, error: null })
    mockChain.eq = vi.fn().mockImplementation(function() {
      // First eq() returns chain, second eq() returns result with error
      if (mockChain.eq.mock.calls.length === 1) {
        return mockChain
      }
      return Promise.resolve({ data: null, error: { message: 'Delete failed' } })
    })

    await expect(deleteInvoice('user1', 'invoice1')).rejects.toThrow()
  })
})

describe('getSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns existing settings', async () => {
    mockChain = createMockChain({ data: mockSettings, error: null })

    const result = await getSettings('user1')
    expect(result.businessName).toBe('My Business')
  })

  it('creates default settings when none exist', async () => {
    // First call returns error (no settings found)
    // Second call returns created settings
    let callCount = 0
    mockChain = createMockChain({ data: null, error: { message: 'Not found' } })
    mockChain.single = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({ data: null, error: { message: 'Not found' } })
      }
      return Promise.resolve({ data: mockSettings, error: null })
    })

    const result = await getSettings('user1')
    expect(result.defaultCurrency).toBe('USD')
  })

  it('maps settings with default values', async () => {
    const settingsWithNulls = {
      ...mockSettings,
      business_name: null,
      business_address: null,
      business_email: null,
      business_country: null,
      default_currency: null,
      default_vat_type: null,
      default_vat_number: null,
      default_template: null,
      tax_rate: null,
      invoice_prefix: null,
      next_invoice_number: null,
    }
    mockChain = createMockChain({ data: settingsWithNulls, error: null })

    const result = await getSettings('user1')
    expect(result.businessName).toBe('')
    expect(result.defaultCurrency).toBe('USD')
    expect(result.defaultVatType).toBe('none')
    expect(result.defaultTemplate).toBe('us')
    expect(result.taxRate).toBe(0)
    expect(result.invoicePrefix).toBe('INV')
    expect(result.nextInvoiceNumber).toBe(1)
  })
})

describe('upsertSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('upserts settings with all fields', async () => {
    mockChain = createMockChain({ data: mockSettings, error: null })

    const result = await upsertSettings('user1', {
      businessName: 'Updated Business',
      businessAddress: '123 Main St',
      businessEmail: 'test@example.com',
      businessCountry: 'US',
      defaultCurrency: 'EUR',
      defaultVatType: 'standard',
      defaultVatNumber: '123456',
      defaultTemplate: 'eu',
      taxRate: 20,
      invoicePrefix: 'INV',
      nextInvoiceNumber: 100,
    })
    expect(result.businessName).toBe('My Business')
  })

  it('handles partial settings update', async () => {
    mockChain = createMockChain({ data: mockSettings, error: null })

    const result = await upsertSettings('user1', { businessName: 'Only Name' })
    expect(result).toBeDefined()
  })

  it('handles empty settings update', async () => {
    mockChain = createMockChain({ data: mockSettings, error: null })

    const result = await upsertSettings('user1', {})
    expect(result).toBeDefined()
  })

  it('throws error when upsert fails', async () => {
    mockChain = createMockChain({ data: null, error: { message: 'Upsert failed' } })

    await expect(upsertSettings('user1', { businessName: 'Test' })).rejects.toThrow()
  })
})
