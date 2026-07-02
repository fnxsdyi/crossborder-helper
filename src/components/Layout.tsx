import { Suspense, lazy, Component, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Disclaimer } from './Disclaimer'
import { GuestBanner } from './GuestBanner'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'

const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Invoices = lazy(() => import('@/pages/Invoices').then(m => ({ default: m.Invoices })))
const Clients = lazy(() => import('@/pages/Clients').then(m => ({ default: m.Clients })))
const TaxWizard = lazy(() => import('@/pages/TaxWizard').then(m => ({ default: m.TaxWizard })))
const CurrencyDashboard = lazy(() => import('@/pages/CurrencyDashboard').then(m => ({ default: m.CurrencyDashboard })))
const SettingsPage = lazy(() => import('@/pages/Settings').then(m => ({ default: m.SettingsPage })))
const OcrPage = lazy(() => import('@/pages/OcrPage').then(m => ({ default: m.OcrPage })))

class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

interface LayoutProps {
  onSignOut?: () => void
  isGuest?: boolean
  onUpgrade?: () => void
}

export function Layout({ onSignOut, isGuest, onUpgrade }: LayoutProps) {
  const { currentView } = useAppStore()
  const { user } = useAuthStore()

  const renderPage = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'invoices':
        return <Invoices />
      case 'ocr':
        if (!user) {
          return (
            <div className="text-center py-20">
              <p className="text-slate-500 dark:text-slate-400 mb-4">Please sign in to use OCR scanning.</p>
              <button
                onClick={onUpgrade}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            </div>
          )
        }
        return <OcrPage />
      case 'clients':
        return <Clients />
      case 'currency':
        return <CurrencyDashboard />
      case 'tax':
        return <TaxWizard />
      case 'settings':
        return <SettingsPage onUpgrade={onUpgrade} isGuest={isGuest} />
      case 'contract':
        window.open('https://shield.kaki.llc', '_blank', 'noopener,noreferrer')
        setTimeout(() => useAppStore.setState({ currentView: 'dashboard' }), 0)
        return <Dashboard />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar onSignOut={onSignOut} isGuest={isGuest} />
      <main className="lg:ml-64">
        <div className="p-6 lg:p-8">
          {isGuest && <GuestBanner onUpgrade={onUpgrade} />}
          <ErrorBoundary fallback={<div className="p-4 text-red-500">Something went wrong. Please refresh.</div>}>
            <Suspense fallback={<PageLoader />}>
              {renderPage()}
            </Suspense>
          </ErrorBoundary>
          <Disclaimer />
        </div>
      </main>
    </div>
  )
}
