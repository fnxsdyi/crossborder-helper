import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAdd = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockToArray = vi.fn()
const mockGet = vi.fn()
const mockVersionsAdd = vi.fn()
const mockVersionsDelete = vi.fn()
const mockVersionsToArray = vi.fn()

vi.mock('@/db', () => ({
  default: {
    w8benTrackers: {
      add: (...args: unknown[]) => mockAdd(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
      toArray: () => mockToArray(),
      get: (...args: unknown[]) => mockGet(...args),
    },
    w8benVersions: {
      add: (...args: unknown[]) => mockVersionsAdd(...args),
      where: () => ({
        equals: () => ({
          delete: (...args: unknown[]) => mockVersionsDelete(...args),
          toArray: () => mockVersionsToArray(),
        }),
      }),
    },
  },
}))

import {
  computeExpiry,
  daysUntil,
  trackerStatus,
  listTrackers,
  addTracker,
  updateTracker,
  deleteTracker,
  renewTracker,
  getVersions,
  getReminders,
} from './w8benTrackers'

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

describe('computeExpiry', () => {
  it('expires on 31 Dec of the third year after signing', () => {
    const expiry = computeExpiry(new Date(2026, 6, 14))
    expect(expiry.getFullYear()).toBe(2029)
    expect(expiry.getMonth()).toBe(11)
    expect(expiry.getDate()).toBe(31)
  })

  it('ignores the day and month of the signing date', () => {
    const jan = computeExpiry(new Date(2026, 0, 1))
    const dec = computeExpiry(new Date(2026, 11, 31))
    expect(jan.getTime()).toBe(dec.getTime())
  })
})

describe('daysUntil', () => {
  it('returns 0 for today', () => {
    expect(daysUntil(new Date())).toBe(0)
  })

  it('returns a positive count for future dates', () => {
    expect(daysUntil(daysFromNow(10))).toBe(10)
  })

  it('returns a negative count for past dates', () => {
    expect(daysUntil(daysFromNow(-5))).toBe(-5)
  })
})

describe('trackerStatus', () => {
  it('flags past dates as expired', () => {
    expect(trackerStatus(daysFromNow(-1))).toBe('expired')
  })

  it('flags the next 30 days as urgent', () => {
    expect(trackerStatus(daysFromNow(30))).toBe('urgent')
  })

  it('flags 31-90 days as soon', () => {
    expect(trackerStatus(daysFromNow(31))).toBe('soon')
    expect(trackerStatus(daysFromNow(90))).toBe('soon')
  })

  it('flags anything beyond 90 days as ok', () => {
    expect(trackerStatus(daysFromNow(91))).toBe('ok')
  })
})

describe('CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAdd.mockResolvedValue(1)
    mockToArray.mockResolvedValue([])
    mockGet.mockResolvedValue({ id: 1, platform: 'X', submittedAt: new Date(2025, 0, 1), expiresAt: new Date(2028, 11, 31), renewalCount: undefined, country: undefined, notes: undefined })
    mockVersionsAdd.mockResolvedValue(1)
    mockVersionsToArray.mockResolvedValue([])
  })

  it('sorts trackers by expiry, soonest first', async () => {
    const late = { id: 1, platform: 'A', submittedAt: new Date(), expiresAt: new Date(2030, 11, 31), createdAt: new Date(), updatedAt: new Date() }
    const early = { id: 2, platform: 'B', submittedAt: new Date(), expiresAt: new Date(2027, 11, 31), createdAt: new Date(), updatedAt: new Date() }
    mockToArray.mockResolvedValue([late, early])

    const result = await listTrackers()
    expect(result.map(r => r.id)).toEqual([2, 1])
  })

  it('derives the expiry date when none is given', async () => {
    await addTracker({ platform: 'Upwork', submittedAt: new Date(2026, 2, 1) })
    expect(mockAdd.mock.calls[0][0].expiresAt).toEqual(new Date(2029, 11, 31))
  })

  it('keeps an explicit expiry date', async () => {
    const explicit = new Date(2028, 5, 30)
    await addTracker({ platform: 'Upwork', submittedAt: new Date(2026, 2, 1), expiresAt: explicit })
    expect(mockAdd.mock.calls[0][0].expiresAt).toBe(explicit)
  })

  it('trims text fields and drops empty optionals', async () => {
    await addTracker({ platform: '  Fiverr  ', country: '   ', notes: '  hi ', submittedAt: new Date(2026, 2, 1) })
    const saved = mockAdd.mock.calls[0][0]
    expect(saved.platform).toBe('Fiverr')
    expect(saved.country).toBeUndefined()
    expect(saved.notes).toBe('hi')
  })

  it('updates an existing tracker', async () => {
    await updateTracker(7, { platform: 'KDP', submittedAt: new Date(2026, 2, 1) })
    expect(mockUpdate).toHaveBeenCalledWith(7, expect.objectContaining({ platform: 'KDP' }))
  })

  it('deletes a tracker and cascades to its version history', async () => {
    await deleteTracker(7)
    expect(mockDelete).toHaveBeenCalledWith(7)
    expect(mockVersionsDelete).toHaveBeenCalled()
  })
})

