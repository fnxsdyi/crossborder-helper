import { useState, useEffect } from 'react'
import { ArrowLeft, Calculator, ShieldCheck, TrendingDown, AlertTriangle, ArrowRight } from 'lucide-react'

type IncomeKey = 'dividends' | 'interest' | 'royalties'

// General US tax-treaty rates (%) for non-resident aliens. These are typical
// statutory rates and may vary by ownership percentage or income type.
// Educational estimate only — not tax advice.
const TREATY_RATES: Record<string, { dividends: number; interest: number; royalties: number; note?: string }> = {
  'United Kingdom': { dividends: 0, interest: 0, royalties: 0 },
  'Canada': { dividends: 15, interest: 0, royalties: 0, note: '5% if you own more than 10% of the payer' },
  'Germany': { dividends: 15, interest: 0, royalties: 0 },
  'France': { dividends: 15, interest: 0, royalties: 0 },
  'Australia': { dividends: 15, interest: 10, royalties: 5 },
  'Japan': { dividends: 10, interest: 10, royalties: 0 },
  'India': { dividends: 15, interest: 15, royalties: 15 },
  'Ireland': { dividends: 15, interest: 0, royalties: 0 },
  'Netherlands': { dividends: 15, interest: 0, royalties: 0 },
  'Switzerland': { dividends: 15, interest: 0, royalties: 0 },
  'Spain': { dividends: 15, interest: 10, royalties: 0 },
  'Italy': { dividends: 15, interest: 10, royalties: 0 },
  'Mexico': { dividends: 10, interest: 10, royalties: 10 },
  'Brazil': { dividends: 15, interest: 15, royalties: 15 },
  'Singapore': { dividends: 0, interest: 15, royalties: 10 },
  'South Korea': { dividends: 15, interest: 12, royalties: 10 },
  'China': { dividends: 10, interest: 10, royalties: 10 },
  'New Zealand': { dividends: 15, interest: 10, royalties: 10 },
  'Sweden': { dividends: 15, interest: 0, royalties: 0 },
  'South Africa': { dividends: 15, interest: 10, royalties: 0 },
  'Belgium': { dividends: 15, interest: 0, royalties: 0 },
  'Hong Kong': { dividends: 30, interest: 30, royalties: 30, note: 'No US tax treaty — the default 30% rate applies' },
}

const INCOME_TYPES: { key: IncomeKey; label: string }[] = [
  { key: 'dividends', label: 'Dividends' },
  { key: 'interest', label: 'Interest' },
  { key: 'royalties', label: 'Royalties' },
]

const DEFAULT_RATE = 30
const countries = Object.keys(TREATY_RATES).sort()

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function W8BenCalculator() {
  const [country, setCountry] = useState('United Kingdom')
  const [incomeType, setIncomeType] = useState<IncomeKey>('royalties')
  const [income, setIncome] = useState(10000)

  useEffect(() => {
    document.title = 'W-8BEN Withholding Tax Calculator — 30% vs Treaty Rate | TaxFlow'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', 'Free calculator: see how much US tax a missing W-8BEN costs you. Compare the default 30% withholding against your country’s tax-treaty rate.')
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canon) {
      canon = document.createElement('link')
      canon.setAttribute('rel', 'canonical')
      document.head.appendChild(canon)
    }
    canon.setAttribute('href', 'https://tax.flowingpulse.com/tools/w8ben-withholding-calculator')
  }, [])

  const treatyRate = TREATY_RATES[country][incomeType]
  const withheldDefault = (income * DEFAULT_RATE) / 100
  const withheldTreaty = (income * treatyRate) / 100
  const saved = withheldDefault - withheldTreaty
  const note = TREATY_RATES[country].note

  return (
    <div className="min-h-screen bg-[#0a0e27] text-slate-200">
      <header className="border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            </div>
            <span className="font-bold text-xl text-white">TaxFlow</span>
          </a>
          <a href="/tools" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"><ArrowLeft size={14} /> Free Tools</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 mb-4">
            <Calculator size={13} /> Free Tool
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">W-8BEN Withholding Tax Calculator</h1>
          <p className="text-slate-400 max-w-2xl leading-relaxed">
            Without a valid W-8BEN, US payers withhold tax at the default <span className="text-white font-semibold">30%</span> statutory rate. File the right form and your country’s tax treaty can cut that dramatically. See what a missing — or expired — form really costs you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Your country of residence</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
              >
                {countries.map((c) => (<option key={c} value={c} className="bg-slate-900">{c}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">US-source income type</label>
              <div className="grid grid-cols-3 gap-2">
                {INCOME_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setIncomeType(t.key)}
                    className={'py-2.5 rounded-xl text-sm font-medium transition-all ' + (incomeType === t.key ? 'bg-cyan-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10')}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Annual US-source income (USD)</label>
              <input
                type="number"
                min={0}
                value={income}
                onChange={(e) => setIncome(Math.max(0, Number(e.target.value) || 0))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {note && (
              <div className="flex items-start gap-2 text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{note}.</span>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-red-300 text-sm font-medium mb-1"><TrendingDown size={15} /> Without W-8BEN</div>
              <div className="text-3xl font-extrabold text-white">{fmt(withheldDefault)}</div>
              <div className="text-sm text-red-300/80">withheld at the default {DEFAULT_RATE}% rate</div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium mb-1"><ShieldCheck size={15} /> With W-8BEN (treaty rate)</div>
              <div className="text-3xl font-extrabold text-white">{fmt(withheldTreaty)}</div>
              <div className="text-sm text-emerald-300/80">withheld at the {treatyRate}% treaty rate</div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border border-cyan-500/30 rounded-2xl p-6 text-center">
              <div className="text-sm text-cyan-300 mb-1">You keep with a valid W-8BEN</div>
              <div className="text-4xl font-extrabold text-white">{fmt(saved)}</div>
              <div className="text-sm text-cyan-200/80 mt-1">more of your income, every year</div>
            </div>
          </div>
        </div>

        {/* Visual bar */}
        <div className="mt-8 bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <div className="mb-2 flex justify-between text-sm text-slate-400">
            <span>Withholding comparison</span>
            <span>{DEFAULT_RATE}% → {treatyRate}%</span>
          </div>
          <div className="relative h-4 rounded-full bg-red-500/30 overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${100 - (treatyRate / DEFAULT_RATE) * 100}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-3">Green = income you keep. Red = tax withheld. A valid W-8BEN shifts the split in your favor.</p>
        </div>

        <div className="mt-10 bg-white/[0.03] border border-cyan-500/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Never let a form lapse again</h2>
          <p className="text-slate-400 text-sm mb-5 max-w-lg mx-auto">TaxFlow tracks every W-8BEN you file and reminds you before it expires — so you never slip back to the 30% default.</p>
          <a href="/#pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
            Start free with TaxFlow <ArrowRight size={15} />
          </a>
        </div>

        <p className="text-xs text-slate-600 mt-8 leading-relaxed">
          This calculator provides a general educational estimate using typical US tax-treaty rates. Actual withholding depends on your specific circumstances, ownership percentage, and the precise treaty article applied. It is not tax advice — consult a qualified tax professional for your situation.
        </p>
      </main>
    </div>
  )
}

export default W8BenCalculator
