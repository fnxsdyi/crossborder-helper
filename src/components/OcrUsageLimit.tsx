import { Lock, CreditCard, ArrowLeft } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { useAppStore } from '@/stores/appStore'

const PAYPAL_OCR_PLAN_ID = 'P-29E1204392902382CNJCROFI'

interface OcrUsageLimitProps {
  used: number
  limit: number
}

export function OcrUsageLimit({ used, limit }: OcrUsageLimitProps) {
  const { t } = useI18n()
  const { setCurrentView } = useAppStore()

  function handleUpgrade() {
    const token = Date.now().toString(36) + Math.random().toString(36).slice(2)
    localStorage.setItem('ocr_pending_token', JSON.stringify({
      token,
      timestamp: Date.now(),
    }))
    const returnUrl = encodeURIComponent(window.location.origin + `/ocr?token=${token}`)
    window.location.href = `https://www.paypal.com/subscriptions?plan_id=${PAYPAL_OCR_PLAN_ID}&return=${returnUrl}`
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

      <button
        onClick={handleUpgrade}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors mb-4"
      >
        <CreditCard size={18} />
        {t('ocr.upgrade')}
      </button>

      <button
        onClick={() => setCurrentView('invoices')}
        className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
      >
        <ArrowLeft size={16} />
        {t('ocr.backManual')}
      </button>
    </div>
  )
}
