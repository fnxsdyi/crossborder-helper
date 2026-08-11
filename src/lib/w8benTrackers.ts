import db, { type W8BenTracker } from '@/db'

export type TrackerStatus = 'expired' | 'urgent' | 'soon' | 'ok'

/**
 * IRS rule: a W-8BEN signed in year Y is valid through 31 Dec of year Y+3,
 * unless a change in circumstances makes it invalid earlier.
 */
export function computeExpiry(submittedAt: Date): Date {
  return new Date(submittedAt.getFullYear() + 3, 11, 31)
}

/** Whole days from today until `date` (negative when already past). */
export function daysUntil(date: Date): number {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  return Math.round((startOfDay(date) - startOfDay(new Date())) / MS_PER_DAY)
}

export function trackerStatus(expiresAt: Date): TrackerStatus {
  const days = daysUntil(expiresAt)
  if (days < 0) return 'expired'
  if (days <= 30) return 'urgent'
  if (days <= 90) return 'soon'
  return 'ok'
}

export type TrackerInput = {
  platform: string
  country?: string
  submittedAt: Date
  expiresAt?: Date
  notes?: string
}

/** Trackers sorted by expiry, soonest first. */
export async function listTrackers(): Promise<W8BenTracker[]> {
  const all = await db.w8benTrackers.toArray()
  return all.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())
}

export async function addTracker(input: TrackerInput): Promise<number> {
  const now = new Date()
  const id = await db.w8benTrackers.add({
    platform: input.platform.trim(),
    country: input.country?.trim() || undefined,
    submittedAt: input.submittedAt,
    expiresAt: input.expiresAt ?? computeExpiry(input.submittedAt),
    notes: input.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  })
  return Number(id)
}

export async function updateTracker(id: number, input: TrackerInput): Promise<void> {
  await db.w8benTrackers.update(id, {
    platform: input.platform.trim(),
    country: input.country?.trim() || undefined,
    submittedAt: input.submittedAt,
    expiresAt: input.expiresAt ?? computeExpiry(input.submittedAt),
    notes: input.notes?.trim() || undefined,
    updatedAt: new Date(),
  })
}

export async function deleteTracker(id: number): Promise<void> {
  await db.w8benTrackers.delete(id)
}

export interface ReminderSummary {
  /** Total number of tracked forms. */
  total: number
  /** Signed year + 3 has passed — form no longer valid. */
  expired: number
  /** Expiring within the next 7 days (inclusive). */
  within7: number
  /** Expiring within the next 30 days (8–30). */
  within30: number
  /** Expiring within the next 60 days (31–60). */
  within60: number
  /** Expiring within the next 90 days (61–90). */
  within90: number
  /** expired + within7 + within30 + within60 + within90 — the actionable set. */
  needAttention: number
  /** Soonest-expiring form (null when none tracked). listTrackers already sorts ascending. */
  soonest: W8BenTracker | null
}

/**
 * Reminder snapshot for the W-8BEN expiry tracker. Windows:
 * expired (<0d), ≤7d, ≤30d, ≤60d, ≤90d; beyond 90d is "ok".
 * Pure Dexie read — safe to call on app open, no backend or email needed.
 */
export async function getReminders(): Promise<ReminderSummary> {
  const trackers = await listTrackers()
  const summary: ReminderSummary = {
    total: trackers.length,
    expired: 0,
    within7: 0,
    within30: 0,
    within60: 0,
    within90: 0,
    needAttention: 0,
    soonest: trackers[0] ?? null,
  }
  for (const tr of trackers) {
    const d = daysUntil(tr.expiresAt)
    if (d < 0) summary.expired++
    else if (d <= 7) summary.within7++
    else if (d <= 30) summary.within30++
    else if (d <= 60) summary.within60++
    else if (d <= 90) summary.within90++
  }
  summary.needAttention =
    summary.expired + summary.within7 + summary.within30 + summary.within60 + summary.within90
  return summary
}
