import { supabase } from './supabase'

export interface Subscription {
  id: string
  user_id: string
  paypal_subscription_id: string
  plan_type: 'monthly' | 'annual'
  status: 'active' | 'canceled' | 'past_due' | 'expired' | 'pending'
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

/**
 * Check if a subscription is currently usable.
 * - active: always usable
 * - canceled: usable until current_period_end
 * - past_due: usable during grace period (we treat as active)
 * - expired/pending: not usable
 */
export function isSubscriptionActive(sub: Subscription): boolean {
  if (sub.status === 'active') {
    // Active subscription - check if period hasn't expired
    if (sub.current_period_end) {
      return new Date(sub.current_period_end) > new Date()
    }
    return true
  }

  if (sub.status === 'canceled') {
    // Canceled but still within paid period
    if (sub.current_period_end) {
      return new Date(sub.current_period_end) > new Date()
    }
    return false
  }

  if (sub.status === 'past_due') {
    // In grace period - still usable
    return true
  }

  return false
}

/**
 * Check subscription status for a user.
 * Returns premium status, plan type, and expiry info.
 */
export async function checkSubscription(userId: string): Promise<{
  isPremium: boolean
  planType: 'monthly' | 'annual' | null
  expiresAt: Date | null
  subscription: Subscription | null
}> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      return { isPremium: false, planType: null, expiresAt: null, subscription: null }
    }

    const sub = data as Subscription
    const active = isSubscriptionActive(sub)

    return {
      isPremium: active,
      planType: active ? sub.plan_type : null,
      expiresAt: sub.current_period_end ? new Date(sub.current_period_end) : null,
      subscription: sub,
    }
  } catch (err) {
    console.error('[TaxFlow] checkSubscription failed:', err)
    return { isPremium: false, planType: null, expiresAt: null, subscription: null }
  }
}

/**
 * Fallback check: also check licenses table for old one-time buyers.
 * This ensures backward compatibility during migration.
 */
export async function checkSubscriptionWithFallback(userId: string): Promise<{
  isPremium: boolean
  planType: 'monthly' | 'annual' | 'lifetime' | null
  expiresAt: Date | null
}> {
  // First check subscriptions table
  const subResult = await checkSubscription(userId)
  if (subResult.isPremium) {
    return subResult
  }

  // Fallback: check licenses table for legacy one-time buyers
  try {
    const { data } = await supabase
      .from('licenses')
      .select('id')
      .eq('user_id', userId)
      .eq('active', true)
      .maybeSingle()

    if (data) {
      return { isPremium: true, planType: 'lifetime', expiresAt: null }
    }
  } catch (err) {
    console.error('[TaxFlow] licenses fallback check failed:', err)
  }

  return { isPremium: false, planType: null, expiresAt: null }
}
