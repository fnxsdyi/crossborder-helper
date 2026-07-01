import { Lock, ArrowLeft, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/hooks/useI18n'
import { useAppStore } from '@/stores/appStore'
import { PayPalSubscriptionButton } from './PayPalSubscriptionButton'

const PAYPAL_OCR_PLAN_ID = 'P-29E1204392902382CNJCROFI'

interface OcrUsageLimitProps {
  used: number
  limit: number
}

export function OcrUsageLimit({ used, limit }: OcrUsageLimitProps) {
  const { t } = useI18n()
  const { setCurrentView } = useAppStore()
  const [success, setSuccess] = useState(false)

  function handleSuccess(subscriptionId: string) {
    console.log('OCR subscription created:', subscriptionId)
    setSuccess(true)
    // TODO: Record subscription in Supabase
  }

  function handleError(error: unknown) {
    console.error('Payment failed:', error)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t('ocr.upgradeSuccess')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          {t('ocr.upgradeSuccessDesc')}
        </p>
        <button
          onClick={() => setCurrentView('ocr')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          {t('ocr.startScanning')}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock size={32} className="text-amber-600 dark:text-amber-400" />
      </div>

      <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {t('ocr.limitReached')}
      </h1>

      <p className="text-slate-500 dark:text-slate-400 mb-6">
        {t('ocr.freeUsed', { used: String(used), limit: String(limit) })}
      </p>

      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          {t('ocr.upgradeTitle')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {t('ocr.upgradeDesc')}
        </p>
        <div className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          $9<span className="text-sm font-normal text-slate-500">/月</span>
        </div>
        <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 mb-6">
          <li>✓ {t('ocr.unlimitedScans')}</li>
          <li>✓ {t('ocr.prioritySupport')}</li>
          <li>✓ {t('ocr.cancelAnytime')}</li>
        </ul>
        <PayPalSubscriptionButton
          planId={PAYPAL_OCR_PLAN_ID}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>

      <button
        onClick={() => setCurrentView('invoices')}
        className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mx-auto"
      >
        <ArrowLeft size={16} />
        {t('ocr.backManual')}
      </button>
    </div>
  )
}
