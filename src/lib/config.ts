// Centralized configuration

const SUPER_ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'fnxsdyi@qq.com').split(',').map((e: string) => e.trim())

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase())
}

/** PayPal Subscription Plan IDs */
export const PRO_MONTHLY_PLAN_ID = 'P-29E1204392902382CNJCROFI'
export const PRO_ANNUAL_PLAN_ID = 'P-3D915014J7223963ENJDBLSY'

/** OCR free tier limit */
export const OCR_FREE_LIMIT = 3

/** W-8BEN free tier limit */
export const W8BEN_FREE_LIMIT = 3
