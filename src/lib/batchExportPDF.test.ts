import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSaveAs = vi.fn()
vi.mock('file-saver', () => ({ saveAs: (...args: unknown[]) => mockSaveAs(...args) }))

const mockJsPDFInstance = {
  internal: {
    pageSize: {
      getWidth: vi.fn().mockReturnValue(210),
    },
  },
  setFillColor: vi.fn(),
  rect: vi.fn(),
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  text: vi.fn(),
  setFont: vi.fn(),
  line: vi.fn(),
  setDrawColor: vi.fn(),
  output: vi.fn().mockReturnValue(new Blob(['pdf'])),
}

vi.mock('jspdf', () => ({
  jsPDF: function() { return mockJsPDFInstance },
}))

const mockGenerateAsync = vi.fn().mockResolvedValue(new Blob(['zip']))
const mockFolderFile = vi.fn()
const mockFolderInstance = { file: mockFolderFile }

vi.mock('jszip', () => {
  return {
    default: function() {
      return {
        folder: vi.fn().mockReturnValue(mockFolderInstance),
        generateAsync: mockGenerateAsync,
      }
    },
  }
})

vi.mock('./sync', () => ({
  getSettings: vi.fn().mockResolvedValue({
    businessName: 'Test Business',
    businessAddress: '123 Main St',
    businessEmail: 'test@example.com',
  }),
  getClients: vi.fn().mockResolvedValue([
    { id: 'client1', name: 'Test Client', email: 'client@test.com' },
  ]),
}))

