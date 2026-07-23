'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { getSettings, upsertSettings, type SyncSettings } from '@/lib/sync'
import { Settings as SettingsIcon, LogOut, User, X } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { usePremium } from '@/components/PremiumGate'
import { PayPalSubscriptionButton } from '@/components/PayPalSubscriptionButton'
import { PRO_MONTHLY_PLAN_ID, PRO_ANNUAL_PLAN_ID } from '@/lib/config'
import { supabase } from '@/lib/supabase'

interface SettingsPageProps {
  isGuest?: boolean
}

export function SettingsPage({ isGuest }: SettingsPageProps) {
  const { t } = useI18n()
  const { user, signOut } = useAuthStore()
  const isPremium = usePremium()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [settings, setSettings] = useState<SyncSettings | null>(null)
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

  const loadSettings = useCallback(async () => {
    if (!user) return
    try {
      const data = await getSettings(user.id)
      setSettings(data)
      setBusinessName(data.businessName)
      setBusinessAddress(data.businessAddress)
      setBusinessEmail(data.businessEmail)
      setBusinessCountry(data.businessCountry)
      setDefaultCurrency(data.defaultCurrency)
      setDefaultVatType((data.defaultVatType as typeof defaultVatType) || 'none')
      setDefaultVatNumber(data.defaultVatNumber || '')
      setDefaultTemplate((data.defaultTemplate as typeof defaultTemplate) || 'us')
      setTaxRate(data.taxRate)
      setInvoicePrefix(data.invoicePrefix)
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }, [user])

  useEffect(() => {
    if (user) loadSettings()
  }, [user, loadSettings])

  async function handleSave() {
    if (!user) return
    await upsertSettings(user.id, {
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
    })
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
          {!isGuest && (
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          )}
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
              onClick={() => {
                if (isGuest) {
                  localStorage.removeItem('app_entered')
                  localStorage.removeItem('is_guest')
                  window.location.reload()
                  return
                }
                setShowUpgradeModal(true)
              }}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.templateUs')}</label>
              <button
                onClick={() => setDefaultTemplate('us')}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${defaultTemplate === 'us' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}
              >
                {t('settings.templateUsDesc')}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.templateEu')}</label>
              <button
                onClick={() => setDefaultTemplate('eu')}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${defaultTemplate === 'eu' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}
              >
                {t('settings.templateEuDesc')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={handleSave}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          {t('settings.saveSettings')}
        </button>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{t('settings.upgradeToPremium')}</h3>
              <button onClick={() => setShowUpgradeModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-4">选择你的订阅方案：</p>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Pro 月付 — $9/月</p>
                  <PayPalSubscriptionButton
                    planId={PRO_MONTHLY_PLAN_ID}
                    onSuccess={async (id) => {
                      if (user) {
                        await supabase.from('subscriptions').upsert({
                          user_id: user.id,
                          paypal_subscription_id: id,
                          plan_type: 'monthly',
                          status: 'active',
                          current_period_start: new Date().toISOString(),
                          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        }, { onConflict: 'paypal_subscription_id' })
                      }
                      setShowUpgradeModal(false)
                      window.location.reload()
                    }}
                    onError={(err) => console.error('Payment error:', err)}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Pro 年付 — $90/年（省 $18）</p>
                  <PayPalSubscriptionButton
                    planId={PRO_ANNUAL_PLAN_ID}
                    onSuccess={async (id) => {
                      if (user) {
                        await supabase.from('subscriptions').upsert({
                          user_id: user.id,
                          paypal_subscription_id: id,
                          plan_type: 'annual',
                          status: 'active',
                          current_period_start: new Date().toISOString(),
                          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                        }, { onConflict: 'paypal_subscription_id' })
                      }
                      setShowUpgradeModal(false)
                      window.location.reload()
                    }}
                    onError={(err) => console.error('Payment error:', err)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}