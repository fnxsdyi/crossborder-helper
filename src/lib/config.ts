// Centralized configuration

// Admin emails - hardcoded to ensure admin bypass works
const SUPER_ADMIN_EMAILS = ['fnxsdyi@qq.com']

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase())
}

/** PayPal Subscription Plan IDs (legacy — retained for backward compatibility) */
export const PRO_MONTHLY_PLAN_ID = 'P-29E1204392902382CNJCROFI'
export const PRO_ANNUAL_PLAN_ID = 'P-3D915014J7223963ENJDBLSY'
/** FlowingPulse referral — exclusive $49/year member plan */
export const FLOWINGPULSE_PLAN_ID = 'P-158046208S2020443NKCDPGI'

/**
 * TaxFlow one-time (buyout) pricing.
 * We moved from subscription to a single lifetime payment. Buyout users are
 * unlocked via the `licenses` table (see recordLicense in subscription.ts).
 */
export const TAXFLOW_BUYOUT_PRICE = 29
export const TAXFLOW_LAUNCH_PRICE = 19
/** Founder launch discount code — unlocks the $19 price. */
export const TAXFLOW_LAUNCH_CODE = 'FOUNDER19'
/** FlowingPulse member one-time buyout price. */
export const TAXFLOW_MEMBER_PRICE = 49

/** Resolve the buyout price for a given promo code (case-insensitive). */
export function getTaxflowPrice(code?: string | null): number {
  const normalized = (code || '').trim().toUpperCase()
  if (normalized === TAXFLOW_LAUNCH_CODE) return TAXFLOW_LAUNCH_PRICE
  return TAXFLOW_BUYOUT_PRICE
}

/** OCR free tier limit */
export const OCR_FREE_LIMIT = 3

/** W-8BEN free tier limit */
export const W8BEN_FREE_LIMIT = 3
