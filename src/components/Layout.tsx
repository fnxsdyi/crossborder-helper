import { Sidebar } from './Sidebar'
import { Disclaimer } from './Disclaimer'
import { useAppStore } from '@/stores/appStore'
import { Dashboard } from '@/pages/Dashboard'
import { Invoices } from '@/pages/Invoices'
import { Clients } from '@/pages/Clients'
import { TaxWizard } from '@/pages/TaxWizard'
import { CurrencyDashboard } from '@/pages/CurrencyDashboard'
import { SettingsPage } from '@/pages/Settings'

export function Layout() {
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
        return <SettingsPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />
      <main className="lg:ml-64">
        <div className="p-6 lg:p-8">
          {renderPage()}
          <Disclaimer />
        </div>
      </main>
    </div>
  )
}
