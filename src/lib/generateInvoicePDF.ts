import { jsPDF } from 'jspdf'
import type { Invoice } from '@/db'
import db from '@/db'

type TemplateConfig = {
  title: string
  dateFormat: string
  currencyFormat: Intl.NumberFormatOptions
  taxLabel: string
  footerText: string
  showVatNumbers: boolean
  headerColor: [number, number, number]
  showPaymentTerms: boolean
}

const TEMPLATES: Record<string, TemplateConfig> = {
  us: {
    title: 'INVOICE',
    dateFormat: 'en-US',
    currencyFormat: { style: 'currency', currency: 'USD' },
    taxLabel: 'Sales Tax',
    footerText: 'This invoice was generated with CrossBorder Invoice & Tax Helper. All amounts are in',
    showVatNumbers: false,
    headerColor: [37, 99, 235],
    showPaymentTerms: true,
  },
  eu: {
    title: 'INVOICE',
    dateFormat: 'en-GB',
    currencyFormat: { style: 'currency', currency: 'EUR' },
    taxLabel: 'VAT',
    footerText: 'This invoice was generated with CrossBorder Invoice & Tax Helper. All amounts are in',
    showVatNumbers: true,
    headerColor: [0, 51, 153],
    showPaymentTerms: true,
  },
  uk: {
    title: 'TAX INVOICE',
    dateFormat: 'en-GB',
    currencyFormat: { style: 'currency', currency: 'GBP' },
    taxLabel: 'VAT',
    footerText: 'This invoice was generated with CrossBorder Invoice & Tax Helper. All amounts are in',
    showVatNumbers: true,
    headerColor: [0, 32, 91],
    showPaymentTerms: true,
  },
}

