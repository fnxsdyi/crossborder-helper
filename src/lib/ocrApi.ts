import { validateOcrResult, type OcrResult } from './ocrSchema'

const API2D_URL = 'https://oa.api2d.net/v1/chat/completions'
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_DIMENSION = 2048

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

async function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

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

  const compressed = await compressImage(imageBase64)

  const apiKey = import.meta.env.VITE_API2D_KEY
  if (!apiKey) {
    console.error('[TaxFlow] VITE_API2D_KEY is not set')
    throw new Error('API_KEY_MISSING')
  }
  console.log('[TaxFlow] OCR request starting, image size:', Math.round(imageBase64.length / 1024), 'KB')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000)

  try {
    const response = await fetch(API2D_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              { type: 'image_url', image_url: { url: compressed } },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0,
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

    // Parse JSON from response (handle markdown code blocks)
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
    if (err instanceof Error) {
      if (err.name === 'AbortError') throw new Error('TIMEOUT')
      if (err.message === 'IMAGE_TOO_LARGE') throw err
      if (err.message === 'API_KEY_MISSING') throw err
    }
    throw new Error('RECOGNITION_FAILED')
  }
}
