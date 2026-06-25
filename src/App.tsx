import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { LandingPage } from './pages/LandingPage'
import { AuthPage } from './pages/AuthPage'
import { useAuthStore } from './stores/authStore'

function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const { user, loading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
    const entered = localStorage.getItem('app_entered')
    if (entered === 'true') {
      setShowLanding(false)
    }
  }, [])

  function handleEnterApp() {
    if (user) {
      localStorage.setItem('app_entered', 'true')
      setShowLanding(false)
    } else {
      setShowAuth(true)
    }
  }

  function handleAuth() {
    localStorage.setItem('app_entered', 'true')
    setShowLanding(false)
    setShowAuth(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (showLanding && !showAuth) {
    return <LandingPage onEnterApp={handleEnterApp} />
  }

  if (showAuth && !user) {
    return <AuthPage onAuth={handleAuth} />
  }

  return <Layout />
}

export default App
