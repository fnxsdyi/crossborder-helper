import { useState, useEffect } from 'react'
import db from '@/db'
import { Lock, X, CreditCard, ExternalLink } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'

interface PremiumGateProps {
  children: React.ReactNode
  feature?: string
}

export function PremiumGate({ children, feature = 'this feature' }: PremiumGateProps) {
  const { t } = useI18n()
  const [isPremium, setIsPremium] = useState<boolean | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    checkPremiumStatus()
  }, [])

  async function checkPremiumStatus() {
    const settings = await db.settings.toCollection().first()
    setIsPremium(settings?.isPremium || false)
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
        <UpgradeModal onClose={() => setShowUpgrade(false)} />
      )}
    </>
  )
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const [licenseKey, setLicenseKey] = useState('')
  const [activating, setActivating] = useState(false)

  async function handleActivate() {
    if (!licenseKey.trim()) return
    setActivating(true)

    if (licenseKey.startsWith('CB-')) {
      const settings = await db.settings.toCollection().first()
      if (settings?.id) {
        await db.settings.update(settings.id, { isPremium: true, licenseKey })
      } else {
        await db.settings.add({
          businessName: '',
          businessAddress: '',
          businessEmail: '',
          businessCountry: '',
          defaultCurrency: 'USD',
          defaultVatType: 'none',
          defaultVatNumber: '',
          defaultTemplate: 'us',
          taxRate: 0,
          invoicePrefix: 'INV',
          nextInvoiceNumber: 1,
          isPremium: true,
          licenseKey,
        })
      }
      window.location.reload()
    } else {
      alert(t('common.error'))
      setActivating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{t('premium.title')}</h2>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
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
            <a
              href="https://www.paypal.com/ncp/payment/7CFGKT9FM3ER2"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <CreditCard size={18} />
              {t('premium.payPal')}
              <ExternalLink size={14} />
            </a>

            <a
              href="https://your-store.lemonsqueezy.com/checkout"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors"
            >
              <CreditCard size={18} />
              {t('premium.lemonSqueezy')}
              <ExternalLink size={14} />
            </a>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">{t('premium.orEnterKey')}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="CB-XXXX-XXXX"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <button
                onClick={handleActivate}
                disabled={activating || !licenseKey.trim()}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50"
              >
                {activating ? t('premium.activating') : t('settings.activate')}
              </button>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-400 text-center">
            {t('premium.oneTime')}
          </p>
        </div>
      </div>
    </div>
  )
}

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    checkPremium()
  }, [])

  async function checkPremium() {
    const settings = await db.settings.toCollection().first()
    setIsPremium(settings?.isPremium || false)
  }

  return isPremium
}
