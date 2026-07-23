const API2D_KEY = process.env.API2D_KEY
const CORS_ORIGIN = 'https://tax.flowingpulse.com'

// Rate limiter: max 10 requests per minute per IP
// Note: In-memory, resets on cold start. For production, use Vercel KV or Redis.
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

const rateLimitMap = new Map()

function getRateLimitKey(ip) {
  return ip || 'unknown'
}

function isRateLimited(ip) {
  const key = getRateLimitKey(ip)
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { start: now, count: 1 })
    return false
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return true
  }

  record.count++
  return false
}

function getRateLimitRemaining(ip) {
  const key = getRateLimitKey(ip)
  const record = rateLimitMap.get(key)
  if (!record || Date.now() - record.start > RATE_LIMIT_WINDOW) {
    return RATE_LIMIT_MAX
  }
  return Math.max(0, RATE_LIMIT_MAX - record.count)
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap) {
    if (now - record.start > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(key)
    }
  }
}, RATE_LIMIT_WINDOW)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!API2D_KEY) return res.status(500).json({ error: 'Service temporarily unavailable' })

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
  if (isRateLimited(clientIp)) {
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX)
    res.setHeader('X-RateLimit-Remaining', 0)
    res.setHeader('Retry-After', '60')
    return res.status(429).json({ error: 'Too many requests. Please try again later.' })
  }

  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX)
  res.setHeader('X-RateLimit-Remaining', getRateLimitRemaining(clientIp))

  try {
    const body = req.body || {}

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
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
        max_tokens: 500,
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
    return res.status(500).json({ error: 'OCR processing failed' })
  }
}
