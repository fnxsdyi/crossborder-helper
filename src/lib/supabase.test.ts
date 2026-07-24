import { describe, it, expect, vi } from 'vitest'

const mockCreateClient = vi.fn().mockReturnValue({
  from: vi.fn(),
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

describe('supabase', () => {
  it('exports a supabase client', async () => {
    const { supabase } = await import('./supabase')
    expect(supabase).toBeDefined()
  })

  it('supabase client has from method', async () => {
    const { supabase } = await import('./supabase')
    expect(typeof supabase.from).toBe('function')
  })
})
