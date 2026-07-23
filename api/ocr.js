const API2D_KEY = process.env.API2D_KEY
const CORS_ORIGIN = 'https://tax.flowingpulse.com'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  // Check API key
  if (!API2D_KEY) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Service temporarily unavailable' }))
    return
  }

  // Parse body
  let body = {}
  try {
    if (req.body !== undefined && req.body !== null) {
      body = req.body
    } else {
      const raw = await new Promise((resolve, reject) => {
        let data = ''
        req.on('data', (chunk) => {
          data += chunk
          if (data.length > 20 * 1024 * 1024) {
            req.destroy()
            reject(new Error('Payload too large'))
          }
        })
        req.on('end', () => resolve(data))
        req.on('error', reject)
      })
      body = raw ? JSON.parse(raw) : {}
    }
  } catch (e) {
    console.error('[OCR] Body parse error:', e.message)
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Invalid request body', detail: e.message }))
    return
  }

  // Validate input
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    console.error('[OCR] Validation failed:', JSON.stringify(body).slice(0, 200))
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Invalid request body', detail: 'messages array required' }))
    return
  }

  // Forward to upstream API
  try {
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
      console.error('[OCR] Upstream error:', response.status)
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'OCR service temporarily unavailable' }))
      return
    }

    // Sanitize: only return the content
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'OCR service returned empty response' }))
      return
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ choices: [{ message: { content } }] }))
  } catch (err) {
    console.error('[OCR] Upstream request failed:', err.message)
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'OCR service temporarily unavailable' }))
  }
}
