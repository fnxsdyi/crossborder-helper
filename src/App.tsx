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
  const [showRegister, setShowRegister] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const { user, loading, isGuest, showLanding, initialize, enterAsGuest, enterAsUser, signOut } = useAuthStore()

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
            useAuthStore.setState({ showLanding: false })
            setShowRegister(true)
          }
        } catch (e) {}
        window.history.replaceState({}, '', window.location.pathname)
      } else {
        const path = window.location.pathname
        if (path === '/login' || path === '/register') {
          useAuthStore.setState({ showLanding: false })
          setShowRegister(true)
          if (path === '/register') setIsRegister(true)
        } else if (path === '/pricing') {
          useAuthStore.setState({ showLanding: false })
        }
        // Otherwise authStore state determines showLanding
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
  }

  function handleSignOut() {
    signOut()
    setShowRegister(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show register/login page
  if (showRegister) {
    return (
      <Suspense fallback={<Loading />}>
        <AuthPage
          onAuth={() => {
            setShowRegister(false)
            useAuthStore.setState({ showLanding: false })
          }}
          showWelcome={showRegister || isRegister}
        />
      </Suspense>
    )
  }

  // Show landing page
  if (showLanding) {
    return (
      <Suspense fallback={<Loading />}>
        <LandingPage
          onEnterApp={handleEnterApp}
          onMemberLogin={() => {
            if (user) {
              enterAsUser()
            } else {
              useAuthStore.setState({ showLanding: false })
              setShowRegister(true)
            }
          }}
        />
      </Suspense>
    )
  }

  // Auth guard: must have user OR be guest
  if (!user && !isGuest) {
    return (
      <Suspense fallback={<Loading />}>
        <AuthPage onAuth={() => setShowRegister(false)} showWelcome={false} />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<Loading />}>
      <Layout
        onSignOut={handleSignOut}
        isGuest={isGuest}
      />
      <CookieConsent />
    </Suspense>
  )
}

export default App
