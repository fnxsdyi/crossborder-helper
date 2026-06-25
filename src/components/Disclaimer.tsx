import { useI18n } from '@/hooks/useI18n'

export function Disclaimer() {
  const { t } = useI18n()
  return (
    <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-500 dark:text-slate-400 text-center border border-slate-200 dark:border-slate-700">
      <p className="mb-1">
        <strong>{t('disclaimer.title')}</strong> {t('disclaimer.text')}
      </p>
    </div>
  )
}
