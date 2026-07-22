import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const API2D_KEY = process.env.API2D_KEY
const CORS_ORIGIN = 'https://tax.flowingpulse.com'
const OCR_FREE_LIMIT = 3

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

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

  // --- 1. Verify JWT ---
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Unauthorized' }))
    return
  }

  const token = authHeader.slice(7)
  let userId = null

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      res.statusCode = 401
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }
    userId = user.id
  } catch (err) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Unauthorized' }))
    return
  }

  // --- 2. Check API key ---
  if (!API2D_KEY) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Service temporarily unavailable' }))
    return
  }

  // --- 3. Parse body ---
  let body = {}
  try {
    if (req.body !== undefined) {
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
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Invalid request body' }))
    return
  }

  // --- 4. Validate input ---
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Invalid request body' }))
    return
  }

  // Limit messages array size
  if (body.messages.length > 5) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Too many messages' }))
    return
  }

  // --- 5. Server-side rate limit ---
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Check if user has active subscription (unlimited OCR)
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (!sub) {
      // Free user: check usage count
      const { count } = await supabase
        .from('ocr_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if ((count || 0) >= OCR_FREE_LIMIT) {
        res.statusCode = 429
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'OCR limit reached. Please upgrade to Pro for unlimited scans.' }))
        return
      }
    }
  } catch (err) {
    // Don't block on rate limit check failure, but log it
    console.error('[OCR] Rate limit check failed:', err.message)
  }

  // --- 6. Forward to upstream API ---
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
        max_tokens: 500,
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

    // --- 7. Sanitize: only return the content ---
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
