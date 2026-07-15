import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { SyncInvoice } from './sync'

async function generateInvoicePDFBlob(invoice: SyncInvoice, userId?: string): Promise<Blob> {
  const { jsPDF } = await import('jspdf')

  const { getSettings, getClients } = await import('./sync')

  let settings = null
  let client = null

  if (userId) {
    try {
      settings = await getSettings(userId)
      const clients = await getClients(userId)
      client = clients.find(c => c.id === invoice.clientId) || null
    } catch (err) {
      console.error('Failed to load settings/client for PDF:', err)
    }
  }

  const TEMPLATES: Record<string, any> = {
    us: { title: 'INVOICE', headerColor: [37, 99, 235] },
    eu: { title: 'INVOICE', headerColor: [30, 58, 138] },
    uk: { title: 'INVOICE', headerColor: [55, 48, 163] },
  }

  const templateKey = invoice.template || 'us'
  const config = TEMPLATES[templateKey] || TEMPLATES.us

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(config.headerColor[0], config.headerColor[1], config.headerColor[2])
  doc.rect(0, 0, pageWidth, 45, 'F')

  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.text(config.title, 20, 30)

  doc.setFontSize(10)
  doc.text(invoice.invoiceNumber, 20, 40)

  let y = 60
  doc.setTextColor(0, 0, 0)

  if (settings?.businessName) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(settings.businessName, 20, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    if (settings.businessAddress) {
      doc.text(settings.businessAddress, 20, y)
      y += 5
    }
    if (settings.businessEmail) {
      doc.text(settings.businessEmail, 20, y)
      y += 5
    }
  }

  y += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Bill To:', 20, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  if (client) {
    doc.text(client.name, 20, y)
    y += 5
    if (client.email) doc.text(client.email, 20, y)
  } else {
    doc.text('N/A', 20, y)
  }

  y += 15
  doc.setFont('helvetica', 'bold')
  doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 20, y)
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 120, y)

  y += 15
  doc.setFillColor(240, 240, 240)
  doc.rect(20, y - 5, pageWidth - 40, 8, 'F')
  doc.setFontSize(9)
  doc.text('Description', 25, y)
  doc.text('Qty', 120, y)
  doc.text('Price', 140, y)
  doc.text('Amount', 165, y)

  y += 10
  doc.setFont('helvetica', 'normal')
  for (const item of invoice.items) {
    doc.text(item.description || '-', 25, y)
    doc.text(String(item.quantity), 125, y)
    doc.text(`${invoice.currency} ${item.unitPrice.toFixed(2)}`, 140, y)
    doc.text(`${invoice.currency} ${item.amount.toFixed(2)}`, 165, y)
    y += 7
  }

  y += 5
  doc.setDrawColor(200, 200, 200)
  doc.line(20, y, pageWidth - 20, y)
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.text('Subtotal:', 130, y)
  doc.text(`${invoice.currency} ${invoice.subtotal.toFixed(2)}`, 165, y)
  y += 7

  if (invoice.taxAmount > 0) {
    doc.text(`Tax (${invoice.taxRate}%):`, 130, y)
    doc.text(`${invoice.currency} ${invoice.taxAmount.toFixed(2)}`, 165, y)
    y += 7
  }

  doc.setFontSize(12)
  doc.text('Total:', 130, y)
  doc.text(`${invoice.currency} ${invoice.total.toFixed(2)}`, 165, y)

  const output = doc.output('blob')
  return output
}

export async function batchExportInvoicesPDF(
  invoices: SyncInvoice[],
  userId?: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip()
  const folder = zip.folder('invoices')!

  for (let i = 0; i < invoices.length; i++) {
    const invoice = invoices[i]
    onProgress?.(i + 1, invoices.length)

    try {
      const blob = await generateInvoicePDFBlob(invoice, userId)
      const fileName = `${invoice.invoiceNumber || `invoice-${i + 1}`}.pdf`
      folder.file(fileName, blob)
    } catch (err) {
      console.error(`Failed to generate PDF for invoice ${invoice.invoiceNumber}:`, err)
      folder.file(`ERROR-${invoice.invoiceNumber || i + 1}.txt`, `Failed to generate: ${err}`)
    }
  }

  const content = await zip.generateAsync({ type: 'blob' })
  const timestamp = new Date().toISOString().slice(0, 10)
  saveAs(content, `invoices-${timestamp}.zip`)
}
