import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useI18n } from '@/hooks/useI18n'
import { PRO_MONTHLY_PLAN_ID } from '@/lib/config'
import { Mail, Lock, LogIn, Globe, CreditCard, UserPlus } from 'lucide-react'

interface AuthPageProps {
  onAuth: () => void
  showWelcome?: boolean
}

export function AuthPage({ onAuth, showWelcome: initialShowWelcome }: AuthPageProps) {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(initialShowWelcome || false)
  const { signIn, signUp } = useAuthStore()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn(email, password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      onAuth()
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signUp(email, password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      onAuth()
    }
  }

  function handleBecomeMember() {
    const token = Date.now().toString(36) + Math.random().toString(36).slice(2)
    localStorage.setItem('paypal_pending_token', JSON.stringify({
      token,
      timestamp: Date.now(),
      planType: 'monthly',
      planId: PRO_MONTHLY_PLAN_ID
    }))
    const returnUrl = encodeURIComponent(window.location.origin + `/?token=${token}&plan=monthly`)
    window.location.href = `https://www.paypal.com/ncp/payment/${PRO_MONTHLY_PLAN_ID}?return=${returnUrl}`
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Globe size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">TaxFlow</h1>
          <p className="text-slate-500 mt-1">{t('landing.footerDesc')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {/* Tab Switcher */}
          <div className="flex mb-6 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => { setIsRegister(false); setError('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                !isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('auth.signIn')}
            </button>
            <button
              onClick={() => { setIsRegister(true); setError('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('auth.signUp')}
            </button>
          </div>

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : isRegister ? (
                <>
                  <UserPlus size={18} />
                  {t('auth.signUp')}
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  {t('auth.signIn')}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <button
              onClick={handleBecomeMember}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <CreditCard size={18} />
              {t('auth.becomeMember')}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                localStorage.removeItem('app_entered')
                window.location.reload()
              }}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              ← {t('auth.backToHome')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
