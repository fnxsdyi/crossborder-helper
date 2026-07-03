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
  UserPlus,
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'
import { ThemeToggle } from './ThemeToggle'
import { useI18n } from '@/hooks/useI18n'
import { useState } from 'react'
import type { Locale } from '@/lib/i18n'

interface SidebarProps {
  onSignOut?: () => void
  isGuest?: boolean
}

export function Sidebar({ onSignOut, isGuest }: SidebarProps) {
  const { currentView, setCurrentView, sidebarOpen, toggleSidebar } = useAppStore()
  const { t, locale, changeLocale, locales } = useI18n()
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
          'fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 lg:translate-x-0 flex flex-col overflow-hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
      >
        {/* Header with controls */}
        <div className="px-4 pt-4 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-lg font-bold">TaxFlow</h1>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Invoice & Tax Helper</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  useAuthStore.getState().resetToLanding()
                  window.location.reload()
                }}
                className="p-1.5 rounded-md hover:bg-slate-800 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                title={t('nav.home')}
              >
                <Home size={15} />
              </button>
              <ThemeToggle />
            </div>
          </div>
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs w-full hover:bg-slate-800 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <Globe size={13} />
              <span>{currentLang?.nativeName || 'English'}</span>
            </button>
            {showLangMenu && (
              <div
                className="absolute top-full left-0 right-0 mt-1 py-1 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50"
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
                      'w-full px-3 py-1.5 text-left text-sm hover:bg-slate-800 transition-colors',
                      locale === lang.code && 'bg-primary text-white'
                    )}
                  >
                    {lang.nativeName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <nav className="px-4 space-y-1 flex-1 overflow-y-auto">
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

        {/* Bottom section */}
        <div className="shrink-0 px-4 py-3 space-y-1" style={{ borderTop: '1px solid var(--border-color)' }}>
          {isGuest ? (
            <>
              <button
                onClick={() => {
                  useAuthStore.getState().resetToLanding()
                  window.location.reload()
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-800 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <LogOut size={16} />
                {t('nav.signIn')}
              </button>
              <button
                onClick={() => {
                  useAuthStore.getState().resetToLanding()
                  window.location.href = '/register'
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-800 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <UserPlus size={16} />
                {t('nav.register')}
              </button>
            </>
          ) : (
            <button
              onClick={() => onSignOut?.()}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-800 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <LogOut size={16} />
              {t('nav.signOut')}
            </button>
          )}
          {/* Our Projects */}
          <div className="pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1 px-3" style={{ color: 'var(--text-muted)' }}>
              Our Projects
            </p>
            <div className="space-y-0.5 px-3">
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
          <p className="text-[10px] text-center pt-1" style={{ color: 'var(--text-muted)' }}>
            v0.1.0 • Secure Sync
          </p>
        </div>
      </aside>
    </>
  )
}
