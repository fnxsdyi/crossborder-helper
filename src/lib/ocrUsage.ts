import { supabase } from './supabase'

const OCR_FREE_LIMIT = 3

export async function checkOcrUsage(userId: string): Promise<{
  allowed: boolean
  used: number
  limit: number
  hasSubscription: boolean
}> {
  // Check subscription
  const hasSubscription = await hasOcrSubscription(userId)
  if (hasSubscription) {
    return { allowed: true, used: 0, limit: Infinity, hasSubscription: true }
  }

  // Check free usage
  const { count } = await supabase
    .from('ocr_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const used = count || 0
  return {
    allowed: used < OCR_FREE_LIMIT,
    used,
    limit: OCR_FREE_LIMIT,
    hasSubscription: false,
  }
}

export async function recordOcrUsage(userId: string, imageHash: string): Promise<void> {
  await supabase.from('ocr_usage').insert({
    user_id: userId,
    image_hash: imageHash,
  })
}

export async function hasOcrSubscription(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('licenses')
    .select('id')
    .eq('user_id', userId)
    .eq('key', 'OCR_ADDON')
    .eq('active', true)
    .single()

  return !!data
}

export async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
