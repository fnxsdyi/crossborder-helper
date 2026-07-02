import { useState, useEffect, Suspense, lazy } from 'react'
import { useAuthStore } from './stores/authStore'
import { CookieConsent } from './components/CookieConsent'
import { PRO_MONTHLY_PLAN_ID, PRO_ANNUAL_PLAN_ID } from '@/lib/config'

const Layout = lazy(() => import('./components/Layout').then(m => ({ default: m.Layout })))
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })))

function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const { user, loading, initialize } = useAuthStore()

  useEffect(() => {
    async function init() {
      await initialize()

      const params = new URLSearchParams(window.location.search)
      const registerToken = params.get('token')
      const pendingData = localStorage.getItem('paypal_pending_token')

      if (registerToken && pendingData) {
        try {
          const { token, timestamp } = JSON.parse(pendingData)
          const thirtyMinutes = 30 * 60 * 1000
          const isValid = token === registerToken && (Date.now() - timestamp) < thirtyMinutes

          if (isValid) {
            localStorage.removeItem('paypal_pending_token')
            setShowLanding(false)
            setShowRegister(true)
          }
        } catch (e) {}
        window.history.replaceState({}, '', window.location.pathname)
      } else {
        // Handle URL-based routing for key pages
        const path = window.location.pathname
        if (path === '/login' || path === '/register') {
          setShowLanding(false)
          if (path === '/register') setIsRegister(true)
        } else if (path === '/pricing') {
          setShowLanding(false)
        } else {
          const entered = localStorage.getItem('app_entered')
          const guest = localStorage.getItem('is_guest')
          const currentUser = useAuthStore.getState().user

          if (currentUser && guest === 'true') {
            localStorage.removeItem('is_guest')
            setIsGuest(false)
            setHasEntered(true)
            setShowLanding(false)
          } else if (entered === 'true') {
            setHasEntered(true)
            setShowLanding(false)
            setIsGuest(guest === 'true')
          }
        }
      }
    }
    init()
  }, [])

  function handleEnterApp() {
    const currentUser = useAuthStore.getState().user
    localStorage.setItem('app_entered', 'true')
    setHasEntered(true)
    if (currentUser) {
      localStorage.removeItem('is_guest')
      setIsGuest(false)
    } else {
      localStorage.setItem('is_guest', 'true')
      setIsGuest(true)
    }
    setShowLanding(false)
  }

  function handleBuyNow(plan: 'monthly' | 'annual' = 'monthly') {
    console.log('[TaxFlow] handleBuyNow called, plan:', plan)
    const token = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const planId = plan === 'annual' ? PRO_ANNUAL_PLAN_ID : PRO_MONTHLY_PLAN_ID
    console.log('[TaxFlow] planId:', planId)
    localStorage.setItem('paypal_pending_token', JSON.stringify({
      token,
      timestamp: Date.now(),
      planType: plan,
      planId
    }))
    const returnUrl = encodeURIComponent(window.location.origin + `/?token=${token}&plan=${plan}`)
    const url = `https://www.paypal.com/ncp/payment/${planId}?return=${returnUrl}`
    console.log('[TaxFlow] redirecting to:', url)
    window.location.href = url
  }

  function handleAuth() {
    localStorage.setItem('app_entered', 'true')
    localStorage.removeItem('is_guest')
    setIsGuest(false)
    setShowRegister(false)
    setShowLanding(false)
  }

  function handleSignOut() {
    localStorage.removeItem('app_entered')
    localStorage.removeItem('is_guest')
    setIsGuest(false)
    setShowLanding(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (showLanding) {
    return (
      <Suspense fallback={<Loading />}>
        <LandingPage
          onEnterApp={handleEnterApp}
          onMemberLogin={() => {
            setHasEntered(true)
            if (user) {
              localStorage.setItem('app_entered', 'true')
              localStorage.removeItem('is_guest')
              setIsGuest(false)
            }
            setShowLanding(false)
          }}
        />
      </Suspense>
    )
  }

  if (showRegister || (!user && !isGuest && !hasEntered)) {
    return (
      <Suspense fallback={<Loading />}>
        <AuthPage onAuth={handleAuth} showWelcome={showRegister || isRegister} />
      </Suspense>
    )
  }

    return (
      <Suspense fallback={<Loading />}>
        <Layout
          onSignOut={handleSignOut}
          isGuest={isGuest}
          onUpgrade={(plan?: 'monthly' | 'annual') => handleBuyNow(plan)}
        />
        <CookieConsent />
      </Suspense>
    )
}

export default App
