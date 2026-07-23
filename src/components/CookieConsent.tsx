import { useState } from 'react'
import { useI18n } from '@/hooks/useI18n'
import { Shield, X } from 'lucide-react'

const COOKIE_KEY = 'taxflow_cookie_consent'

export function CookieConsent() {
  const { t } = useI18n()
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(COOKIE_KEY)
  })

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted')
    setVisible(false)
  }

  const dismiss = () => {
    localStorage.setItem(COOKIE_KEY, 'dismissed')
    setVisible(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6" style={{ display: visible ? undefined : 'none' }}>
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('cookie.message')}{' '}
              <span className="text-blue-600 font-medium">
                {t('cookie.privacyLink')}
              </span>
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={accept}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                {t('cookie.accept')}
              </button>
              <button
                onClick={dismiss}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {t('cookie.dismiss')}
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
