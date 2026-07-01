export interface OcrResult {
  invoice_number: string | null
  date: string | null
  amount: number | null
  currency: string | null
  vendor_name: string | null
  tax_id: string | null
  confidence: number
}

export interface OcrConfirmData {
  invoice_number: string
  date: string
  amount: number
  currency: string
  vendor_name: string
  tax_id: string
}

export function validateOcrResult(data: unknown): OcrResult | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>

  return {
    invoice_number: typeof obj.invoice_number === 'string' ? obj.invoice_number : null,
    date: typeof obj.date === 'string' ? obj.date : null,
    amount: typeof obj.amount === 'number' ? obj.amount : null,
    currency: typeof obj.currency === 'string' ? obj.currency : null,
    vendor_name: typeof obj.vendor_name === 'string' ? obj.vendor_name : null,
    tax_id: typeof obj.tax_id === 'string' ? obj.tax_id : null,
    confidence: typeof obj.confidence === 'number' ? obj.confidence : 0,
  }
}

export function validateOcrConfirm(data: unknown): data is OcrConfirmData {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj.invoice_number === 'string' && obj.invoice_number.length > 0 &&
    typeof obj.date === 'string' && obj.date.length > 0 &&
    typeof obj.amount === 'number' && obj.amount > 0 &&
    typeof obj.currency === 'string' && obj.currency.length > 0 &&
    typeof obj.vendor_name === 'string' && obj.vendor_name.length > 0
  )
}
