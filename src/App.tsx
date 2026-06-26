import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { LandingPage } from './pages/LandingPage'
import { AuthPage } from './pages/AuthPage'
import { useAuthStore } from './stores/authStore'

function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const { user, loading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
    const entered = localStorage.getItem('app_entered')
    const guest = localStorage.getItem('is_guest')
    if (entered === 'true') {
      setShowLanding(false)
      setIsGuest(guest === 'true')
    }
  }, [])

  function handleEnterApp() {
    localStorage.setItem('app_entered', 'true')
    localStorage.setItem('is_guest', 'true')
    setIsGuest(true)
    setShowLanding(false)
  }

  function handleBuyNow() {
    window.open('https://www.paypal.com/ncp/payment/7CFGKT9FM3ER2', '_blank')
  }

  function handleAuth() {
    localStorage.setItem('app_entered', 'true')
    localStorage.removeItem('is_guest')
    setIsGuest(false)
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
      <LandingPage
        onEnterApp={handleEnterApp}
        onBuyNow={handleBuyNow}
      />
    )
  }

  if (!user && !isGuest) {
    return <AuthPage onAuth={handleAuth} />
  }

  return (
    <Layout
      onSignOut={handleSignOut}
      isGuest={isGuest}
      onUpgrade={() => handleBuyNow()}
    />
  )
}

export default App
