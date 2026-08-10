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
