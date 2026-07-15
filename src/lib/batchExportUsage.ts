import { supabase } from './supabase'
import { checkSubscription } from './subscription'

const BATCH_EXPORT_FREE_LIMIT = 5
const STORAGE_KEY = 'batch_export_usage'

interface MonthlyUsage {
  year: number
  month: number
  count: number
}

function getCurrentMonthKey(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function getGuestUsage(): MonthlyUsage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { ...getCurrentMonthKey(), count: 0 }
    const usage: MonthlyUsage = JSON.parse(stored)
    const current = getCurrentMonthKey()
    if (usage.year !== current.year || usage.month !== current.month) {
      return { ...current, count: 0 }
    }
    return usage
  } catch {
    return { ...getCurrentMonthKey(), count: 0 }
  }
}

function setGuestUsage(usage: MonthlyUsage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage))
}

export async function checkBatchExportUsage(userId?: string): Promise<{
  allowed: boolean
  used: number
  limit: number
  hasSubscription: boolean
}> {
  try {
    if (userId) {
      const subResult = await checkSubscription(userId)
      if (subResult.isPremium) {
        return { allowed: true, used: 0, limit: Infinity, hasSubscription: true }
      }

      const { count, error } = await supabase
        .from('batch_export_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', getMonthStart())

      if (error) {
        console.warn('[TaxFlow] batch_export_usage query failed:', error.message)
      }

      const used = count || 0
      return {
        allowed: used < BATCH_EXPORT_FREE_LIMIT,
        used,
        limit: BATCH_EXPORT_FREE_LIMIT,
        hasSubscription: false,
      }
    } else {
      const usage = getGuestUsage()
      return {
        allowed: usage.count < BATCH_EXPORT_FREE_LIMIT,
        used: usage.count,
        limit: BATCH_EXPORT_FREE_LIMIT,
        hasSubscription: false,
      }
    }
  } catch (err) {
    console.error('[TaxFlow] checkBatchExportUsage failed:', err)
    return { allowed: true, used: 0, limit: BATCH_EXPORT_FREE_LIMIT, hasSubscription: false }
  }
}

export async function recordBatchExportUsage(userId?: string): Promise<void> {
  try {
    if (userId) {
      await supabase.from('batch_export_usage').insert({
        user_id: userId,
        created_at: new Date().toISOString(),
      })
    } else {
      const usage = getGuestUsage()
      usage.count += 1
      setGuestUsage(usage)
    }
  } catch (err) {
    console.warn('[TaxFlow] Failed to record batch export usage:', err)
  }
}

function getMonthStart(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}
