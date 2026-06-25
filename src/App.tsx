import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { LandingPage } from './pages/LandingPage'

function App() {
  const [showLanding, setShowLanding] = useState(true)

  useEffect(() => {
    const entered = localStorage.getItem('app_entered')
    if (entered === 'true') {
      setShowLanding(false)
    }
  }, [])

  function handleEnterApp() {
    localStorage.setItem('app_entered', 'true')
    setShowLanding(false)
  }

  if (showLanding) {
    return <LandingPage onEnterApp={handleEnterApp} />
  }

  return <Layout />
}

export default App
