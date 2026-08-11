import { supabase } from './supabase'
import { checkSubscription } from './subscription'
import { isAdmin, OCR_FREE_LIMIT } from './config'

/** Local midnight on the 1st of the current month, as ISO — free quota resets monthly. */
function getMonthStart(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

export async function checkOcrUsage(userId: string, userEmail?: string): Promise<{
  allowed: boolean
  used: number
  limit: number
  hasSubscription: boolean
}> {
  try {
    // Check admin status first
    if (isAdmin(userEmail)) {
      return { allowed: true, used: 0, limit: Infinity, hasSubscription: true }
    }

    // Check subscription
    const subResult = await checkSubscription(userId)
    if (subResult.isPremium) {
      return { allowed: true, used: 0, limit: Infinity, hasSubscription: true }
    }

    // Check free usage for the current calendar month
    const { count } = await supabase
      .from('ocr_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('used_at', getMonthStart())

    const used = count || 0
    return {
      allowed: used < OCR_FREE_LIMIT,
      used,
      limit: OCR_FREE_LIMIT,
      hasSubscription: false,
    }
  } catch {
    return { allowed: true, used: 0, limit: OCR_FREE_LIMIT, hasSubscription: false }
  }
}

export async function recordOcrUsage(userId: string, imageHash: string): Promise<void> {
  try {
    await supabase.from('ocr_usage').insert({
      user_id: userId,
      image_hash: imageHash,
    })
  } catch {
    // Usage recording is best-effort
  }
}

export async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
