import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isSubscriptionActive, checkSubscription, checkSubscriptionWithFallback } from './subscription'
import type { Subscription } from './subscription'

// Mock supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}))

describe('isSubscriptionActive', () => {
  const baseSub: Subscription = {
    id: '1',
    user_id: 'user1',
    paypal_subscription_id: 'P-123',
    plan_type: 'monthly',
    status: 'active',
    current_period_start: null,
    current_period_end: null,
    cancel_at_period_end: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  }

  it('returns true for active subscription without end date', () => {
    expect(isSubscriptionActive({ ...baseSub, status: 'active' })).toBe(true)
  })

  it('returns true for active subscription with future end date', () => {
    const future = new Date()
    future.setMonth(future.getMonth() + 1)
    expect(isSubscriptionActive({
      ...baseSub,
      status: 'active',
      current_period_end: future.toISOString(),
    })).toBe(true)
  })

  it('returns false for active subscription with past end date', () => {
    const past = new Date()
    past.setMonth(past.getMonth() - 1)
    expect(isSubscriptionActive({
      ...baseSub,
      status: 'active',
      current_period_end: past.toISOString(),
    })).toBe(false)
  })

  it('returns true for canceled subscription with future end date', () => {
    const future = new Date()
    future.setMonth(future.getMonth() + 1)
    expect(isSubscriptionActive({
      ...baseSub,
      status: 'canceled',
      current_period_end: future.toISOString(),
    })).toBe(true)
  })

  it('returns false for canceled subscription with past end date', () => {
    const past = new Date()
    past.setMonth(past.getMonth() - 1)
    expect(isSubscriptionActive({
      ...baseSub,
      status: 'canceled',
      current_period_end: past.toISOString(),
    })).toBe(false)
  })

  it('returns false for canceled subscription without end date', () => {
    expect(isSubscriptionActive({ ...baseSub, status: 'canceled' })).toBe(false)
  })

  it('returns true for past_due subscription (grace period)', () => {
    expect(isSubscriptionActive({ ...baseSub, status: 'past_due' })).toBe(true)
  })

  it('returns false for expired subscription', () => {
    expect(isSubscriptionActive({ ...baseSub, status: 'expired' })).toBe(false)
  })

  it('returns false for pending subscription', () => {
    expect(isSubscriptionActive({ ...baseSub, status: 'pending' })).toBe(false)
  })
})

describe('checkSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns non-premium when no subscription found', async () => {
    const result = await checkSubscription('user1')
    expect(result.isPremium).toBe(false)
    expect(result.planType).toBeNull()
    expect(result.expiresAt).toBeNull()
    expect(result.subscription).toBeNull()
  })

  it('returns non-premium when error occurs', async () => {
    const mockSupabase = await import('./supabase')
    vi.mocked(mockSupabase.supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    } as any)

    const result = await checkSubscription('user1')
    expect(result.isPremium).toBe(false)
  })

  it('returns premium for active subscription', async () => {
    const future = new Date()
    future.setMonth(future.getMonth() + 1)

    const mockSupabase = await import('./supabase')
    vi.mocked(mockSupabase.supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: '1',
          user_id: 'user1',
          paypal_subscription_id: 'P-123',
          plan_type: 'monthly',
          status: 'active',
          current_period_end: future.toISOString(),
        },
        error: null,
      }),
    } as any)

    const result = await checkSubscription('user1')
    expect(result.isPremium).toBe(true)
    expect(result.planType).toBe('monthly')
  })

  it('catches and logs errors', async () => {
    const mockSupabase = await import('./supabase')
    vi.mocked(mockSupabase.supabase.from).mockImplementation(() => {
      throw new Error('Network error')
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await checkSubscription('user1')
    expect(result.isPremium).toBe(false)
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })
})

describe('checkSubscriptionWithFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns early when subscription is active', async () => {
    const future = new Date()
    future.setMonth(future.getMonth() + 1)

    const mockSupabase = await import('./supabase')
    vi.mocked(mockSupabase.supabase.from).mockImplementation((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: '1',
              user_id: 'user1',
              paypal_subscription_id: 'P-123',
              plan_type: 'monthly',
              status: 'active',
              current_period_end: future.toISOString(),
            },
            error: null,
          }),
        } as any
      }
      return {} as any
    })

    const result = await checkSubscriptionWithFallback('user1')
    expect(result.isPremium).toBe(true)
    expect(result.planType).toBe('monthly')
  })

  it('returns lifetime plan from licenses table', async () => {
    const mockSupabase = await import('./supabase')

    vi.mocked(mockSupabase.supabase.from).mockImplementation((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any
      }
      if (table === 'licenses') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
        } as any
      }
      return {} as any
    })

    const result = await checkSubscriptionWithFallback('user1')
    expect(result.isPremium).toBe(true)
    expect(result.planType).toBe('lifetime')
  })

  it('returns non-premium when no license found', async () => {
    const mockSupabase = await import('./supabase')

    vi.mocked(mockSupabase.supabase.from).mockImplementation((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any
      }
      if (table === 'licenses') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any
      }
      return {} as any
    })

    const result = await checkSubscriptionWithFallback('user1')
    expect(result.isPremium).toBe(false)
    expect(result.planType).toBeNull()
  })

  it('catches and logs license check errors', async () => {
    const mockSupabase = await import('./supabase')
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.mocked(mockSupabase.supabase.from).mockImplementation((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any
      }
      if (table === 'licenses') {
        throw new Error('DB connection failed')
      }
      return {} as any
    })

    const result = await checkSubscriptionWithFallback('user1')
    expect(result.isPremium).toBe(false)
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })
})
