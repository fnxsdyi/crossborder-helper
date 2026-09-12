import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { isAdmin, getTaxflowPrice } from '@/lib/config'
import { checkSubscriptionWithFallback, recordLicense } from '@/lib/subscription'
import { Lock, X, CheckCircle } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { PayPalOneTimeButton } from './PayPalOneTimeButton'

interface PremiumGateProps {
  children: React.ReactNode
  feature?: string
}

export function PremiumGate({ children, feature = 'this feature' }: PremiumGateProps) {
  const { t } = useI18n()
  const { user } = useAuthStore()
  const [isPremium, setIsPremium] = useState<boolean | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [success, setSuccess] = useState(false)

  const checkPremiumStatus = useCallback(async () => {
    if (!user) {
      setIsPremium(false)
      return
    }

    if (isAdmin(user.email)) {
      setIsPremium(true)
      return
    }

    const result = await checkSubscriptionWithFallback(user.id)
    setIsPremium(result.isPremium)
  }, [user])

  useEffect(() => {
    if (user) {
      checkPremiumStatus()
    } else {
      setIsPremium(false)
    }
  }, [user, checkPremiumStatus])

  async function handleBuyoutSuccess(orderId: string) {
    if (!user) return

    // Record the one-time (buyout) license — this immediately unlocks premium
    await recordLicense(user.id, `TAXFLOW-LIFETIME-${orderId}`)

    setSuccess(true)
    await checkPremiumStatus()
    setTimeout(() => {
      setShowUpgrade(false)
      setSuccess(false)
    }, 2000)
  }

  function handleBuyoutError(error: unknown) {
    console.error('Payment failed:', error)
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
            onClick={() => {
              if (!user) {
                localStorage.removeItem('app_entered')
                localStorage.removeItem('is_guest')
                window.location.reload()
                return
              }
              setShowUpgrade(true)
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
          >
            <Lock size={18} />
            {t('premium.unlock')} {feature}
          </button>
        </div>
      </div>

      {showUpgrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{t('premium.title')}</h2>
                <button onClick={() => setShowUpgrade(false)} className="p-1 hover:bg-white/20 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <p className="text-blue-100">{t('premium.subtitle')}</p>
            </div>

            <div className="p-6">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('ocr.upgradeSuccess')}</h3>
                  <p className="text-slate-500 dark:text-slate-400">{t('ocr.upgradeSuccessDesc')}</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3 dark:text-white">{t('premium.features')}</h3>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
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

                  <div className="text-center">
                    <p className="text-sm font-semibold mb-2 dark:text-white">{t('premium.lifetimeAccess')}</p>
                    <PayPalOneTimeButton
                      amount={getTaxflowPrice()}
                      customId={user?.id}
                      onSuccess={handleBuyoutSuccess}
                      onError={handleBuyoutError}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
