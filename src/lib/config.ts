// Centralized configuration

export const SUPER_ADMIN_EMAILS = ['fnxsdyi@qq.com'] as const

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase())
}
