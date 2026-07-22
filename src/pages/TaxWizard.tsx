import { useState, useEffect } from 'react'
import { Calculator, ChevronRight, ChevronLeft, Download, Loader2, Lock } from 'lucide-react'
import { generateW8BENPDF, loadW8BENTemplate } from '@/lib/generateW8BEN'
import { checkW8BENUsage, recordW8BENUsage } from '@/lib/w8benUsage'
import { useAuthStore } from '@/stores/authStore'
import { useI18n } from '@/hooks/useI18n'

const countries = [
  'China', 'United Kingdom', 'Germany', 'France', 'Japan', 'Canada',
  'Australia', 'India', 'Brazil', 'Netherlands', 'Singapore', 'Other',
]

const treatyCountries = [
  { country: 'China', article: 'Article 12 (Royalties)', rate: 10 },
  { country: 'United Kingdom', article: 'Article 7 (Business Profits)', rate: 0 },
  { country: 'Germany', article: 'Article 7 (Business Profits)', rate: 0 },
  { country: 'Japan', article: 'Article 7 (Business Profits)', rate: 0 },
  { country: 'Canada', article: 'Article 7 (Business Profits)', rate: 0 },
  { country: 'India', article: 'Article 7 (Business Profits)', rate: 0 },
]

export function TaxWizard() {
  const { t } = useI18n()
  const { user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [usage, setUsage] = useState<{ allowed: boolean; used: number; limit: number; hasSubscription: boolean } | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    country: '',
    permanentAddress: '',
    mailingAddress: '',
    dateOfBirth: '',
    nationality: '',
    hasUsTin: false,
    usTin: '',
    foreignTin: '',
    isUsPerson: false,
    claimTreaty: false,
    treatyCountry: '',
    treatyArticle: '',
    treatyRate: 10,
    signature: '',
  })

  useEffect(() => {
    checkW8BENUsage(user?.id).then(setUsage)
  }, [user])

  const steps = [
    t('tax.personalInfo'),
    t('tax.taxResidence'),
    t('tax.usTaxStatus'),
    t('tax.treatyBenefits'),
    t('tax.certification'),
  ]

  function updateForm(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function handleNext() {
    if (step < steps.length - 1) setStep(step + 1)
  }

  function handleBack() {
    if (step > 0) setStep(step - 1)
  }

  async function handleGeneratePDF() {
    if (!formData.fullName || !formData.country) {
      alert(t('common.error'))
      return
    }

    const currentUsage = await checkW8BENUsage(user?.id)
    if (!currentUsage.allowed) {
      setUsage(currentUsage)
      return
    }

    setGenerating(true)
    try {
      const templateBytes = await loadW8BENTemplate()

      const pdfBytes = await generateW8BENPDF({
        fullName: formData.fullName,
        country: formData.country,
        permanentAddress: formData.permanentAddress,
        mailingAddress: formData.mailingAddress,
        usTin: formData.hasUsTin ? formData.usTin : undefined,
        foreignTin: formData.foreignTin,
        dateOfBirth: formData.dateOfBirth,
        claimTreaty: formData.claimTreaty,
        treatyCountry: formData.treatyCountry,
        treatyArticle: formData.treatyArticle,
        treatyRate: formData.treatyRate,
        signature: formData.signature,
      }, templateBytes)

      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `W-8BEN-${formData.fullName.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      await recordW8BENUsage(user?.id)
      const newUsage = await checkW8BENUsage(user?.id)
      setUsage(newUsage)
    } catch (error) {
      console.error('[TaxWizard] Failed to generate PDF:', error)
      const errMsg = error instanceof Error ? error.message : String(error)
      alert(`Error: ${errMsg}`)
    } finally {
      setGenerating(false)
    }
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">{t('tax.personalInfo')}</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('tax.legalName')} *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => updateForm('fullName', e.target.value)}
                placeholder={t('tax.namePlaceholder')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('tax.dateOfBirth')}</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateForm('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('tax.nationality')}</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => updateForm('nationality', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">{t('tax.taxResidence')}</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('tax.country')} *</label>
              <select
                value={formData.country}
                onChange={(e) => updateForm('country', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="">{t('tax.selectCountry')}</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('tax.permanentAddress')} *</label>
              <textarea
                value={formData.permanentAddress}
                onChange={(e) => updateForm('permanentAddress', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('tax.mailingAddress')}</label>
              <textarea
                value={formData.mailingAddress}
                onChange={(e) => updateForm('mailingAddress', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">{t('tax.usTaxStatus')}</h2>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <p className="text-sm text-amber-800">
                {t('tax.usTaxWarning')}
              </p>
            </div>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={formData.isUsPerson}
                  onChange={(e) => updateForm('isUsPerson', e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium">{t('tax.usPerson')}</p>
                  <p className="text-sm text-slate-500">{t('tax.usPersonDesc')}</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={formData.hasUsTin}
                  onChange={(e) => updateForm('hasUsTin', e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium">{t('tax.hasUsTin')}</p>
                  <p className="text-sm text-slate-500">{t('tax.hasUsTinDesc')}</p>
                </div>
              </label>
            </div>
            {formData.hasUsTin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('tax.usTin')}</label>
                <input
                  type="text"
                  value={formData.usTin}
                  onChange={(e) => updateForm('usTin', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('tax.foreignTin')}</label>
              <input
                type="text"
                value={formData.foreignTin}
                onChange={(e) => updateForm('foreignTin', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">{t('tax.treatyBenefits')}</h2>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                {t('tax.treatyInfo')}
              </p>
            </div>
            <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={formData.claimTreaty}
                onChange={(e) => updateForm('claimTreaty', e.target.checked)}
                className="mt-1"
              />
              <div>
                <p className="font-medium">{t('tax.claimTreaty')}</p>
                <p className="text-sm text-slate-500">{t('tax.claimTreatyDesc')}</p>
              </div>
            </label>
            {formData.claimTreaty && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('tax.treatyCountry')}</label>
                  <select
                    value={formData.treatyCountry}
                    onChange={(e) => {
                      const treaty = treatyCountries.find((t) => t.country === e.target.value)
                      updateForm('treatyCountry', e.target.value)
                      updateForm('treatyArticle', treaty?.article || '')
                      updateForm('treatyRate', treaty?.rate || 0)
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="">{t('tax.selectCountry')}</option>
                    {treatyCountries.map((t) => (
                      <option key={t.country} value={t.country}>{t.country}</option>
                    ))}
                  </select>
                </div>
                {formData.treatyCountry && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm"><strong>{t('tax.article')}</strong> {formData.treatyArticle}</p>
                    <p className="text-sm"><strong>{t('tax.reducedRate')}</strong> {formData.treatyRate}%</p>
                  </div>
                )}
              </>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">{t('tax.certification')}</h2>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 mb-4">
              <p className="mb-2">
                {t('tax.certificationText')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('tax.signature')} *</label>
              <input
                type="text"
                value={formData.signature}
                onChange={(e) => updateForm('signature', e.target.value)}
                placeholder={t('tax.signaturePlaceholder')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="text-xs text-slate-500">
              Date: {new Date().toLocaleDateString()}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Calculator size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('tax.title')}</h1>
          <p className="text-slate-500 mt-0.5">{t('tax.subtitle')}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i <= step ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-0.5 ${i < step ? 'bg-primary' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        {renderStep()}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50"
        >
          <ChevronLeft size={16} /> {t('tax.back')}
        </button>
        {step === steps.length - 1 ? (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleGeneratePDF}
              disabled={generating || (usage ? !usage.allowed : false)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('tax.generating')}
                </>
              ) : usage && !usage.allowed ? (
                <>
                  <Lock size={16} />
                  {t('tax.generatePdf')}
                </>
              ) : (
                <>
                  <Download size={16} />
                  {t('tax.generatePdf')}
                </>
              )}
            </button>
            {usage && !usage.hasSubscription && (
              <span className="text-xs text-slate-400">
                {usage.used}/{usage.limit} {t('tax.freeUsed')}
              </span>
            )}
          </div>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            {t('tax.next')} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
