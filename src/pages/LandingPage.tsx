import { useState } from 'react'
import { useI18n } from '@/hooks/useI18n'
import {
  FileText,
  Calculator,
  BarChart3,
  Shield,
  Globe,
  CreditCard,
  Check,
  ArrowRight,
  X,
  Mail,
} from 'lucide-react'
import type { Locale } from '@/lib/i18n'

interface LandingPageProps {
  onEnterApp: () => void
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
  const { t, locale, changeLocale, locales } = useI18n()
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)

  const currentLang = locales.find(l => l.code === locale)

  const features = [
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
            <span className="font-bold text-xl text-slate-900">CrossBorder</span>
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
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              {t('landing.startFree')} <ArrowRight size={18} />
            </button>
            <a
              href="#pricing"
              className="px-8 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              {t('landing.seePricing')}
            </a>
          </div>
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
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={24} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{t(f.titleKey)}</h3>
                <p className="text-slate-600">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {t('landing.pricingTitle')}
          </h2>
          <p className="text-slate-600 mb-12">
            {t('landing.pricingDesc')}
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-left">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{t('landing.freePlan')}</h3>
              <p className="text-slate-500 mb-6">{t('landing.freePlanDesc')}</p>
              <div className="text-4xl font-bold text-slate-900 mb-6">$0</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-slate-600">
                  <Check size={18} className="text-green-500 flex-shrink-0" />
                  {t('landing.freeFeature1')}
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Check size={18} className="text-green-500 flex-shrink-0" />
                  {t('landing.freeFeature2')}
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Check size={18} className="text-green-500 flex-shrink-0" />
                  {t('landing.freeFeature3')}
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Check size={18} className="text-green-500 flex-shrink-0" />
                  {t('landing.freeFeature4')}
                </li>
              </ul>
              <button
                onClick={onEnterApp}
                className="w-full py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                {t('landing.getStarted')}
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-left text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
              <h3 className="text-xl font-semibold mb-2">{t('landing.premiumPlan')}</h3>
              <p className="text-blue-100 mb-6">{t('landing.premiumPlanDesc')}</p>
              <div className="text-4xl font-bold mb-6">$19</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check size={18} className="text-green-300 flex-shrink-0" />
                  {t('landing.premiumFeature1')}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={18} className="text-green-300 flex-shrink-0" />
                  {t('landing.premiumFeature2')}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={18} className="text-green-300 flex-shrink-0" />
                  {t('landing.premiumFeature3')}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={18} className="text-green-300 flex-shrink-0" />
                  {t('landing.premiumFeature4')}
                </li>
                <li className="flex items-center gap-3">
                  <Check size={18} className="text-green-300 flex-shrink-0" />
                  {t('landing.premiumFeature5')}
                </li>
              </ul>
              <a
                href="https://www.paypal.com/ncp/payment/7CFGKT9FM3ER2"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard size={18} />
                {t('landing.buyNow')}
              </a>
              <p className="text-xs text-blue-200 text-center mt-3">
                {t('landing.orUseKey')}
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
                <span className="font-bold text-white">CrossBorder</span>
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
                  href="mailto:support@crossborder-helper.com"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <Mail size={16} />
                  support@crossborder-helper.com
                </a>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">{t('landing.ourProjects')}</h4>
                <div className="flex flex-wrap gap-3">
                  <a href="https://kaki.llc" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-sm">
                    🔗 kaki.llc
                  </a>
                  <a href="https://hooki.io" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-sm">
                    🔗 hooki.io
                  </a>
                  <a href="https://flowingpulse.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-sm">
                    🔗 flowingpulse.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} CrossBorder. All rights reserved.</p>
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
              <p><strong>{t('landing.lastUpdated')}</strong> {new Date().toLocaleDateString()}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.privacySection1Title')}</h3>
              <p>{t('landing.privacySection1')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.privacySection2Title')}</h3>
              <p>{t('landing.privacySection2')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.privacySection3Title')}</h3>
              <p>{t('landing.privacySection3')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.privacySection4Title')}</h3>
              <p>{t('landing.privacySection4')}</p>
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
              <p><strong>{t('landing.lastUpdated')}</strong> {new Date().toLocaleDateString()}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection1Title')}</h3>
              <p>{t('landing.termsSection1')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection2Title')}</h3>
              <p>{t('landing.termsSection2')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection3Title')}</h3>
              <p>{t('landing.termsSection3')}</p>

              <h3 className="font-semibold text-slate-900">{t('landing.termsSection4Title')}</h3>
              <p>{t('landing.termsSection4')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
