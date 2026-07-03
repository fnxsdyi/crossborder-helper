import { X, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/hooks/useI18n'

interface GuestBannerProps {
  onUpgrade?: () => void
}

export function GuestBanner({ onUpgrade }: GuestBannerProps) {
  const { t } = useI18n()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <CreditCard size={20} className="text-amber-600" />
        </div>
        <div>
          <p className="font-medium text-amber-800">{t('guest.bannerTitle')}</p>
          <p className="text-sm text-amber-600">{t('guest.bannerDesc')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            localStorage.removeItem('app_entered')
            localStorage.removeItem('is_guest')
            window.location.href = '/'
          }}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
        >
          {t('guest.upgradeNow')}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-amber-400 hover:text-amber-600"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
