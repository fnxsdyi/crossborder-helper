import { useState, useEffect } from 'react'
import { ArrowLeft, CheckSquare, Square, ListChecks, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react'

type ChecklistItem = { id: string; label: string; hint: string }
type ChecklistSection = { part: string; intro: string; items: ChecklistItem[] }

// Form W-8BEN (Rev. 2021) field structure. Educational checklist only — not a filing substitute.
const SECTIONS: ChecklistSection[] = [
  {
    part: 'Part I — Identification of Beneficial Owner',
    intro: 'Who you are. Errors in this section are the most common reason a form gets rejected or ignored by a payer.',
    items: [
      { id: 'name', label: 'Full legal name (last, first, middle)', hint: 'Use the name on your passport, not a brand or nickname. A mismatch can void the form.' },
      { id: 'citizenship', label: 'Country of citizenship', hint: 'Your passport country — even if you live elsewhere. This drives your treaty eligibility.' },
      { id: 'address', label: 'Permanent residence address', hint: 'A real street address, not a PO box, unless your country has no street system.' },
      { id: 'mailing', label: 'Mailing address (if different)', hint: 'Skip if it matches your residence address. Leave blank rather than repeating.' },
      { id: 'tin', label: 'U.S. TIN or foreign tax ID', hint: 'Enter your SSN/ITIN if you have one; otherwise your foreign tax ID. Never leave both blank without explanation.' },
      { id: 'dob', label: 'Date of birth (if no U.S. TIN)', hint: 'Required only when you do not provide a U.S. taxpayer identification number.' },
    ],
  },
  {
    part: 'Part II — Claim of Tax Treaty Benefits',
    intro: 'This is where you claim a lower withholding rate. Get the country and article wrong and you slip back to the default 30%.',
    items: [
      { id: 'treatycountry', label: 'Country of residence for treaty purposes', hint: 'Usually your country of citizenship/residence. This is the country whose treaty you claim.' },
      { id: 'article', label: 'Treaty article and paragraph (or "None")', hint: 'Name the specific article that grants the reduced rate. If no claim, write "None" — do not leave it blank.' },
      { id: 'special', label: 'Special rates or conditions (if any)', hint: 'Only fill this if your treaty has a special provision for your income type. Most freelancers leave it blank.' },
    ],
  },
  {
    part: 'Part III — Certification',
    intro: 'The signature under penalties of perjury. A missing or undated signature makes the whole form invalid.',
    items: [
      { id: 'sign', label: 'Sign under penalties of perjury', hint: 'Must be signed by you (the beneficial owner), not the payer. Electronic signatures are accepted by most payers.' },
      { id: 'capacity', label: 'Capacity in which you sign', hint: 'If signing as an individual, write "self" or your own name. Only use another capacity if acting on behalf of someone else.' },
      { id: 'date', label: 'Date of signing', hint: 'An undated certification is invalid. Keep the date current — a stale form is a common rejection cause.' },
    ],
  },
]

const ALL_IDS = SECTIONS.flatMap((s) => s.items.map((i) => i.id))

export function W8BenChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  useEffect(() => {
    document.title = 'W-8BEN Form Checklist — How to Fill Out Form W-8BEN Correctly | TaxFlow'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', 'Step-by-step W-8BEN form checklist for freelancers. Fill out Form W-8BEN correctly and avoid the 30% backup withholding that comes from common mistakes.')
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canon) {
      canon = document.createElement('link')
      canon.setAttribute('rel', 'canonical')
      document.head.appendChild(canon)
    }
    canon.setAttribute('href', 'https://tax.flowingpulse.com/tools/w8ben-checklist')
  }, [])

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const done = checked.size
  const pct = Math.round((done / ALL_IDS.length) * 100)

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
            <ListChecks size={13} /> Free Tool
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">W-8BEN Form Checklist</h1>
          <p className="text-slate-400 max-w-2xl leading-relaxed">
            A clean, field-by-field checklist for filling out <span className="text-white font-semibold">Form W-8BEN</span> the right way. Tick each item as you go — and avoid the common mistakes that push US payers back to the default <span className="text-white font-semibold">30% withholding</span>.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-300 font-medium flex items-center gap-2"><ShieldCheck size={15} className="text-cyan-300" /> Completion</span>
            <span className="text-sm text-cyan-300 font-semibold">{done} / {ALL_IDS.length} · {pct}%</span>
          </div>
          <div className="relative h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.part}>
              <h2 className="text-lg font-bold text-white mb-1">{section.part}</h2>
              <p className="text-sm text-slate-500 mb-4">{section.intro}</p>
              <div className="space-y-3">
                {section.items.map((item) => {
                  const isOn = checked.has(item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggle(item.id)}
                      className={'w-full text-left rounded-xl border p-4 transition-all ' + (isOn ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/[0.02] border-white/10 hover:border-white/20')}
                    >
                      <div className="flex items-start gap-3">
                        {isOn ? <CheckSquare size={20} className="text-cyan-300 mt-0.5 flex-shrink-0" /> : <Square size={20} className="text-slate-500 mt-0.5 flex-shrink-0" />}
                        <div>
                          <div className={'font-medium ' + (isOn ? 'text-white line-through decoration-cyan-400/60' : 'text-slate-200')}>{item.label}</div>
                          <div className="flex items-start gap-2 mt-1.5 text-xs text-slate-400 leading-relaxed">
                            <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-amber-400/80" />
                            <span>{item.hint}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border border-cyan-500/30 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">This is the lightweight version</h2>
          <p className="text-slate-400 text-sm mb-5 max-w-lg mx-auto">
            TaxFlow generates the full W-8BEN for you, stores every version, and reminds you before each form expires — so a single missed date never trips the 30% default again.
          </p>
          <a href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
            Get the full version <ArrowRight size={15} />
          </a>
        </div>

        <p className="text-xs text-slate-600 mt-8 leading-relaxed">
          This checklist follows the general structure of Form W-8BEN (Rev. 2021) for educational purposes. It is not a substitute for the official IRS form, legal guidance, or advice from a qualified tax professional. Always verify against the current IRS instructions for your situation.
        </p>
      </main>
    </div>
  )
}

export default W8BenChecklist
