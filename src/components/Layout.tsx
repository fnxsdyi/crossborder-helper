import { Sidebar } from './Sidebar'
import { Disclaimer } from './Disclaimer'
import { GuestBanner } from './GuestBanner'
import { useAppStore } from '@/stores/appStore'
import { Dashboard } from '@/pages/Dashboard'
import { Invoices } from '@/pages/Invoices'
import { Clients } from '@/pages/Clients'
import { TaxWizard } from '@/pages/TaxWizard'
import { CurrencyDashboard } from '@/pages/CurrencyDashboard'
import { SettingsPage } from '@/pages/Settings'

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
      case 'clients':
        return <Clients />
      case 'currency':
        return <CurrencyDashboard />
      case 'tax':
        return <TaxWizard />
      case 'settings':
        return <SettingsPage onUpgrade={onUpgrade} isGuest={isGuest} />
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
          {renderPage()}
          <Disclaimer />
        </div>
      </main>
    </div>
  )
}
