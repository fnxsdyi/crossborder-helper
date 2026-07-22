import { validateOcrResult, type OcrResult } from './ocrSchema'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const OCR_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 2

const PROMPT = `Extract invoice fields from this image.
Return ONLY valid JSON, no markdown, no explanation.
Format: { "invoice_number": string|null, "date": "YYYY-MM-DD"|null, "amount": number|null, "currency": "CNY"|"USD"|"EUR"|null, "vendor_name": string|null, "tax_id": string|null, "confidence": 0.0-1.0 }

Rules:
- date: convert to YYYY-MM-DD format
- amount: number only, no currency symbol
- currency: detect from invoice, default to CNY for Chinese invoices
- vendor_name: company name from header/seal
- tax_id: 15-18 digit number on Chinese invoices
- confidence: your certainty 0-1 (1 = very clear, 0 = unreadable)`

function isWithinSizeLimit(dataUrl: string): boolean {
  const base64 = dataUrl.split(',')[1] || ''
  const sizeInBytes = Math.round((base64.length * 3) / 4)
  return sizeInBytes <= MAX_IMAGE_SIZE
}

export async function recognizeInvoice(
  imageBase64: string,
  _locale: string = 'zh'
): Promise<OcrResult> {
  if (!isWithinSizeLimit(imageBase64)) {
    throw new Error('IMAGE_TOO_LARGE')
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, 1000 * attempt))
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), OCR_TIMEOUT)

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: PROMPT },
                { type: 'image_url', image_url: { url: imageBase64 } },
              ],
            },
          ],
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errText = await response.text().catch(() => 'unknown')
        console.error(`[TaxFlow] API2D error ${response.status}:`, errText)
        throw new Error('API_ERROR')
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        console.error('[TaxFlow] API2D empty response:', JSON.stringify(data).slice(0, 500))
        throw new Error('EMPTY_RESPONSE')
      }

      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim()
      let parsed: unknown
      try {
        parsed = JSON.parse(jsonStr)
      } catch (parseErr) {
        console.error('[TaxFlow] JSON parse failed. Raw content:', content.slice(0, 500))
        throw new Error('RECOGNITION_FAILED')
      }
      const result = validateOcrResult(parsed)

      if (!result) {
        console.error('[TaxFlow] Schema validation failed. Parsed:', JSON.stringify(parsed).slice(0, 500))
        throw new Error('INVALID_RESPONSE')
      }

      return result
    } catch (err) {
      clearTimeout(timeoutId)
      lastError = err instanceof Error ? err : new Error('UNKNOWN')

      if (err instanceof Error && err.name === 'AbortError') {
        lastError = new Error('TIMEOUT')
      }

      if (err instanceof Error && err.message === 'IMAGE_TOO_LARGE') {
        throw err
      }

      if (attempt === MAX_RETRIES) {
        break
      }
    }
  }

  if (lastError?.message === 'TIMEOUT') {
    throw new Error('TIMEOUT')
  }
  throw new Error('RECOGNITION_FAILED')
}
