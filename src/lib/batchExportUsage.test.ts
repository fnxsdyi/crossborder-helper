import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkBatchExportUsage, recordBatchExportUsage } from './batchExportUsage'

// Mock supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}))

// Mock subscription
vi.mock('./subscription', () => ({
  checkSubscription: vi.fn().mockResolvedValue({ isPremium: false }),
}))

// Mock config
const mockIsAdmin = vi.fn().mockReturnValue(false)
vi.mock('./config', () => ({
  isAdmin: (...args: unknown[]) => mockIsAdmin(...args),
}))

describe('checkBatchExportUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAdmin.mockReturnValue(false)
    localStorage.clear()
  })

  it('returns unlimited for admin users', async () => {
    mockIsAdmin.mockReturnValue(true)

    const result = await checkBatchExportUsage(undefined, 'admin@test.com')
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(Infinity)
  })

  it('returns unlimited for premium users', async () => {
    const { checkSubscription } = await import('./subscription')
    vi.mocked(checkSubscription).mockResolvedValue({ isPremium: true } as any)

    const result = await checkBatchExportUsage('user1')
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(Infinity)
  })

  it('tracks guest usage in localStorage', async () => {
    const result = await checkBatchExportUsage()
    expect(result.used).toBe(0)
    expect(result.limit).toBe(5)
  })

  it('returns allowed when under free limit for users', async () => {
    const { checkSubscription } = await import('./subscription')
    vi.mocked(checkSubscription).mockResolvedValue({ isPremium: false } as any)

    const mockSupabase = await import('./supabase')
    vi.mocked(mockSupabase.supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
    } as any)

    const result = await checkBatchExportUsage('user1')
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(5)
  })

  it('logs warning when query fails', async () => {
    const { checkSubscription } = await import('./subscription')
    vi.mocked(checkSubscription).mockResolvedValue({ isPremium: false } as any)

    const mockSupabase = await import('./supabase')
    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockReturnThis()
    const mockGte = vi.fn().mockResolvedValue({ count: null, error: { message: 'DB error' } })

    vi.mocked(mockSupabase.supabase.from).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      gte: mockGte,
    } as any)

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await checkBatchExportUsage('user1')
    expect(result).toBeDefined()
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('catches and logs errors', async () => {
    const { checkSubscription } = await import('./subscription')
    vi.mocked(checkSubscription).mockRejectedValue(new Error('Unexpected error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await checkBatchExportUsage('user1')
    expect(result.allowed).toBe(true)
    expect(result.used).toBe(0)
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('handles localStorage parse error for guest', async () => {
    localStorage.setItem('batch_export_usage', 'invalid json')

    const result = await checkBatchExportUsage()
    expect(result.used).toBe(0)
    expect(result.limit).toBe(5)
  })
})

describe('recordBatchExportUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('increments guest usage count', async () => {
    await recordBatchExportUsage()
    const stored = JSON.parse(localStorage.getItem('batch_export_usage') || '{}')
    expect(stored.count).toBe(1)
  })

  it('increments multiple times', async () => {
    await recordBatchExportUsage()
    await recordBatchExportUsage()
    await recordBatchExportUsage()
    const stored = JSON.parse(localStorage.getItem('batch_export_usage') || '{}')
    expect(stored.count).toBe(3)
  })

  it('resets count when month changes', async () => {
    // Set usage from previous month
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    localStorage.setItem('batch_export_usage', JSON.stringify({
      year: lastMonth.getFullYear(),
      month: lastMonth.getMonth() + 1,
      count: 10,
    }))

    await recordBatchExportUsage()
    const stored = JSON.parse(localStorage.getItem('batch_export_usage') || '{}')
    expect(stored.count).toBe(1)
  })

  it('records usage to supabase for logged-in users', async () => {
    const mockSupabase = await import('./supabase')
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(mockSupabase.supabase.from).mockReturnValue({
      insert: mockInsert,
    } as any)

    await recordBatchExportUsage('user1')
    expect(mockInsert).toHaveBeenCalled()
  })

  it('catches and logs errors for logged-in users', async () => {
    const mockSupabase = await import('./supabase')
    vi.mocked(mockSupabase.supabase.from).mockRejectedValue(new Error('DB error'))

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await recordBatchExportUsage('user1')

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
