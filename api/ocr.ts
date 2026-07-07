import type { IncomingMessage } from 'http'

interface VercelRequest extends IncomingMessage {
  body: any
  query: Record<string, string>
}

interface VercelResponse {
  status(code: number): VercelResponse
  json(data: unknown): void
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.API2D_KEY
  if (!apiKey) {
    console.error('[TaxFlow OCR] API2D_KEY is not set')
    return res.status(500).json({ error: 'API_KEY_MISSING' })
  }

  try {
    const body = req.body
    if (!body || !body.messages) {
      return res.status(400).json({ error: 'Invalid request body' })
    }

    const response = await fetch('https://oa.api2d.net/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: body.messages,
        max_tokens: 500,
        temperature: 0,
      }),
    })

    const data = await response.json()
    return res.status(200).json(data)
  } catch (err) {
    console.error('[TaxFlow OCR] Error:', err)
    return res.status(500).json({ error: 'RECOGNITION_FAILED' })
  }
}