import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/config'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  checkPremium: () => Promise<boolean>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ user: session?.user || null, loading: false })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user || null })
    })
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }

    if (data.user) {
      const pendingData = localStorage.getItem('paypal_pending_token')
      if (pendingData) {
        try {
          const { token, timestamp } = JSON.parse(pendingData)
          const thirtyMinutes = 30 * 60 * 1000
          if ((Date.now() - timestamp) < thirtyMinutes) {
            await supabase.from('licenses').insert({
              user_id: data.user.id,
              key: `PAYPAL-${token}`,
              active: true
            })
          }
        } catch (e) {}
      }

      if (isAdmin(email)) {
        await supabase.from('licenses').insert({
          user_id: data.user.id,
          key: `ADMIN-${data.user.id}`,
          active: true
        })
      }
    }

    return {}
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },

  checkPremium: async () => {
    const { user } = get()
    if (!user) return false

    if (isAdmin(user.email)) {
      return true
    }

    try {
      const { data } = await supabase
        .from('licenses')
        .select('id')
        .eq('user_id', user.id)
        .eq('active', true)
        .single()

      return !!data
    } catch (err) {
      console.error('Failed to check premium status:', err)
      return false
    }
  },
}))
