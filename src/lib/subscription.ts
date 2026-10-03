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

/**
 * Record a one-time (buyout) license for a user.
 * Buyout users are unlocked via the `licenses` table — checkSubscriptionWithFallback
 * already treats an active license as `planType: 'lifetime'` premium.
 */
export async function recordLicense(userId: string, key: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('licenses').insert({
      user_id: userId,
      key,
      active: true,
    })
    if (error) {
      console.error('[TaxFlow] recordLicense failed:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('[TaxFlow] recordLicense failed:', err)
    return false
  }
}

/**
 * Record a one-time (buyout) license AND wait for it to become active.
 *
 * Client-side entry point after a successful PayPal capture. It performs an
 * optimistic local insert (which becomes a harmless no-op once server-side
 * issuance is enforced via RLS — see supabase/migrations/20261003_lock_license_issuance.sql,
 * the TF-02 hardening) and then POLLS the authoritative state until the
 * webhook-issued license appears.
 *
 * This makes the unlock reliable even if:
 *  - the tab closed before the original recordLicense() call fired, or
 *  - client inserts are disabled (TF-02), because the webhook (PR #12) is the
 *    authoritative issuer and this helper waits for it.
 *
 * Returns true once premium is detected, false on timeout.
 */
export async function recordLicenseAndWait(
  userId: string,
  key: string,
  opts?: { timeoutMs?: number; pollIntervalMs?: number },
): Promise<boolean> {
  // Optimistic local insert — succeeds today, no-op once RLS blocks it.
  await recordLicense(userId, key)

  const timeoutMs = opts?.timeoutMs ?? 15000
  const pollIntervalMs = opts?.pollIntervalMs ?? 1000
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const result = await checkSubscriptionWithFallback(userId)
    if (result.isPremium) return true
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }
  return false
}
