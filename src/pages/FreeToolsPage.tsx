import { useEffect } from 'react'
// @ts-expect-error lucide-react@1.21.0 type declarations omit Receipt/Sparkles (runtime-valid). Do NOT upgrade to 0.x — different API breaks all icon imports.
import { ArrowLeft, Calculator, FileText, Receipt, ArrowRight, Sparkles } from 'lucide-react'

export function FreeToolsPage() {
  useEffect(() => {
    document.title = 'Free Tools for Cross-Border Freelancers | TaxFlow'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', 'Free tools for global freelancers — W-8BEN withholding tax calculator, form checklists, and invoice helpers. No signup required.')
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canon) {
      canon = document.createElement('link')
      canon.setAttribute('rel', 'canonical')
      document.head.appendChild(canon)
    }
    canon.setAttribute('href', 'https://tax.flowingpulse.com/tools')
  }, [])

  const tools = [
    {
      icon: Calculator,
      title: 'W-8BEN Withholding Tax Calculator',
      desc: 'See exactly how much a missing or expired W-8BEN costs you — compare the default 30% withholding against your country’s tax-treaty rate.',
      href: '/tools/w8ben-withholding-calculator',
      live: true,
    },
    {
      icon: FileText,
      title: 'W-8BEN Form Checklist',
      desc: 'Step-by-step checklist for filling out Form W-8BEN correctly — avoid the mistakes that trigger 30% backup withholding.',
      href: '/tools/w8ben-checklist',
      live: true,
    },
    {
      icon: Receipt,
      title: 'Invoice Generator',
      desc: 'Create a clean, professional invoice in seconds. Multi-currency, tax-ready, downloadable as PDF.',
      href: '/tools/invoice-generator',
      live: true,
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0e27] text-slate-200">
      <header className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            </div>
            <span className="font-bold text-xl text-white">TaxFlow</span>
          </a>
          <a href="/" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"><ArrowLeft size={14} /> Back to TaxFlow</a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 mb-4">
            <Sparkles size={13} /> Free Tools
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Free tools for cross-border freelancers</h1>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Practical, no-signup calculators and helpers for freelancers working with US clients. Built by the TaxFlow team to make cross-border taxes a little less painful.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon
            const card = (
              <div className={'group h-full rounded-2xl border p-6 transition-all duration-300 ' + (tool.live ? 'bg-white/[0.04] border-cyan-500/20 hover:border-cyan-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10' : 'bg-white/[0.02] border-white/5 opacity-80')}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-cyan-500/10">
                  <Icon size={22} className="text-cyan-300" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-white text-lg">{tool.title}</h3>
                  {!tool.live && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-white/10 text-slate-400">Soon</span>}
                </div>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">{tool.desc}</p>
                {tool.live ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-cyan-300 group-hover:gap-2 transition-all">
                    Open tool <ArrowRight size={14} />
                  </span>
                ) : (
                  <span className="text-sm text-slate-500">Coming soon</span>
                )}
              </div>
            )
            return tool.live ? (
              <a key={tool.title} href={tool.href} className="block">{card}</a>
            ) : (
              <div key={tool.title}>{card}</div>
            )
          })}
        </div>

        <div className="mt-12 bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border border-cyan-500/30 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Want the full toolkit?</h2>
          <p className="text-slate-400 text-sm mb-5 max-w-lg mx-auto">TaxFlow tracks every W-8BEN, scans invoices, and manages multi-currency taxes in one place.</p>
          <a href="/#pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
            Start free <ArrowRight size={15} />
          </a>
        </div>
      </main>
    </div>
  )
}

export default FreeToolsPage
