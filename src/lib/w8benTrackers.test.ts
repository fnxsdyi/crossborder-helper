import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAdd = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockToArray = vi.fn()

vi.mock('@/db', () => ({
  default: {
    w8benTrackers: {
      add: (...args: unknown[]) => mockAdd(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
      toArray: () => mockToArray(),
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

  it('deletes a tracker', async () => {
    await deleteTracker(7)
    expect(mockDelete).toHaveBeenCalledWith(7)
  })
})
