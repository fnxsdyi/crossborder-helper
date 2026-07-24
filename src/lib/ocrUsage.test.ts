import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mocks before importing the module
const mockFrom = vi.fn()
const mockCheckSubscription = vi.fn()
const mockIsAdmin = vi.fn()

vi.mock('./supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

vi.mock('./subscription', () => ({
  checkSubscription: (...args: unknown[]) => mockCheckSubscription(...args),
}))

vi.mock('./config', () => ({
  isAdmin: (...args: unknown[]) => mockIsAdmin(...args),
}))

// Import after mocks are set up
import { checkOcrUsage, recordOcrUsage, simpleHash } from './ocrUsage'

describe('checkOcrUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAdmin.mockReturnValue(false)
    mockCheckSubscription.mockResolvedValue({ isPremium: false })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    })
  })

  it('returns unlimited for admin users', async () => {
    mockIsAdmin.mockReturnValue(true)

    const result = await checkOcrUsage('user1', 'admin@test.com')
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(Infinity)
  })

  it('returns unlimited for premium users', async () => {
    mockCheckSubscription.mockResolvedValue({ isPremium: true } as any)

    const result = await checkOcrUsage('user1')
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(Infinity)
  })

  it('returns allowed when under free limit', async () => {
    mockCheckSubscription.mockResolvedValue({ isPremium: false } as any)

    const result = await checkOcrUsage('user1')
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(3)
    expect(result.hasSubscription).toBe(false)
  })
})

describe('recordOcrUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('records usage to supabase', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({
      insert: mockInsert,
    })

    await recordOcrUsage('user1', 'hash123')
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user1',
      image_hash: 'hash123',
    })
  })
})

describe('simpleHash', () => {
  it('generates consistent hash', async () => {
    const hash1 = await simpleHash('test')
    const hash2 = await simpleHash('test')
    expect(hash1).toBe(hash2)
  })

  it('generates different hashes for different inputs', async () => {
    const hash1 = await simpleHash('test1')
    const hash2 = await simpleHash('test2')
    expect(hash1).not.toBe(hash2)
  })

  it('returns hex string', async () => {
    const hash = await simpleHash('test')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })
})
