import { useState } from 'react'
import { useI18n } from '@/hooks/useI18n'
import { PRO_MONTHLY_PLAN_ID, PRO_ANNUAL_PLAN_ID } from '@/lib/config'
import { PayPalSubscriptionButton } from '@/components/PayPalSubscriptionButton'
import { Modal } from '@/components/Modal'
import {
  FileText,
  Calculator,
  BarChart3,
  Shield,
  Globe,
  Check,
  Camera,
  ChevronDown,
} from 'lucide-react'


interface LandingPageProps {
  onEnterApp: () => void
  onMemberLogin?: () => void
}

export function LandingPage({ onEnterApp, onMemberLogin }: LandingPageProps) {
  const { t, locale, changeLocale, locales } = useI18n()
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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
    <div className="min-h-screen bg-[#0a0e27] scroll-smooth">
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out both; }
        .animate-fade-in-up-delay { animation: fade-in-up 0.6s ease-out 0.15s both; }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}</style>

      <header className="relative z-20 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <span className="font-bold text-xl text-white">TaxFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Globe size={14} /> {currentLang?.nativeName || 'English'}</button>
              {showLangMenu && (<div className="absolute top-full right-0 mt-1 py-1 bg-slate-900 border border-white/10 rounded-lg shadow-xl z-50 min-w-[120px]">{locales.map((lang) => (<button key={lang.code} onClick={() => { changeLocale(lang.code); setShowLangMenu(false) }} className={'w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors ' + (locale === lang.code ? 'text-indigo-400 bg-white/5' : 'text-slate-400')}>{lang.nativeName}</button>))}</div>)}
            </div>
            <button onClick={onMemberLogin} className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{t('landing.memberLogin')}</button>
            <button onClick={onEnterApp} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all">{t('landing.openApp')}</button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[length:60px_60px] opacity-[0.03]" style={{backgroundImage: 'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)'}} />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-500/10 to-transparent blur-[80px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-500/10 to-transparent blur-[80px]" />
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative z-10 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 mb-8">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Early product &middot; <span className="text-indigo-200 font-semibold">Free tier available</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">Freelancer Tax &amp;<br /><span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Invoice Tool</span></h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-lg mb-10">W-8BEN forms, professional invoices, and multi-currency payments. Built for freelancers working with international clients.</p>
              <div className="flex flex-wrap gap-4 mb-12">
                <button onClick={onEnterApp} className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white rounded-xl font-semibold text-sm hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">{t('landing.freeTrial')}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
                <a href="#pricing" className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/10 text-slate-300 rounded-xl font-medium text-sm hover:bg-white/5 transition-all">{t('landing.seePricing')}</a>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-slate-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="#475569"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> 50+ Countries</div>
                <div className="flex items-center gap-2 text-sm text-slate-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Multi-Currency</div>
                <div className="flex items-center gap-2 text-sm text-slate-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/><path d="M3 9h18"/></svg> W-8BEN Ready</div>
              </div>
            </div>
            <div className="relative animate-fade-in-up-delay">
              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl animate-float">
                <div className="flex items-center justify-between mb-5"><h3 className="font-semibold text-white text-sm">Invoice Dashboard</h3><div className="flex items-center gap-2 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-green-500"></span> All systems online</div></div>
                <div className="flex gap-1 mb-5"><button className="px-4 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-md text-xs font-medium">Invoices</button><button className="px-4 py-1.5 text-slate-500 rounded-md text-xs hover:bg-white/5">Clients</button><button className="px-4 py-1.5 text-slate-500 rounded-md text-xs hover:bg-white/5">Tax Forms</button></div>
                <div className="space-y-0.5">
                  <div className="grid grid-cols-4 gap-4 px-3 py-2 bg-white/5 rounded-lg text-xs text-slate-500 font-semibold uppercase tracking-wider"><span>Invoice</span><span>Client</span><span>Amount</span><span>Status</span></div>
                  <div className="grid grid-cols-4 gap-4 px-3 py-2.5 text-sm hover:bg-white/[0.02] rounded-md"><span className="font-medium text-slate-200">INV-0042</span><span className="text-slate-400">Design Studio Berlin</span><span className="font-semibold text-slate-200">,200</span><span className="flex items-center gap-1.5 text-xs font-medium text-green-500"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Paid</span></div>
                  <div className="h-px bg-white/[0.04] my-0.5"></div>
                  <div className="grid grid-cols-4 gap-4 px-3 py-2.5 text-sm hover:bg-white/[0.02] rounded-md"><span className="font-medium text-slate-200">INV-0041</span><span className="text-slate-400">TechStartup Inc.</span><span className="font-semibold text-slate-200">,500</span><span className="flex items-center gap-1.5 text-xs font-medium text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Pending</span></div>
                  <div className="h-px bg-white/[0.04] my-0.5"></div>
                  <div className="grid grid-cols-4 gap-4 px-3 py-2.5 text-sm hover:bg-white/[0.02] rounded-md"><span className="font-medium text-slate-200">INV-0040</span><span className="text-slate-400">SaaS Co. Ltd</span><span className="font-semibold text-slate-200">,800</span><span className="flex items-center gap-1.5 text-xs font-medium text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>Overdue</span></div>
                  <div className="h-px bg-white/[0.04] my-0.5"></div>
                  <div className="grid grid-cols-4 gap-4 px-3 py-2.5 text-sm hover:bg-white/[0.02] rounded-md"><span className="font-medium text-slate-200">INV-0039</span><span className="text-slate-400">Creator Agency</span><span className="font-semibold text-slate-200">,400</span><span className="flex items-center gap-1.5 text-xs font-medium text-green-500"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Paid</span></div>
                </div>
                <div className="mt-5 pt-5 border-t border-white/5 grid grid-cols-4 gap-3">
                  <div className="p-2.5 bg-white/[0.03] rounded-lg border border-white/[0.05]"><div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">This Month</div><div className="text-lg font-bold text-white">,900</div></div>
                  <div className="p-2.5 bg-white/[0.03] rounded-lg border border-white/[0.05]"><div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Pending</div><div className="text-lg font-bold text-amber-400">,500</div></div>
                  <div className="p-2.5 bg-white/[0.03] rounded-lg border border-white/[0.05]"><div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Overdue</div><div className="text-lg font-bold text-red-400">,800</div></div>
                  <div className="p-2.5 bg-white/[0.03] rounded-lg border border-white/[0.05]"><div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Revenue</div><svg width="100%" height="20" viewBox="0 0 100 20"><polyline points="0,16 20,12 40,18 60,8 80,10 100,4" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round"/></svg></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16"><div className="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-4">{t('landing.featuresTitle')}</div><h2 className="text-4xl font-extrabold text-white mb-4">Everything you need to invoice globally</h2><p className="text-slate-400 max-w-lg mx-auto">From W-8BEN tax forms to multi-currency invoices.</p></div>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (<div key={i} className={'p-6 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 ' + (f.highlight ? 'bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border-indigo-500/20' : 'bg-white/[0.03] border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.05]')}><div className={'w-11 h-11 rounded-xl flex items-center justify-center mb-4 ' + (f.highlight ? 'bg-indigo-500/20' : 'bg-white/5')}><f.icon size={20} className={f.highlight ? 'text-indigo-300' : 'text-slate-300'} /></div><h3 className={'font-semibold mb-2 ' + (f.highlight ? 'text-white' : 'text-slate-200')}>{t(f.titleKey)}</h3><p className={'text-sm leading-relaxed ' + (f.highlight ? 'text-slate-300' : 'text-slate-500')}>{t(f.descKey)}</p></div>))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-6 bg-[#0a0e27]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16"><div className="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-4">{t('landing.pricingTitle')}</div><h2 className="text-4xl font-extrabold text-white mb-4">Simple, transparent pricing</h2><p className="text-slate-400">{t('landing.pricingDesc')}</p></div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6"><h3 className="text-lg font-semibold text-white mb-1">{t('landing.freePlan')}</h3><p className="text-slate-400 text-sm mb-4">{t('landing.freePlanDesc')}</p><div className="text-3xl font-bold text-white mb-4"></div><ul className="space-y-2 mb-6 text-sm">{[1,2,3,4].map(i => (<li key={i} className="flex items-center gap-2 text-slate-400"><Check size={14} className="text-green-500 flex-shrink-0" />{t('landing.freeFeature' + i as never)}</li>))}</ul><button onClick={onEnterApp} className="w-full py-2.5 border border-white/10 text-slate-300 rounded-xl font-medium text-sm hover:bg-white/5 transition-all">{t('landing.freeTrial')}</button></div>
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 relative"><h3 className="text-lg font-semibold text-white mb-1">{t('landing.proPlan')}</h3><p className="text-slate-400 text-sm mb-4">{t('landing.proPlanMonthlyDesc')}</p><div className="flex items-baseline gap-1 mb-1"><span className="text-3xl font-bold text-white">{t('landing.monthlyPrice')}</span><span className="text-sm text-slate-500">{t('landing.perMonth')}</span></div><ul className="space-y-2 mb-6 text-sm">{[1,2,3,4,5,6].map(i => (<li key={i} className="flex items-center gap-2 text-slate-400"><Check size={14} className="text-green-500 flex-shrink-0" />{t('landing.proFeature' + i as never)}</li>))}</ul><PayPalSubscriptionButton planId={PRO_MONTHLY_PLAN_ID} onSuccess={()=>{window.location.href='/register'}} onError={(err)=>console.error(err)} /></div>
            <div className="bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl p-6 text-white relative overflow-hidden"><div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" /><span className="inline-block px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded mb-2 uppercase tracking-wide">{t('landing.bestValue')}</span><h3 className="text-lg font-semibold mb-1">{t('landing.proPlan')}</h3><p className="text-white/70 text-sm mb-4">{t('landing.proPlanAnnualDesc')}</p><div className="flex items-baseline gap-1 mb-1"><span className="text-3xl font-bold">{t('landing.annualPrice')}</span><span className="text-sm text-white/70">{t('landing.perYear')}</span></div><p className="text-xs text-white/60 mb-4">{t('landing.monthlySubtext')}</p><ul className="space-y-2 mb-6 text-sm">{[1,2,3,4,5,6].map(i => (<li key={i} className="flex items-center gap-2 text-white/90"><Check size={14} className="text-green-300 flex-shrink-0" />{t('landing.proFeature' + i as never)}</li>))}</ul><PayPalSubscriptionButton planId={PRO_ANNUAL_PLAN_ID} onSuccess={()=>{window.location.href='/register'}} onError={(err)=>console.error(err)} /><p className="text-xs text-white/60 text-center mt-3">{t('landing.cancelAnytime')}</p></div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-slate-950">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">{t('landing.faqTitle')}</h2>
          <div className="space-y-3">{[1,2,3,4].map(i => {
            const isOpen = openFaq === i
            return (
              <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(isOpen ? null : i)} className="w-full flex items-center justify-between p-5 text-left text-white font-medium text-sm hover:bg-white/[0.02] transition-colors">
                  {t('landing.faq' + i + 'Q' as never)}
                  <ChevronDown className={'w-4 h-4 text-slate-500 transition-transform duration-300 ' + (isOpen ? 'rotate-180' : '')} />
                </button>
                <div className={'grid transition-all duration-300 ease-in-out ' + (isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{t('landing.faq' + i + 'A' as never)}</div>
                  </div>
                </div>
              </div>
            )
          })}</div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#0a0e27] border-t border-white/5 text-center">
        <h2 className="text-4xl font-extrabold text-white mb-4">Ready to simplify your freelance finances?</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">Join freelancers in 50+ countries who use TaxFlow to invoice and manage taxes across borders.</p>
        <button onClick={onEnterApp} className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white rounded-xl font-semibold text-sm hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">{t('landing.freeTrial')}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
      </section>

      <footer className="py-8 px-6 bg-slate-950 border-t border-white/5 text-center">
        <p className="text-xs text-slate-600">{t('landing.footerDesc')}</p>
        <div className="flex items-center justify-center gap-6 mt-3 text-xs">
          <button onClick={() => setShowPrivacy(true)} className="text-slate-500 hover:text-slate-300 transition-colors">{t('landing.privacyPolicy')}</button>
          <button onClick={() => setShowTerms(true)} className="text-slate-500 hover:text-slate-300 transition-colors">{t('landing.termsOfService')}</button>
          <span className="text-slate-600">{t('landing.ourProjects')}</span>
        </div>
      </footer>

      <Modal open={showPrivacy} onClose={() => setShowPrivacy(false)} title={t('landing.privacyPolicy')}>
        <div className="text-sm text-slate-600 space-y-4">
          <p><strong>{t('landing.lastUpdated')}</strong> June 30, 2026</p>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
            <div key={i}>
              <h3 className="font-semibold text-slate-900">{t(`landing.privacySection${i}Title` as never)}</h3>
              <p>{t(`landing.privacySection${i}` as never)}</p>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={showTerms} onClose={() => setShowTerms(false)} title={t('landing.termsOfService')}>
        <div className="text-sm text-slate-600 space-y-4">
          <p><strong>{t('landing.lastUpdated')}</strong> June 30, 2026</p>
          {[1,2,3,4,5,6,7,8,9,10,11,12,13].map(i => (
            <div key={i}>
              <h3 className="font-semibold text-slate-900">{t(`landing.termsSection${i}Title` as never)}</h3>
              <p>{t(`landing.termsSection${i}` as never)}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
