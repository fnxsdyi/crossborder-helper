import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { isAdmin } from '@/lib/config'
import { checkSubscriptionWithFallback } from '@/lib/subscription'

export function usePremium() {
  const { user } = useAuthStore()
  const [isPremium, setIsPremium] = useState(false)

  const checkPremium = useCallback(async () => {
    if (!user) {
      setIsPremium(false)
      return
    }

    if (isAdmin(user.email)) {
      setIsPremium(true)
      return
    }

    const result = await checkSubscriptionWithFallback(user.id)
    setIsPremium(result.isPremium)
  }, [user])

  useEffect(() => {
    if (user) {
      checkPremium()
    }
  }, [user, checkPremium])

  return isPremium
}
