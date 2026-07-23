const API2D_KEY = process.env.API2D_KEY
const CORS_ORIGIN = 'https://tax.flowingpulse.com'

export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!API2D_KEY) return res.status(500).json({ error: 'Service temporarily unavailable' })

  try {
    const raw = await new Promise((resolve, reject) => {
      const chunks = []
      req.on('data', (c) => chunks.push(c))
      req.on('end', () => resolve(Buffer.concat(chunks).toString()))
      req.on('error', reject)
    })

    const body = JSON.parse(raw)

    if (!body || !body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' })
    }

    const response = await fetch('https://oa.api2d.net/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API2D_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: body.messages,
        max_tokens: 300,
        temperature: 0,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(502).json({ error: 'OCR service temporarily unavailable' })
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) return res.status(502).json({ error: 'OCR service returned empty response' })

    return res.status(200).json({ choices: [{ message: { content } }] })
  } catch (err) {
    return res.status(500).json({ error: 'OCR processing failed', detail: err.message })
  }
}
