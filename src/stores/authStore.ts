import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/config'
import { checkSubscriptionWithFallback } from '@/lib/subscription'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  isGuest: boolean
  hasEntered: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  checkPremium: () => Promise<boolean>
  initialize: () => Promise<void>
  enterAsGuest: () => void
  enterAsUser: () => void
  resetToLanding: () => void
}

let initialized = false

function clearGuestStorage() {
  localStorage.removeItem('app_entered')
  localStorage.removeItem('is_guest')
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  isGuest: false,
  hasEntered: false,

  initialize: async () => {
    if (initialized) return
    initialized = true

    // Register listener FIRST so we don't miss events
    supabase.auth.onAuthStateChange((event, session) => {
      const current = get()
      if (event === 'SIGNED_OUT' || (!session && current.user)) {
        // Session expired or signed out — reset to landing
        clearGuestStorage()
        set({ user: null, isGuest: false, hasEntered: false })
      } else if (session?.user) {
        // Promote guest to authenticated if they have a session
        if (current.isGuest) {
          clearGuestStorage()
          set({ user: session.user, isGuest: false })
        } else {
          set({ user: session.user })
        }
      }
    })

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('[TaxFlow] Supabase session error:', error.message)
      }

      const user = session?.user || null

      // Restore app state from localStorage
      const entered = localStorage.getItem('app_entered') === 'true'
      const guest = localStorage.getItem('is_guest') === 'true'

      if (user && guest) {
        // Had a session while marked as guest — promote
        clearGuestStorage()
        set({ user, loading: false, isGuest: false, hasEntered: true })
      } else if (user) {
        set({ user, loading: false, hasEntered: entered })
      } else if (entered) {
        // No session but was in-app — treat as guest
        set({ loading: false, isGuest: true, hasEntered: true })
      } else {
        set({ loading: false })
      }
    } catch (err) {
      console.error('[TaxFlow] Failed to initialize auth:', err)
      set({ user: null, loading: false })
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      // Set user directly — don't wait for onAuthStateChange
      if (data.user) {
        clearGuestStorage()
        set({ user: data.user, isGuest: false, hasEntered: true })
      }
      return {}
    } catch (err) {
      console.error('[TaxFlow] Sign in failed:', err)
      return { error: 'Connection failed. Please check your network.' }
    }
  },

  signUp: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return { error: error.message }

      if (data.user) {
        if (isAdmin(email)) {
          await supabase.from('licenses').insert({
            user_id: data.user.id,
            key: `ADMIN-${data.user.id}`,
            active: true
          })
        }
        // Set user directly
        clearGuestStorage()
        set({ user: data.user, isGuest: false, hasEntered: true })
      }

      return {}
    } catch (err) {
      console.error('[TaxFlow] Sign up failed:', err)
      return { error: 'Connection failed. Please check your network.' }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    clearGuestStorage()
    set({ user: null, isGuest: false, hasEntered: false })
  },

  enterAsGuest: () => {
    localStorage.setItem('app_entered', 'true')
    localStorage.setItem('is_guest', 'true')
    set({ isGuest: true, hasEntered: true })
  },

  enterAsUser: () => {
    localStorage.setItem('app_entered', 'true')
    localStorage.removeItem('is_guest')
    set({ isGuest: false, hasEntered: true })
  },

  resetToLanding: () => {
    clearGuestStorage()
    set({ isGuest: false, hasEntered: false })
  },

  checkPremium: async () => {
    const { user } = get()
    if (!user) return false

    if (isAdmin(user.email)) {
      return true
    }

    const result = await checkSubscriptionWithFallback(user.id)
    return result.isPremium
  },
}))
