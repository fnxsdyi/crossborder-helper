import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Users,
  Calculator,
  Settings,
  Menu,
  X,
  ArrowRightLeft,
  Globe,
  Home,
  LogOut,
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { ThemeToggle } from './ThemeToggle'
import { useI18n } from '@/hooks/useI18n'
import { useAuthStore } from '@/stores/authStore'
import { useState } from 'react'
import type { Locale } from '@/lib/i18n'

export function Sidebar() {
  const { currentView, setCurrentView, sidebarOpen, toggleSidebar } = useAppStore()
  const { t, locale, changeLocale, locales } = useI18n()
  const { signOut } = useAuthStore()
  const [showLangMenu, setShowLangMenu] = useState(false)

  const navItems = [
    { id: 'dashboard' as const, labelKey: 'nav.dashboard' as const, icon: LayoutDashboard },
    { id: 'invoices' as const, labelKey: 'nav.invoices' as const, icon: FileText },
    { id: 'clients' as const, labelKey: 'nav.clients' as const, icon: Users },
    { id: 'currency' as const, labelKey: 'nav.currency' as const, icon: ArrowRightLeft },
    { id: 'tax' as const, labelKey: 'nav.tax' as const, icon: Calculator },
    { id: 'settings' as const, labelKey: 'nav.settings' as const, icon: Settings },
  ]

  const currentLang = locales.find(l => l.code === locale)

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg shadow-md lg:hidden"
        style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
      >
        <div className="p-6">
          <h1 className="text-xl font-bold">CrossBorder</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Invoice & Tax Helper</p>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id)
                if (window.innerWidth < 1024) toggleSidebar()
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                currentView === item.id
                  ? 'bg-primary text-white'
                  : 'hover:bg-slate-800'
              )}
              style={currentView !== item.id ? { color: 'var(--sidebar-text)' } : undefined}
            >
              <item.icon size={18} />
              {t(item.labelKey)}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          {/* Language Switcher */}
          <div className="relative mb-3">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full hover:bg-slate-800 transition-colors"
              style={{ color: 'var(--sidebar-text)' }}
            >
              <Globe size={16} />
              <span>{currentLang?.nativeName || 'English'}</span>
            </button>
            {showLangMenu && (
              <div
                className="absolute bottom-full left-0 right-0 mb-1 py-1 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                style={{ backgroundColor: 'var(--sidebar-bg)', border: '1px solid var(--border-color)' }}
              >
                {locales.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      changeLocale(lang.code as Locale)
                      setShowLangMenu(false)
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-slate-800 transition-colors',
                      locale === lang.code && 'bg-primary text-white'
                    )}
                  >
                    {lang.nativeName}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-center mb-3">
            <ThemeToggle />
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('app_entered')
              window.location.reload()
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            <Home size={16} />
            {t('nav.home')}
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut size={16} />
            {t('nav.signOut')}
          </button>
          <p className="text-xs text-center flex items-center justify-center gap-1 group relative" style={{ color: 'var(--text-muted)' }}>
            v0.1.0 • Local-First 🛡️
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {t('nav.privacyTooltip')}
            </span>
          </p>
        </div>
      </aside>
    </>
  )
}