describe('getReminders', () => {
  function tracker(id: number, daysToExpiry: number) {
    return {
      id,
      platform: `P${id}`,
      submittedAt: new Date(),
      expiresAt: daysFromNow(daysToExpiry),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  it('returns an empty summary when no trackers exist', async () => {
    mockToArray.mockResolvedValue([])
    const r = await getReminders()
    expect(r.total).toBe(0)
    expect(r.needAttention).toBe(0)
    expect(r.soonest).toBeNull()
  })

  it('buckets trackers into expired / 7 / 30 / 60 / 90-day windows', async () => {
    mockToArray.mockResolvedValue([
      tracker(1, -5), // expired
      tracker(2, 3), // within7
      tracker(3, 20), // within30
      tracker(4, 45), // within60
      tracker(5, 80), // within90
      tracker(6, 200), // ok
    ])
    const r = await getReminders()
    expect(r.total).toBe(6)
    expect(r.expired).toBe(1)
    expect(r.within7).toBe(1)
    expect(r.within30).toBe(1)
    expect(r.within60).toBe(1)
    expect(r.within90).toBe(1)
    expect(r.needAttention).toBe(5)
    // listTrackers sorts ascending by expiry, so the already-expired form (id 1) is soonest
    expect(r.soonest?.id).toBe(1)
  })

  it('treats the exactly-90-day boundary as still needing attention', async () => {
    mockToArray.mockResolvedValue([tracker(1, 90)])
    const r = await getReminders()
    expect(r.within90).toBe(1)
    expect(r.needAttention).toBe(1)
  })
})

describe('renewTracker + getVersions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ id: 1, platform: 'Upwork', submittedAt: new Date(2020, 5, 1), expiresAt: new Date(2023, 11, 31), renewalCount: undefined, country: 'US', notes: 'a' })
    mockVersionsAdd.mockResolvedValue(1)
    mockVersionsToArray.mockResolvedValue([])
  })

  it('renewal resets signing date, recomputes 3-year expiry, and bumps the counter', async () => {
    await renewTracker(1)
    expect(mockUpdate).toHaveBeenCalledWith(1, expect.objectContaining({ renewalCount: 1 }))
    const saved = mockUpdate.mock.calls[0][1] as { submittedAt: Date; expiresAt: Date }
    expect(saved.submittedAt instanceof Date).toBe(true)
    expect(saved.expiresAt.getFullYear()).toBe(new Date().getFullYear() + 3)
    expect(saved.expiresAt.getMonth()).toBe(11)
    expect(saved.expiresAt.getDate()).toBe(31)
    expect(mockVersionsAdd).toHaveBeenCalledTimes(1)
  })

  it('increments an existing renewal count', async () => {
    mockGet.mockResolvedValue({ id: 1, platform: 'Upwork', submittedAt: new Date(2020, 5, 1), expiresAt: new Date(2023, 11, 31), renewalCount: 2, country: 'US', notes: 'a' })
    await renewTracker(1)
    expect((mockUpdate.mock.calls[0][1] as { renewalCount: number }).renewalCount).toBe(3)
  })

  it('throws when the tracker does not exist', async () => {
    mockGet.mockResolvedValue(undefined)
    await expect(renewTracker(99)).rejects.toThrow()
  })

  it('returns version history newest-first', async () => {
    mockVersionsToArray.mockResolvedValue([
      { id: 1, trackerId: 1, op: 'create', changedAt: new Date(2024, 0, 1) },
      { id: 2, trackerId: 1, op: 'renew', changedAt: new Date(2025, 0, 1) },
    ])
    const versions = await getVersions(1)
    expect(versions.map(v => v.id)).toEqual([2, 1])
  })
})
