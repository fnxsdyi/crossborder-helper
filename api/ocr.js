export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', 'https://tax.flowingpulse.com')
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

    const apiKey = process.env.API2D_KEY
    if (!apiKey) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'API_KEY_MISSING' }))
      return
    }

    let body = {}
    try {
      if (req.body !== undefined) {
        body = req.body
      } else {
        const raw = await new Promise((resolve, reject) => {
          let data = ''
          req.on('data', (chunk) => (data += chunk))
          req.on('end', () => resolve(data))
          req.on('error', reject)
        })
        body = raw ? JSON.parse(raw) : {}
      }
    } catch (e) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Invalid request body' }))
      return
    }

    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Invalid request body' }))
      return
    }

    const response = await fetch('https://oa.api2d.net/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
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

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))
  } catch (err) {
    console.error('[TaxFlow OCR] Fatal error:', err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'FUNCTION_ERROR', message: err && err.message ? err.message : String(err) }))
  }
}
