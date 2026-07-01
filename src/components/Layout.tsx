import { Suspense, lazy } from 'react'
import { Sidebar } from './Sidebar'
import { Disclaimer } from './Disclaimer'
import { GuestBanner } from './GuestBanner'
import { useAppStore } from '@/stores/appStore'

const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Invoices = lazy(() => import('@/pages/Invoices').then(m => ({ default: m.Invoices })))
const Clients = lazy(() => import('@/pages/Clients').then(m => ({ default: m.Clients })))
const TaxWizard = lazy(() => import('@/pages/TaxWizard').then(m => ({ default: m.TaxWizard })))
const CurrencyDashboard = lazy(() => import('@/pages/CurrencyDashboard').then(m => ({ default: m.CurrencyDashboard })))
const SettingsPage = lazy(() => import('@/pages/Settings').then(m => ({ default: m.SettingsPage })))
const OcrPage = lazy(() => import('@/pages/OcrPage').then(m => ({ default: m.OcrPage })))

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

  const renderPage = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'invoices':
        return <Invoices />
      case 'ocr':
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
          <Suspense fallback={<PageLoader />}>
            {renderPage()}
          </Suspense>
          <Disclaimer />
        </div>
      </main>
    </div>
  )
}
