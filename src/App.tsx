import { useState, useEffect, Suspense, lazy } from 'react'
import { useAuthStore } from './stores/authStore'
import { CookieConsent } from './components/CookieConsent'

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
  const [showRegister, setShowRegister] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const { user, loading, initialize, enterAsGuest, enterAsUser, signOut } = useAuthStore()

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
        const path = window.location.pathname
        if (path === '/login' || path === '/register') {
          setShowLanding(false)
          setShowRegister(true)
          if (path === '/register') setIsRegister(true)
        } else if (path === '/pricing') {
          setShowLanding(false)
        } else {
          const { isGuest: guest, user: currentUser } = useAuthStore.getState()
          if (currentUser && guest) {
            setIsGuest(false)
            setShowLanding(false)
          } else if (useAuthStore.getState().hasEntered) {
            setIsGuest(guest)
            setShowLanding(false)
          }
        }
      }
    }
    init()
  }, [])

  function handleEnterApp() {
    const currentUser = useAuthStore.getState().user
    if (currentUser) {
      enterAsUser()
    } else {
      enterAsGuest()
    }
    localStorage.setItem('app_entered', 'true')
    if (currentUser) {
      setIsGuest(false)
    } else {
      localStorage.setItem('is_guest', 'true')
      setIsGuest(true)
    }
    setShowLanding(false)
  }

  function handleSignOut() {
    signOut()
    setIsGuest(false)
    setShowRegister(false)
    setShowLanding(true)
  }

  if (loading) {
    return <Loading />
  }

  if (showRegister) {
    return (
      <Suspense fallback={<Loading />}>
        <AuthPage
          onAuth={() => {
            setShowRegister(false)
            setShowLanding(false)
          }}
          showWelcome={showRegister || isRegister}
        />
      </Suspense>
    )
  }

  if (showLanding) {
    return (
      <Suspense fallback={<Loading />}>
        <LandingPage
          onEnterApp={handleEnterApp}
          onMemberLogin={() => {
            if (user) {
              enterAsUser()
              setIsGuest(false)
              setShowLanding(false)
            } else {
              setShowLanding(false)
              setShowRegister(true)
            }
          }}
        />
      </Suspense>
    )
  }

  if (!user && !isGuest) {
    return (
      <Suspense fallback={<Loading />}>
        <AuthPage onAuth={() => setShowRegister(false)} showWelcome={false} />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<Loading />}>
      <Layout onSignOut={handleSignOut} isGuest={isGuest} />
      <CookieConsent />
    </Suspense>
  )
}

export default App
