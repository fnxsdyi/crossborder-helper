import { useState } from 'react'
import { useI18n } from '@/hooks/useI18n'
import { PRO_MONTHLY_PLAN_ID, PRO_ANNUAL_PLAN_ID } from '@/lib/config'
import { PayPalSubscriptionButton } from '@/components/PayPalSubscriptionButton'
import {
  FileText,
  Calculator,
  BarChart3,
  Shield,
  Globe,
  Check,
  ArrowRight,
  X,
  Mail,
  Camera,
} from 'lucide-react'
import type { Locale } from '@/lib/i18n'

interface LandingPageProps {
  onEnterApp: () => void
  onMemberLogin?: () => void
}

export function LandingPage({ onEnterApp, onMemberLogin }: LandingPageProps) {
  const { t, locale, changeLocale, locales } = useI18n()
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)

  const currentLang = locales.find(l => l.code === locale)

  const features = [
    {
      icon: Camera,
      titleKey: 'landing.feature5Title' as const,
      descKey: 'landing.feature5Desc' as const,
      highlight: true,
    },
    {
      icon: FileText,
      titleKey: 'landing.feature1Title' as const,
      descKey: 'landing.feature1Desc' as const,
    },
    {
      icon: Calculator,
      titleKey: 'landing.feature2Title' as const,
      descKey: 'landing.feature2Desc' as const,
    },
    {
      icon: BarChart3,
      titleKey: 'landing.feature3Title' as const,
      descKey: 'landing.feature3Desc' as const,
    },
    {
      icon: Shield,
      titleKey: 'landing.feature4Title' as const,
      descKey: 'landing.feature4Desc' as const,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Globe size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">TaxFlow</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Globe size={16} />
                {currentLang?.nativeName || 'English'}
              </button>
              {showLangMenu && (
                <div className="absolute top-full right-0 mt-1 py-1 bg-white rounded-lg shadow-lg border border-slate-200 z-50 min-w-[120px]">
                  {locales.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLocale(lang.code as Locale)
                        setShowLangMenu(false)
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 transition-colors ${
                        locale === lang.code ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                      }`}
                    >
                      {lang.nativeName}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={onMemberLogin}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
            >
              {t('landing.memberLogin')}
            </button>
            <button
              onClick={onEnterApp}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {t('landing.openApp')}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-6">
            {t('landing.badge')}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            {t('landing.heroTitle')}
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            {t('landing.heroDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onEnterApp}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              {t('landing.freeTrial')} <ArrowRight size={18} />
            </button>
            <a
              href="#pricing"
              className="px-8 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              {t('landing.seePricing')}
            </a>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            {t('landing.alreadyMember')}{' '}
            <button
              onClick={onMemberLogin}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('landing.memberLogin')}
            </button>
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            {t('landing.featuresTitle')}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 shadow-sm border ${
                  (f as { highlight?: boolean }).highlight
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-500 md:col-span-2'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  (f as { highlight?: boolean }).highlight ? 'bg-white/20' : 'bg-blue-100'
                }`}>
                  <f.icon size={24} className={(f as { highlight?: boolean }).highlight ? 'text-white' : 'text-blue-600'} />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${
                  (f as { highlight?: boolean }).highlight ? 'text-white' : 'text-slate-900'
                }`}>{t(f.titleKey)}</h3>
                <p className={(f as { highlight?: boolean }).highlight ? 'text-blue-100' : 'text-slate-600'}>{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {t('landing.pricingTitle')}
          </h2>
          <p className="text-slate-600 mb-12">
            {t('landing.pricingDesc')}
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{t('landing.freePlan')}</h3>
              <p className="text-slate-500 text-sm mb-4">{t('landing.freePlanDesc')}</p>
              <div className="text-3xl font-bold text-slate-900 mb-4">$0</div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-slate-600">
                  <Check size={16} className="text-green-500 flex-shrink-0" />
                  {t('landing.freeFeature1')}
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Check size={16} className="text-green-500 flex-shrink-0" />
                  {t('landing.freeFeature2')}
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Check size={16} className="text-green-500 flex-shrink-0" />
                  {t('landing.freeFeature3')}
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Check size={16} className="text-green-500 flex-shrink-0" />
                  {t('landing.freeFeature4')}
                </li>
              </ul>
              <button
                onClick={onEnterApp}
                className="w-full py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm"
              >
                {t('landing.freeTrial')}
              </button>
            </div>

            {/* Pro Monthly */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left relative">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{t('landing.proPlan')}</h3>
              <p className="text-slate-500 text-sm mb-4">{t('landing.proPlanMonthlyDesc')}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-slate-900">{t('landing.monthlyPrice')}</span>
                <span className="text-sm text-slate-500">{t('landing.perMonth')}</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-slate-600">
                  <Check size={16} className="text-green-500 flex-shrink-0" />
                  {t('landing.proFeature1')}
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Check size={16} className="text-green-500 flex-shrink-0" />
                  {t('landing.proFeature2')}
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Check size={16} className="text-green-500 flex-shrink-0" />
                  {t('landing.proFeature3')}
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Check size={16} className="text-green-500 flex-shrink-0" />
                  {t('landing.proFeature4')}
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Check size={16} className="text-green-500 flex-shrink-0" />
                  {t('landing.proFeature5')}
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Check size={16} className="text-green-500 flex-shrink-0" />
                  {t('landing.proFeature6')}
                </li>
              </ul>
              <PayPalSubscriptionButton
                planId={PRO_MONTHLY_PLAN_ID}
                onSuccess={(id) => {
                  console.log('Monthly subscription:', id)
                  window.location.href = '/register'
                }}
                onError={(err) => console.error('Monthly payment error:', err)}
              />
            </div>

            {/* Pro Annual - Best Value */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-left text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
              <span className="inline-block px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded mb-2 uppercase tracking-wide">
                {t('landing.bestValue')}
              </span>
              <h3 className="text-lg font-semibold mb-1">{t('landing.proPlan')}</h3>
              <p className="text-blue-100 text-sm mb-4">{t('landing.proPlanAnnualDesc')}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold">{t('landing.annualPrice')}</span>
                <span className="text-sm text-blue-200">{t('landing.perYear')}</span>
              </div>
              <p className="text-xs text-blue-200 mb-4">{t('landing.monthlySubtext')}</p>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-300 flex-shrink-0" />
                  {t('landing.proFeature1')}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-300 flex-shrink-0" />
                  {t('landing.proFeature2')}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-300 flex-shrink-0" />
                  {t('landing.proFeature3')}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-300 flex-shrink-0" />
                  {t('landing.proFeature4')}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-300 flex-shrink-0" />
                  {t('landing.proFeature5')}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-300 flex-shrink-0" />
                  {t('landing.proFeature6')}
                </li>
              </ul>
              <PayPalSubscriptionButton
                planId={PRO_ANNUAL_PLAN_ID}
                onSuccess={(id) => {
                  console.log('Annual subscription:', id)
                  window.location.href = '/register'
                }}
                onError={(err) => console.error('Annual payment error:', err)}
              />
              <p className="text-xs text-blue-200 text-center mt-3">
                {t('landing.cancelAnytime')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Globe size={18} className="text-white" />
                </div>
                <span className="font-bold text-white">TaxFlow</span>
              </div>
              <p className="text-sm">
                {t('landing.footerDesc')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t('landing.legal')}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => setShowPrivacy(true)}
                    className="hover:text-white transition-colors"
                  >
                    {t('landing.privacyPolicy')}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowTerms(true)}
                    className="hover:text-white transition-colors"
                  >
                    {t('landing.termsOfService')}
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t('disclaimer.title')}</h4>
              <p className="text-xs leading-relaxed">
                {t('disclaimer.text')}
              </p>
            </div>
          </div>

          {/* Contact & Cross-promotion */}
          <div className="border-t border-slate-800 pt-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-white mb-3">{t('landing.contactUs')}</h4>
                <a
                  href="mailto:support@tax.flowingpulse.com"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <Mail size={16} />
                  support@tax.flowingpulse.com
                </a>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">{t('landing.ourProjects')}</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="https://kaki.llc" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                      KAKI — AI Tool Suite
                    </a>
                  </li>
                  <li>
                    <a href="https://hooki.io" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                      Hooki — Webhook Debug Console
                    </a>
                  </li>
                  <li>
                    <a href="https://flowingpulse.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                      FlowingPulse — Financial Runway Tracker
                    </a>
                  </li>
                  <li>
                    <span className="text-slate-400">TaxFlow — Invoice & Tax Helper</span>
                  </li>
                  <li>
                    <a href="https://chart.flowingpulse.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                      ChartFlow — Notion Chart Builder
                    </a>
                  </li>
                  <li>
                    <a href="https://dash.kaki.llc" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                      DashCore — Unified Solo Dashboard
                    </a>
                  </li>
                  <li>
                    <a href="https://comply.kaki.llc" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                      Comply — Free Compliance Scanner
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} TaxFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{t('landing.privacyPolicy')}</h2>
              <button onClick={() => setShowPrivacy(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 text-sm text-slate-600 space-y-4">
              <p><strong>{t('landing.lastUpdated')}</strong> June 30, 2026</p>

              <h3 className="font-semibold text-slate-900">{t('landing.privacySection1Title')}</h3>
              <p>{t('landing.privacySection1')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.privacySection2Title')}</h3>
              <p>{t('landing.privacySection2')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.privacySection3Title')}</h3>
              <p>{t('landing.privacySection3')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.privacySection4Title')}</h3>
              <p>{t('landing.privacySection4')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.privacySection5Title')}</h3>
              <p>{t('landing.privacySection5')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.privacySection6Title')}</h3>
              <p>{t('landing.privacySection6')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.privacySection7Title')}</h3>
              <p>{t('landing.privacySection7')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.privacySection8Title')}</h3>
              <p>{t('landing.privacySection8')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.privacySection9Title')}</h3>
              <p>{t('landing.privacySection9')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.privacySection10Title')}</h3>
              <p>{t('landing.privacySection10')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.privacySection11Title')}</h3>
              <p>{t('landing.privacySection11')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.privacySection12Title')}</h3>
              <p>{t('landing.privacySection12')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{t('landing.termsOfService')}</h2>
              <button onClick={() => setShowTerms(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 text-sm text-slate-600 space-y-4">
              <p><strong>{t('landing.lastUpdated')}</strong> June 30, 2026</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection1Title')}</h3>
              <p>{t('landing.termsSection1')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection2Title')}</h3>
              <p>{t('landing.termsSection2')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection3Title')}</h3>
              <p>{t('landing.termsSection3')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection4Title')}</h3>
              <p>{t('landing.termsSection4')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection5Title')}</h3>
              <p>{t('landing.termsSection5')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection6Title')}</h3>
              <p>{t('landing.termsSection6')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection7Title')}</h3>
              <p>{t('landing.termsSection7')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection8Title')}</h3>
              <p>{t('landing.termsSection8')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection9Title')}</h3>
              <p>{t('landing.termsSection9')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection10Title')}</h3>
              <p>{t('landing.termsSection10')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection11Title')}</h3>
              <p>{t('landing.termsSection11')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection12Title')}</h3>
              <p>{t('landing.termsSection12')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection13Title')}</h3>
              <p>{t('landing.termsSection13')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