describe('batchExportPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports batchExportInvoicesPDF function', async () => {
    const { batchExportInvoicesPDF } = await import('./batchExportPDF')
    expect(typeof batchExportInvoicesPDF).toBe('function')
  })

  it('generates PDF for single invoice', async () => {
    const { batchExportInvoicesPDF } = await import('./batchExportPDF')
    const invoices = [{
      id: '1',
      invoiceNumber: 'INV-001',
      clientId: 'client1',
      template: 'us',
      currency: 'USD',
      issueDate: '2024-01-01',
      dueDate: '2024-02-01',
      items: [{ description: 'Service', quantity: 1, unitPrice: 100, amount: 100 }],
      subtotal: 100,
      taxRate: 0,
      taxAmount: 0,
      total: 100,
    }]

    await batchExportInvoicesPDF(invoices, 'user1')
    expect(mockFolderFile).toHaveBeenCalled()
    expect(mockSaveAs).toHaveBeenCalled()
  })

  it('calls onProgress callback', async () => {
    const { batchExportInvoicesPDF } = await import('./batchExportPDF')
    const onProgress = vi.fn()
    const invoices = [{
      id: '1',
      invoiceNumber: 'INV-001',
      clientId: 'client1',
      template: 'us',
      currency: 'USD',
      issueDate: '2024-01-01',
      dueDate: '2024-02-01',
      items: [{ description: 'Service', quantity: 1, unitPrice: 100, amount: 100 }],
      subtotal: 100,
      taxRate: 0,
      taxAmount: 0,
      total: 100,
    }]

    await batchExportInvoicesPDF(invoices, 'user1', onProgress)
    expect(onProgress).toHaveBeenCalledWith(1, 1)
  })

  it('handles multiple invoices', async () => {
    const { batchExportInvoicesPDF } = await import('./batchExportPDF')
    const invoices = [
      { id: '1', invoiceNumber: 'INV-001', clientId: 'client1', template: 'us', currency: 'USD', issueDate: '2024-01-01', dueDate: '2024-02-01', items: [{ description: 'A', quantity: 1, unitPrice: 100, amount: 100 }], subtotal: 100, taxRate: 0, taxAmount: 0, total: 100 },
      { id: '2', invoiceNumber: 'INV-002', clientId: 'client1', template: 'eu', currency: 'EUR', issueDate: '2024-01-01', dueDate: '2024-02-01', items: [{ description: 'B', quantity: 2, unitPrice: 50, amount: 100 }], subtotal: 100, taxRate: 20, taxAmount: 20, total: 120 },
    ]

    await batchExportInvoicesPDF(invoices, 'user1')
    expect(mockFolderFile).toHaveBeenCalledTimes(2)
  })

  it('handles invoice without clientId', async () => {
    const { batchExportInvoicesPDF } = await import('./batchExportPDF')
    const invoices = [{
      id: '1',
      invoiceNumber: 'INV-001',
      template: 'us',
      currency: 'USD',
      issueDate: '2024-01-01',
      dueDate: '2024-02-01',
      items: [{ description: 'Service', quantity: 1, unitPrice: 100, amount: 100 }],
      subtotal: 100,
      taxRate: 0,
      taxAmount: 0,
      total: 100,
    }]

    await batchExportInvoicesPDF(invoices)
    expect(mockFolderFile).toHaveBeenCalled()
  })

  it('handles invoice without invoiceNumber', async () => {
    const { batchExportInvoicesPDF } = await import('./batchExportPDF')
    const invoices = [{
      id: '1',
      clientId: 'client1',
      template: 'us',
      currency: 'USD',
      issueDate: '2024-01-01',
      dueDate: '2024-02-01',
      items: [{ description: 'Service', quantity: 1, unitPrice: 100, amount: 100 }],
      subtotal: 100,
      taxRate: 0,
      taxAmount: 0,
      total: 100,
    }]

    await batchExportInvoicesPDF(invoices, 'user1')
    expect(mockFolderFile).toHaveBeenCalled()
  })

  it('handles eu template', async () => {
    const { batchExportInvoicesPDF } = await import('./batchExportPDF')
    const invoices = [{
      id: '1',
      invoiceNumber: 'INV-001',
      clientId: 'client1',
      template: 'eu',
      currency: 'EUR',
      issueDate: '2024-01-01',
      dueDate: '2024-02-01',
      items: [{ description: 'Service', quantity: 1, unitPrice: 100, amount: 100 }],
      subtotal: 100,
      taxRate: 0,
      taxAmount: 0,
      total: 100,
    }]

    await batchExportInvoicesPDF(invoices, 'user1')
    expect(mockFolderFile).toHaveBeenCalled()
  })

  it('handles uk template', async () => {
    const { batchExportInvoicesPDF } = await import('./batchExportPDF')
    const invoices = [{
      id: '1',
      invoiceNumber: 'INV-001',
      clientId: 'client1',
      template: 'uk',
      currency: 'GBP',
      issueDate: '2024-01-01',
      dueDate: '2024-02-01',
      items: [{ description: 'Service', quantity: 1, unitPrice: 100, amount: 100 }],
      subtotal: 100,
      taxRate: 20,
      taxAmount: 20,
      total: 120,
    }]

    await batchExportInvoicesPDF(invoices, 'user1')
    expect(mockFolderFile).toHaveBeenCalled()
  })

  it('handles unknown template falls back to us', async () => {
    const { batchExportInvoicesPDF } = await import('./batchExportPDF')
    const invoices = [{
      id: '1',
      invoiceNumber: 'INV-001',
      clientId: 'client1',
      template: 'unknown',
      currency: 'USD',
      issueDate: '2024-01-01',
      dueDate: '2024-02-01',
      items: [{ description: 'Service', quantity: 1, unitPrice: 100, amount: 100 }],
      subtotal: 100,
      taxRate: 0,
      taxAmount: 0,
      total: 100,
    }]

    await batchExportInvoicesPDF(invoices, 'user1')
    expect(mockFolderFile).toHaveBeenCalled()
  })

  it('handles PDF generation error', async () => {
    const { batchExportInvoicesPDF } = await import('./batchExportPDF')
    mockJsPDFInstance.output.mockImplementation(() => { throw new Error('PDF error') })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const invoices = [{
      id: '1',
      invoiceNumber: 'INV-001',
      clientId: 'client1',
      template: 'us',
      currency: 'USD',
      issueDate: '2024-01-01',
      dueDate: '2024-02-01',
      items: [{ description: 'Service', quantity: 1, unitPrice: 100, amount: 100 }],
      subtotal: 100,
      taxRate: 0,
      taxAmount: 0,
      total: 100,
    }]

    await batchExportInvoicesPDF(invoices, 'user1')
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
    mockJsPDFInstance.output.mockReturnValue(new Blob(['pdf']))
  })

  it('handles empty items array', async () => {
    const { batchExportInvoicesPDF } = await import('./batchExportPDF')
    const invoices = [{
      id: '1',
      invoiceNumber: 'INV-001',
      clientId: 'client1',
      template: 'us',
      currency: 'USD',
      issueDate: '2024-01-01',
      dueDate: '2024-02-01',
      items: [],
      subtotal: 0,
      taxRate: 0,
      taxAmount: 0,
      total: 0,
    }]

    await batchExportInvoicesPDF(invoices, 'user1')
    expect(mockFolderFile).toHaveBeenCalled()
  })

  it('handles invoice with tax', async () => {
    const { batchExportInvoicesPDF } = await import('./batchExportPDF')
    const invoices = [{
      id: '1',
      invoiceNumber: 'INV-001',
      clientId: 'client1',
      template: 'us',
      currency: 'USD',
      issueDate: '2024-01-01',
      dueDate: '2024-02-01',
      items: [{ description: 'Service', quantity: 1, unitPrice: 100, amount: 100 }],
      subtotal: 100,
      taxRate: 10,
      taxAmount: 10,
      total: 110,
    }]

    await batchExportInvoicesPDF(invoices, 'user1')
    expect(mockFolderFile).toHaveBeenCalled()
  })
})
