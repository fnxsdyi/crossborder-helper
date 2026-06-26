import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Lock, X, CreditCard, ExternalLink } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'

interface PremiumGateProps {
  children: React.ReactNode
  feature?: string
}

export function PremiumGate({ children, feature = 'this feature' }: PremiumGateProps) {
  const { t } = useI18n()
  const { user } = useAuthStore()
  const [isPremium, setIsPremium] = useState<boolean | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    if (user) {
      checkPremiumStatus()
    } else {
      setIsPremium(false)
    }
  }, [user])

  const SUPER_ADMIN_EMAILS = ['fnxsdyi@qq.com']

  async function checkPremiumStatus() {
    if (!user) {
      setIsPremium(false)
      return
    }

    if (SUPER_ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      setIsPremium(true)
      return
    }

    const { data } = await supabase
      .from('licenses')
      .select('id')
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    setIsPremium(!!data)
  }

  if (isPremium === null) {
    return <div className="animate-pulse bg-slate-100 rounded-xl h-32" />
  }

  if (isPremium) {
    return <>{children}</>
  }

  return (
    <>
      <div className="relative">
        <div className="blur-[2px] pointer-events-none opacity-60">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => setShowUpgrade(true)}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl shadow-lg hover:bg-amber-600 transition-colors"
          >
            <Lock size={18} />
            {t('premium.unlock')} {feature}
          </button>
        </div>
      </div>

      {showUpgrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{t('premium.title')}</h2>
                <button onClick={() => setShowUpgrade(false)} className="p-1 hover:bg-white/20 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <p className="text-amber-100">{t('premium.subtitle')}</p>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold mb-3">{t('premium.features')}</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {t('premium.unlimitedPdf')}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {t('premium.multiCurrency')}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {t('premium.advancedTax')}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {t('premium.lifetimeAccess')}
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    const token = Date.now().toString(36) + Math.random().toString(36).slice(2)
                    localStorage.setItem('paypal_pending_token', JSON.stringify({
                      token,
                      timestamp: Date.now()
                    }))
                    window.location.href = `https://www.paypal.com/ncp/payment/7CFGKT9FM3ER2?return=${encodeURIComponent(window.location.origin + `/?token=${token}`)}`
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <CreditCard size={18} />
                  {t('premium.payPal')}
                  <ExternalLink size={14} />
                </button>
              </div>

              <p className="mt-4 text-xs text-slate-400 text-center">
                {t('premium.oneTime')}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function usePremium() {
  const { user } = useAuthStore()
  const [isPremium, setIsPremium] = useState(false)

  const SUPER_ADMIN_EMAILS = ['fnxsdyi@qq.com']

  useEffect(() => {
    if (user) {
      checkPremium()
    }
  }, [user])

  async function checkPremium() {
    if (!user) {
      setIsPremium(false)
      return
    }

    if (SUPER_ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      setIsPremium(true)
      return
    }

    const { data } = await supabase
      .from('licenses')
      .select('id')
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    setIsPremium(!!data)
  }

  return isPremium
}
