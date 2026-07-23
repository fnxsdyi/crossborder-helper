import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ThemeProvider } from './components/ThemeProvider'

// Suppress React 19 insertBefore bug (known issue in concurrent mode)
window.addEventListener('error', (e) => {
  if (e.message?.includes('insertBefore') && e.filename?.includes('vendor-react')) {
    e.preventDefault()
    return false
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
