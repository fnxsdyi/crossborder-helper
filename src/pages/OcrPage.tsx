import { useState } from 'react'
import { useOcrStore } from '@/stores/ocrStore'
import { useAppStore } from '@/stores/appStore'
import { OcrUpload } from '@/components/OcrUpload'
import { OcrResult } from '@/components/OcrResult'

export function OcrPage() {
  const { reset } = useOcrStore()
  const { setCurrentView } = useAppStore()
  const [view, setView] = useState<'upload' | 'result'>('upload')

  function handleResult() {
    setView('result')
  }

  function handleRescan() {
    reset()
    setView('upload')
  }

  function handleSaved() {
    reset()
    setCurrentView('invoices')
  }

  const isUpload = view === 'upload'

  return (
    <div>
      <div style={{ display: isUpload ? undefined : 'none' }}>
        <OcrUpload onResult={handleResult} />
      </div>
      <div style={{ display: isUpload ? 'none' : undefined }}>
        <OcrResult onRescan={handleRescan} onSaved={handleSaved} />
      </div>
    </div>
  )
}
