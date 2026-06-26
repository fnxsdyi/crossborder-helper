import { useEffect, useState } from 'react'
import db, { type Settings as SettingsType } from '@/db'
import { Settings as SettingsIcon, Save, LogOut, User } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { useAuthStore } from '@/stores/authStore'
import { usePremium } from '@/components/PremiumGate'

interface SettingsPageProps {
  onUpgrade?: () => void
}

export function SettingsPage({ onUpgrade }: SettingsPageProps) {
  const { t } = useI18n()
  const { user, signOut } = useAuthStore()
  const isPremium = usePremium()
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [businessCountry, setBusinessCountry] = useState('')
  const [defaultCurrency, setDefaultCurrency] = useState('USD')
  const [defaultVatType, setDefaultVatType] = useState<'none' | 'standard' | 'reverse_charge' | 'exempt'>('none')
  const [defaultVatNumber, setDefaultVatNumber] = useState('')
  const [defaultTemplate, setDefaultTemplate] = useState<'us' | 'eu' | 'uk'>('us')
  const [taxRate, setTaxRate] = useState(0)
  const [invoicePrefix, setInvoicePrefix] = useState('INV')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const data = await db.settings.toCollection().first()
    if (data) {
      setSettings(data)
      setBusinessName(data.businessName)
      setBusinessAddress(data.businessAddress)
      setBusinessEmail(data.businessEmail)
      setBusinessCountry(data.businessCountry)
      setDefaultCurrency(data.defaultCurrency)
      setDefaultVatType(data.defaultVatType || 'none')
      setDefaultVatNumber(data.defaultVatNumber || '')
      setDefaultTemplate(data.defaultTemplate || 'us')
      setTaxRate(data.taxRate)
      setInvoicePrefix(data.invoicePrefix)
    }
  }

  async function handleSave() {
    const settingsData = {
      businessName,
      businessAddress,
      businessEmail,
      businessCountry,
      defaultCurrency,
      defaultVatType,
      defaultVatNumber,
      defaultTemplate,
      taxRate,
      invoicePrefix,
      nextInvoiceNumber: settings?.nextInvoiceNumber || 1,
      isPremium: settings?.isPremium || false,
    }

    if (settings?.id) {
      await db.settings.update(settings.id, settingsData)
    } else {
      await db.settings.add(settingsData as SettingsType)
    }
    loadSettings()
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg">
          <SettingsIcon size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('settings.title')}</h1>
          <p className="text-slate-500 mt-0.5">{t('settings.subtitle')}</p>
        </div>
      </div>

      {/* User Account */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{user?.email}</p>
              <p className="text-sm text-slate-500">
                {isPremium ? t('settings.premiumActive') : t('settings.freePlan')}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Premium Status */}
      <div className={`rounded-xl p-4 mb-6 ${isPremium ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isPremium ? 'bg-green-500' : 'bg-amber-500'}`}>
            {isPremium && <span className="text-white text-xs">✓</span>}
          </div>
          <div>
            <p className={`font-medium ${isPremium ? 'text-green-800' : 'text-amber-800'}`}>
              {isPremium ? t('settings.premiumActive') : t('settings.freePlan')}
            </p>
            <p className={`text-sm ${isPremium ? 'text-green-600' : 'text-amber-600'}`}>
              {isPremium ? t('settings.premiumDesc') : t('settings.freeDesc')}
            </p>
          </div>
        </div>
        {!isPremium && (
          <div className="mt-3">
            <button
              onClick={onUpgrade}
              className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"
            >
              {t('settings.upgradeToPremium')}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="font-semibold mb-4">{t('settings.businessInfo')}</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.businessName')}</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.email')}</label>
              <input
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.address')}</label>
            <textarea
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('clients.country')}</label>
              <input
                type="text"
                value={businessCountry}
                onChange={(e) => setBusinessCountry(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.defaultCurrency')}</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              >
                {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
        <h2 className="font-semibold mb-4">{t('settings.invoiceDefaults')}</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.invoicePrefix')}</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.defaultTaxRate')}</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('settings.defaultTemplate')}</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setDefaultTemplate('us')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  defaultTemplate === 'us'
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-medium text-sm">{t('settings.templateUs')}</p>
                <p className="text-xs text-slate-500 mt-1">{t('settings.templateUsDesc')}</p>
              </button>
              <button
                onClick={() => setDefaultTemplate('eu')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  defaultTemplate === 'eu'
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-medium text-sm">{t('settings.templateEu')}</p>
                <p className="text-xs text-slate-500 mt-1">{t('settings.templateEuDesc')}</p>
              </button>
              <button
                onClick={() => setDefaultTemplate('uk')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  defaultTemplate === 'uk'
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-medium text-sm">{t('settings.templateUk')}</p>
                <p className="text-xs text-slate-500 mt-1">{t('settings.templateUkDesc')}</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
        <h2 className="font-semibold mb-4">{t('settings.vatGstSettings')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.defaultVatType')}</label>
            <select
              value={defaultVatType}
              onChange={(e) => setDefaultVatType(e.target.value as typeof defaultVatType)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            >
              <option value="none">{t('editor.vatNone')}</option>
              <option value="standard">{t('editor.vatStandard')}</option>
              <option value="reverse_charge">{t('editor.vatReverseCharge')}</option>
              <option value="exempt">{t('editor.vatExempt')}</option>
            </select>
          </div>
          {defaultVatType === 'standard' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('editor.yourVatNumber')}</label>
              <input
                type="text"
                value={defaultVatNumber}
                onChange={(e) => setDefaultVatNumber(e.target.value)}
                placeholder="e.g. DE123456789"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Save size={16} />
          {t('settings.saveSettings')}
        </button>
      </div>

      <div className="mt-8 p-4 bg-slate-50 rounded-xl">
        <button
          onClick={() => {
            localStorage.removeItem('app_entered')
            window.location.reload()
          }}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  )
}
