import { supabase } from './supabase'
import { checkSubscription } from './subscription'

const OCR_FREE_LIMIT = 3

export async function checkOcrUsage(userId: string): Promise<{
  allowed: boolean
  used: number
  limit: number
  hasSubscription: boolean
}> {
  try {
    // Check subscription
    const subResult = await checkSubscription(userId)
    if (subResult.isPremium) {
      return { allowed: true, used: 0, limit: Infinity, hasSubscription: true }
    }

    // Check free usage
    const { count, error } = await supabase
      .from('ocr_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      console.warn('[TaxFlow] ocr_usage query failed:', error.message)
    }

    const used = count || 0
    return {
      allowed: used < OCR_FREE_LIMIT,
      used,
      limit: OCR_FREE_LIMIT,
      hasSubscription: false,
    }
  } catch (err) {
    console.error('[TaxFlow] checkOcrUsage failed:', err)
    return { allowed: true, used: 0, limit: OCR_FREE_LIMIT, hasSubscription: false }
  }
}

export async function recordOcrUsage(userId: string, imageHash: string): Promise<void> {
  try {
    await supabase.from('ocr_usage').insert({
      user_id: userId,
      image_hash: imageHash,
    })
  } catch (err) {
    console.warn('[TaxFlow] Failed to record OCR usage:', err)
  }
}

export async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
