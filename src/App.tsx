import { useState, useEffect, Suspense, lazy } from 'react'
import { useAuthStore } from './stores/authStore'

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
        const entered = localStorage.getItem('app_entered')
        const guest = localStorage.getItem('is_guest')

        const currentUser = useAuthStore.getState().user

        if (currentUser && guest === 'true') {
          localStorage.removeItem('is_guest')
          setIsGuest(false)
          setShowLanding(false)
        } else if (entered === 'true') {
          setShowLanding(false)
          setIsGuest(guest === 'true')
        }
      }
    }
    init()
  }, [])

  function handleEnterApp() {
    localStorage.setItem('app_entered', 'true')
    localStorage.setItem('is_guest', 'true')
    setIsGuest(true)
    setShowLanding(false)
  }

  function handleBuyNow() {
    const token = Date.now().toString(36) + Math.random().toString(36).slice(2)
    localStorage.setItem('paypal_pending_token', JSON.stringify({
      token,
      timestamp: Date.now()
    }))
    const returnUrl = encodeURIComponent(window.location.origin + `/?token=${token}`)
    window.location.href = `https://www.paypal.com/ncp/payment/7CFGKT9FM3ER2?return=${returnUrl}`
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
          onBuyNow={handleBuyNow}
          onMemberLogin={() => setShowLanding(false)}
        />
      </Suspense>
    )
  }

  if (showRegister || (!user && !isGuest)) {
    return (
      <Suspense fallback={<Loading />}>
        <AuthPage onAuth={handleAuth} showWelcome={showRegister} />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<Loading />}>
      <Layout
        onSignOut={handleSignOut}
        isGuest={isGuest}
        onUpgrade={() => handleBuyNow()}
      />
    </Suspense>
  )
}

export default App
