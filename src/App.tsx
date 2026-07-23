import { useState, useEffect, Suspense, lazy } from 'react'
import { useAuthStore } from './stores/authStore'
import { CookieConsent } from './components/CookieConsent'

const Layout = lazy(() => import('./components/Layout').then(m => ({ default: m.Layout })))
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })))

function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

const KNOWN_ROUTES = ['/', '/login', '/register', '/pricing', '/terms']

function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [notFound, setNotFound] = useState(false)
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
        } catch {}
        window.history.replaceState({}, '', window.location.pathname)
      } else {
        const path = window.location.pathname
        if (path === '/login' || path === '/register') {
          setShowLanding(false)
          if (path === '/register') setIsRegister(true)
        } else if (path === '/pricing' || path === '/terms') {
          setShowLanding(false)
        } else if (!KNOWN_ROUTES.includes(path)) {
          setNotFound(true)
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
  }, [initialize])

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
    useAuthStore.getState().signOut()
    setIsGuest(false)
    setHasEntered(false)
    setShowLanding(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (notFound) {
    return (
      <Suspense fallback={<Loading />}>
        <NotFoundPage />
      </Suspense>
    )
  }

  if (window.location.pathname === '/terms') {
    return (
      <Suspense fallback={<Loading />}>
        <TermsPage />
      </Suspense>
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
    <>
      <Suspense fallback={<Loading />}>
        <Layout onSignOut={handleSignOut} isGuest={isGuest} />
      </Suspense>
      <CookieConsent />
    </>
  )
}

export default App
