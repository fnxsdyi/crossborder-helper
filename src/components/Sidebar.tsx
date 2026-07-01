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
  ShieldCheck,
  Camera,
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { ThemeToggle } from './ThemeToggle'
import { useI18n } from '@/hooks/useI18n'
import { useAuthStore } from '@/stores/authStore'
import { useState } from 'react'
import type { Locale } from '@/lib/i18n'

interface SidebarProps {
  onSignOut?: () => void
  isGuest?: boolean
}

export function Sidebar({ onSignOut, isGuest }: SidebarProps) {
  const { currentView, setCurrentView, sidebarOpen, toggleSidebar } = useAppStore()
  const { t, locale, changeLocale, locales } = useI18n()
  const { signOut } = useAuthStore()
  const [showLangMenu, setShowLangMenu] = useState(false)

  const navItems = [
    { id: 'dashboard' as const, labelKey: 'nav.dashboard' as const, icon: LayoutDashboard },
    { id: 'invoices' as const, labelKey: 'nav.invoices' as const, icon: FileText },
    { id: 'ocr' as const, labelKey: 'nav.ocr' as const, icon: Camera },
    { id: 'clients' as const, labelKey: 'nav.clients' as const, icon: Users },
    { id: 'currency' as const, labelKey: 'nav.currency' as const, icon: ArrowRightLeft },
    { id: 'tax' as const, labelKey: 'nav.tax' as const, icon: Calculator },
    { id: 'contract' as const, labelKey: 'nav.contractScanner' as const, icon: ShieldCheck, external: true, href: 'https://shield.kaki.llc' },
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
          <h1 className="text-xl font-bold">TaxFlow</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Invoice & Tax Helper</p>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id && !('external' in item && item.external)

            if ('external' in item && item.external) {
              return (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (window.innerWidth < 1024) toggleSidebar()
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-800"
                  style={{ color: 'var(--sidebar-text)' }}
                >
                  <item.icon size={18} />
                  <div className="flex flex-col">
                    {t(item.labelKey)}
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-500">
                      {t('nav.externalTool')}
                    </span>
                  </div>
                </a>
              )
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id)
                  if (window.innerWidth < 1024) toggleSidebar()
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'hover:bg-slate-800'
                )}
                style={isActive ? undefined : { color: 'var(--sidebar-text)' }}
              >
                <item.icon size={18} />
                {t(item.labelKey)}
              </button>
            )
          })}
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
          {isGuest ? (
            <button
              onClick={() => {
                localStorage.removeItem('app_entered')
                localStorage.removeItem('is_guest')
                window.location.reload()
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              <LogOut size={16} />
              {t('nav.signIn')}
            </button>
          ) : (
            <button
              onClick={() => {
                signOut()
                onSignOut?.()
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              <LogOut size={16} />
              {t('nav.signOut')}
            </button>
          )}
          {/* Our Projects */}
          <div className="mb-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: 'var(--text-muted)' }}>
              Our Projects
            </p>
            <div className="space-y-1 px-3">
              <a href="https://hooki.io" target="_blank" rel="noopener noreferrer" className="block text-[11px] hover:opacity-80 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                Hooki — Webhook Console
              </a>
              <a href="https://chart.flowingpulse.com" target="_blank" rel="noopener noreferrer" className="block text-[11px] hover:opacity-80 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                ChartFlow — Notion Charts
              </a>
              <a href="https://kaki.llc" target="_blank" rel="noopener noreferrer" className="block text-[11px] hover:opacity-80 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                Kaki — SaaS Platform
              </a>
              <a href="https://flowingpulse.com" target="_blank" rel="noopener noreferrer" className="block text-[11px] hover:opacity-80 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                FlowingPulse — Studio
              </a>
            </div>
          </div>
          <p className="text-xs text-center flex items-center justify-center gap-1 group relative" style={{ color: 'var(--text-muted)' }}>
            v0.1.0 • Secure Sync 🔒
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {t('nav.privacyTooltip')}
            </span>
          </p>
        </div>
      </aside>
    </>
  )
}
