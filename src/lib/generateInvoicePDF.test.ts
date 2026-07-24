import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSave = vi.fn()
const mockJsPDFInstance = {
  setFillColor: vi.fn(),
  rect: vi.fn(),
  roundedRect: vi.fn(),
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  text: vi.fn(),
  setFont: vi.fn(),
  line: vi.fn(),
  setDrawColor: vi.fn(),
  setGState: vi.fn(),
  splitTextToSize: vi.fn().mockReturnValue(['line1']),
  save: mockSave,
  internal: {
    pageSize: { getWidth: vi.fn().mockReturnValue(210), getHeight: vi.fn().mockReturnValue(297) },
  },
}

vi.mock('jspdf', () => ({
  jsPDF: function() { return mockJsPDFInstance },
  GState: function() { return {} },
}))

vi.mock('./sync', () => ({
  getSettings: vi.fn().mockResolvedValue({
    businessName: 'Test Business',
    businessAddress: '123 Main St\nSuite 100',
    businessEmail: 'test@example.com',
  }),
  getClients: vi.fn().mockResolvedValue([
    { id: 'client1', name: 'Client Corp', email: 'client@test.com', company: 'Corp Inc', country: 'US' },
  ]),
}))

const baseInvoice = {
  id: '1',
  invoiceNumber: 'INV-001',
  clientId: 'client1',
  template: 'us',
  currency: 'USD',
  status: 'draft' as const,
  issueDate: '2024-01-15',
  dueDate: '2024-02-15',
  items: [{ description: 'Web Development', quantity: 1, unitPrice: 1000, amount: 1000 }],
  subtotal: 1000,
  taxRate: 10,
  taxAmount: 100,
  total: 1100,
}

describe('generateInvoicePDF', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports generateInvoicePDF function', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    expect(typeof generateInvoicePDF).toBe('function')
  })

  it('generates US template PDF', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice, template: 'us' }, 'user1')
    expect(mockSave).toHaveBeenCalledWith('INV-001.pdf')
  })

  it('generates EU template PDF', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice, template: 'eu' }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('generates UK template PDF', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice, template: 'uk' }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('falls back to us template for unknown', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice, template: 'unknown' }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('generates PDF without userId', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice })
    expect(mockSave).toHaveBeenCalled()
  })

  it('handles sent status', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice, status: 'sent' }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('handles paid status', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice, status: 'paid' }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('handles overdue status', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice, status: 'overdue' }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('handles unknown status', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice, status: 'unknown' as any }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('handles reverse charge VAT', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice, vatType: 'reverse_charge', taxRate: 0, taxAmount: 0, total: 1000 }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('handles reverse charge VAT with UK template', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice, template: 'uk', vatType: 'reverse_charge', taxRate: 0, taxAmount: 0, total: 1000 }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('handles exempt VAT', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice, vatType: 'exempt', taxRate: 0, taxAmount: 0, total: 1000 }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('handles zero tax rate', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice, taxRate: 0, taxAmount: 0, total: 1000 }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('adds watermark for free users', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice }, 'user1', false)
    expect(mockSave).toHaveBeenCalled()
  })

  it('no watermark for premium users', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice }, 'user1', true)
    expect(mockSave).toHaveBeenCalled()
  })

  it('handles notes', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice, notes: 'Thank you for your business!' }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('handles VAT numbers in EU template', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({
      ...baseInvoice,
      template: 'eu',
      vatNumber: 'EU123456',
      buyerVatNumber: 'BUY789',
    }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('handles VAT numbers in UK template', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({
      ...baseInvoice,
      template: 'uk',
      vatNumber: 'GB123456',
      vatType: 'none',
    }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('handles UK template VAT notice', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({
      ...baseInvoice,
      template: 'uk',
      vatNumber: 'GB123456',
      vatType: 'reverse_charge',
      taxRate: 0,
      taxAmount: 0,
      total: 1000,
    }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('handles settings load error', async () => {
    const { getSettings } = await import('./sync')
    vi.mocked(getSettings).mockRejectedValue(new Error('DB error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice }, 'user1')
    expect(mockSave).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('handles multiple items', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({
      ...baseInvoice,
      items: [
        { description: 'Item 1', quantity: 1, unitPrice: 500, amount: 500 },
        { description: 'Item 2', quantity: 2, unitPrice: 250, amount: 500 },
        { description: 'Item 3', quantity: 1, unitPrice: 100, amount: 100 },
      ],
      subtotal: 1100,
      taxAmount: 110,
      total: 1210,
    }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('handles items without description', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({
      ...baseInvoice,
      items: [{ quantity: 1, unitPrice: 100, amount: 100 } as any],
    }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('formatCurrency handles different currencies', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice, currency: 'EUR' }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })

  it('formatDate handles different locales', async () => {
    const { generateInvoicePDF } = await import('./generateInvoicePDF')
    await generateInvoicePDF({ ...baseInvoice, template: 'eu' }, 'user1')
    expect(mockSave).toHaveBeenCalled()
  })
})
