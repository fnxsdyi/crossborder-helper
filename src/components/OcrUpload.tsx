import { useRef, useState } from 'react'
import { Camera, Image, Loader2 } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { useOcrStore } from '@/stores/ocrStore'
import { useAuthStore } from '@/stores/authStore'
import { recognizeInvoice } from '@/lib/ocrApi'
import { checkOcrUsage, recordOcrUsage, simpleHash } from '@/lib/ocrUsage'
import { OCR_FREE_LIMIT } from '@/lib/config'
import { OcrUsageLimit } from './OcrUsageLimit'

interface OcrUploadProps {
  onResult: () => void
}

export function OcrUpload({ onResult }: OcrUploadProps) {
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuthStore()
  const { setImage, setResult, setLoading, setError, loading, error, usageCount, setUsageCount, hasSubscription, setHasSubscription } = useOcrStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [checkedUsage, setCheckedUsage] = useState(false)

  async function checkUsage() {
    if (!user?.id) {
      const guestUsed = parseInt(localStorage.getItem('ocr_guest_used') || '0', 10)
      setUsageCount(guestUsed)
      setHasSubscription(false)
      setCheckedUsage(true)
      return { allowed: guestUsed < OCR_FREE_LIMIT, used: guestUsed, limit: OCR_FREE_LIMIT, hasSubscription: false }
    }
    try {
      const usage = await checkOcrUsage(user.id)
      setUsageCount(usage.used)
      setHasSubscription(usage.hasSubscription)
      setCheckedUsage(true)
      return usage
    } catch (err) {
      console.error('Failed to check OCR usage:', err)
      return { allowed: true, used: 0, limit: OCR_FREE_LIMIT, hasSubscription: false }
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(t('ocr.errorSize'))
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(t('ocr.errorSize'))
      return
    }

    setUploading(true)
    setError(null)

    try {
      const usage = await checkUsage()
      if (usage && !usage.allowed) {
        setUploading(false)
        return
      }

      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = reader.result as string
          setImage(base64)
          setLoading(true)

          const result = await recognizeInvoice(base64)
          setResult(result)

          if (user?.id) {
            const hash = await simpleHash(base64.slice(0, 1000))
            await recordOcrUsage(user.id, hash)
            setUsageCount(usageCount + 1)
          } else {
            const current = parseInt(localStorage.getItem('ocr_guest_used') || '0', 10)
            localStorage.setItem('ocr_guest_used', String(current + 1))
            setUsageCount(current + 1)
          }

          onResult()
        } catch (err) {
          console.error('OCR recognition error:', err)
          const msg = err instanceof Error ? err.message : 'UNKNOWN'
          switch (msg) {
            case 'IMAGE_TOO_LARGE':
              setError(t('ocr.errorSize'))
              break
            case 'TIMEOUT':
              setError(t('ocr.errorTimeout'))
              break
            case 'API_KEY_MISSING':
              setError(t('ocr.errorApiKey'))
              break
            case 'API_ERROR':
            case 'EMPTY_RESPONSE':
            case 'INVALID_RESPONSE':
            case 'RECOGNITION_FAILED':
              setError(t('ocr.errorApi'))
              break
            case 'Failed to load image':
              setError('Failed to load image. Please try another file.')
              break
            default:
              setError(t('ocr.errorTimeout'))
          }
        } finally {
          setLoading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      setError(t('ocr.errorTimeout'))
    } finally {
      setUploading(false)
    }

    e.target.value = ''
  }

  const isLimitReached = checkedUsage && !hasSubscription && usageCount >= OCR_FREE_LIMIT
  const showSpinner = authLoading
  const showLimit = !authLoading && isLimitReached
  const showUpload = !authLoading && !isLimitReached

  return (
    <div className="max-w-md mx-auto">
      {/* Always render a stable spinner slot */}
      <div style={{ display: showSpinner ? undefined : 'none' }}>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>

      {/* Always render a stable limit-reached slot */}
      <div style={{ display: showLimit ? undefined : 'none' }}>
        <OcrUsageLimit used={usageCount} limit={OCR_FREE_LIMIT} />
      </div>

      {/* Always render a stable upload UI slot */}
      <div style={{ display: showUpload ? undefined : 'none' }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera size={32} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {t('ocr.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t('ocr.description')}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'image/*'
                fileInputRef.current.setAttribute('capture', 'environment')
                fileInputRef.current.click()
              }
            }}
            disabled={loading || uploading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading || uploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Camera size={20} />
            )}
            {loading ? t('ocr.recognizing') : t('ocr.takePhoto')}
          </button>

          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'image/jpeg,image/png,image/webp'
                fileInputRef.current.removeAttribute('capture')
                fileInputRef.current.click()
              }
            }}
            disabled={loading || uploading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <Image size={20} />
            {t('ocr.chooseGallery')}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {!hasSubscription && (
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {t('ocr.freeUsed', { used: String(usageCount), limit: String(OCR_FREE_LIMIT) })}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