export async function generateInvoicePDF(invoice: Invoice): Promise<void> {
  const settings = await db.settings.toCollection().first()
  const client = await db.clients.get(invoice.clientId)

  const templateKey = invoice.template || 'us'
  const config = TEMPLATES[templateKey] || TEMPLATES.us

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header background
  doc.setFillColor(config.headerColor[0], config.headerColor[1], config.headerColor[2])
  doc.rect(0, 0, pageWidth, 45, 'F')

  // Header title
  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.text(config.title, 20, 30)

  // Invoice number and dates
  doc.setFontSize(10)
  doc.setTextColor(220, 220, 220)
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 55)
  doc.text(`Date: ${formatDate(invoice.issueDate, config.dateFormat)}`, 20, 61)
  doc.text(`Due: ${formatDate(invoice.dueDate, config.dateFormat)}`, 20, 67)

  // Status badge
  doc.setFontSize(9)
  const statusColors = {
    draft: [148, 163, 184],
    sent: [59, 130, 246],
    paid: [34, 197, 94],
    overdue: [239, 68, 68],
  }
  const statusColor = statusColors[invoice.status] || statusColors.draft
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
  doc.roundedRect(150, 50, 40, 10, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text(invoice.status.toUpperCase(), 170, 57, { align: 'center' })

  // From section
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('FROM', 20, 82)
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text(settings?.businessName || 'Your Business', 20, 88)
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  if (settings?.businessAddress) {
    const addressLines = settings.businessAddress.split('\n')
    addressLines.forEach((line, i) => {
      doc.text(line, 20, 94 + i * 5)
    })
  }
  doc.text(settings?.businessEmail || '', 20, 106)
  if (config.showVatNumbers && invoice.vatNumber) {
    doc.text(`VAT No: ${invoice.vatNumber}`, 20, 112)
  }

  // To section
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('BILL TO', 120, 82)
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text(client?.name || 'Client', 120, 88)
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  if (client?.company) {
    doc.text(client.company, 120, 94)
  }
  doc.text(client?.email || '', 120, 100)
  if (client?.country) {
    doc.text(client.country, 120, 106)
  }
  if (config.showVatNumbers && invoice.buyerVatNumber) {
    doc.text(`VAT No: ${invoice.buyerVatNumber}`, 120, 112)
  }

  // Line items table header
  const tableTop = 125
  doc.setFillColor(config.headerColor[0], config.headerColor[1], config.headerColor[2])
  doc.rect(20, tableTop, pageWidth - 40, 8, 'F')

  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text('Description', 22, tableTop + 5.5)
  doc.text('Qty', 120, tableTop + 5.5)
  doc.text('Unit Price', 140, tableTop + 5.5)
  doc.text('Amount', 175, tableTop + 5.5)

  // Line items
  let currentY = tableTop + 12
  invoice.items.forEach((item) => {
    doc.setTextColor(15, 23, 42)
    doc.text(item.description || '-', 22, currentY)
    doc.text(String(item.quantity), 120, currentY)
    doc.text(formatCurrency(item.unitPrice, invoice.currency), 140, currentY)
    doc.text(formatCurrency(item.amount, invoice.currency), 175, currentY)
    currentY += 7
  })

  // Divider
  doc.setDrawColor(226, 232, 240)
  doc.line(20, currentY + 2, pageWidth - 20, currentY + 2)

  // Totals
  const totalsX = 130
  currentY += 10

  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text('Subtotal', totalsX, currentY)
  doc.setTextColor(15, 23, 42)
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), 175, currentY, { align: 'right' })

  currentY += 7
  doc.setTextColor(100, 116, 139)

  // VAT type display
  const vatType = invoice.vatType || 'none'
  if (vatType === 'reverse_charge') {
    doc.text(`${config.taxLabel} (Reverse Charge)`, totalsX, currentY)
    doc.setTextColor(15, 23, 42)
    doc.text('0.00', 175, currentY, { align: 'right' })
    currentY += 5
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    if (templateKey === 'uk') {
      doc.text('Reverse charge: Customer to account for VAT per VAT Act 1994 Section 7A', totalsX, currentY)
    } else {
      doc.text('Reverse charge: Customer to account for VAT', totalsX, currentY)
    }
    doc.setFontSize(10)
  } else if (vatType === 'exempt') {
    doc.text(`${config.taxLabel} Exempt`, totalsX, currentY)
    doc.setTextColor(15, 23, 42)
    doc.text('0.00', 175, currentY, { align: 'right' })
  } else if (invoice.taxRate > 0) {
    doc.text(`${config.taxLabel} (${invoice.taxRate}%)`, totalsX, currentY)
    doc.setTextColor(15, 23, 42)
    doc.text(formatCurrency(invoice.taxAmount, invoice.currency), 175, currentY, { align: 'right' })
  } else {
    doc.text('Tax', totalsX, currentY)
    doc.setTextColor(15, 23, 42)
    doc.text(formatCurrency(invoice.taxAmount, invoice.currency), 175, currentY, { align: 'right' })
  }

  currentY += 8
  doc.setFillColor(config.headerColor[0], config.headerColor[1], config.headerColor[2])
  doc.roundedRect(totalsX - 5, currentY - 5, 80, 12, 2, 2, 'F')
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL', totalsX, currentY + 2)
  doc.text(formatCurrency(invoice.total, invoice.currency), 175, currentY + 2, { align: 'right' })

  // UK specific: VAT registration notice
  if (templateKey === 'uk' && invoice.vatType !== 'none') {
    currentY += 20
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('VAT registered in the United Kingdom', 20, currentY)
    if (invoice.vatNumber) {
      doc.text(`VAT Registration Number: ${invoice.vatNumber}`, 20, currentY + 5)
    }
  }

  // Notes
  if (invoice.notes) {
    currentY += 15
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text('Notes:', 20, currentY)
    currentY += 6
    doc.setTextColor(71, 85, 105)
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 40)
    doc.text(noteLines, 20, currentY)
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text(
    `${config.footerText} ${invoice.currency}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )

  // UK specific footer
  if (templateKey === 'uk') {
    doc.text(
      'A VAT invoice must contain: seller name and address, VAT registration number, date, invoice number, description of goods/services, quantity, unit price, total amount, VAT rate and amount.',
      pageWidth / 2,
      footerY + 5,
      { align: 'center' }
    )
  }

  // Watermark for free users
  if (!settings?.isPremium) {
    doc.setFontSize(60)
    doc.setTextColor(200, 200, 200)
    doc.setGState(new doc.GState({ opacity: 0.15 }))
    doc.text('FREE TRIAL', pageWidth / 2, 150, {
      align: 'center',
      angle: 45,
    })
    doc.setGState(new doc.GState({ opacity: 1 }))
  }

  // Save
  doc.save(`${invoice.invoiceNumber}.pdf`)
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

function formatDate(date: Date | string, locale: string = 'en-US'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
