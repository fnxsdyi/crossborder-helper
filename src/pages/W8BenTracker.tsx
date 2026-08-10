'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit, Trash2, Clock, AlertTriangle, Info } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import type { W8BenTracker as Tracker } from '@/db'
import {
  listTrackers,
  addTracker,
  updateTracker,
  deleteTracker,
  computeExpiry,
  daysUntil,
  trackerStatus,
  type TrackerStatus,
} from '@/lib/w8benTrackers'

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fromDateInput(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const STATUS_STYLE: Record<TrackerStatus, string> = {
  expired: 'bg-red-50 text-red-600 border-red-200',
  urgent: 'bg-orange-50 text-orange-600 border-orange-200',
  soon: 'bg-amber-50 text-amber-600 border-amber-200',
  ok: 'bg-emerald-50 text-emerald-600 border-emerald-200',
}

const STATUS_KEY: Record<TrackerStatus, 'trackers.statusExpired' | 'trackers.statusUrgent' | 'trackers.statusSoon' | 'trackers.statusOk'> = {
  expired: 'trackers.statusExpired',
  urgent: 'trackers.statusUrgent',
  soon: 'trackers.statusSoon',
  ok: 'trackers.statusOk',
}

export function W8BenTracker() {
  const { t } = useI18n()
  const [trackers, setTrackers] = useState<Tracker[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Tracker | null>(null)

  const [platform, setPlatform] = useState('')
  const [country, setCountry] = useState('')
  const [submittedAt, setSubmittedAt] = useState(toDateInput(new Date()))
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setTrackers(await listTrackers())
    } catch (err) {
      console.error('Failed to load W-8BEN trackers:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function resetForm() {
    setPlatform('')
    setCountry('')
    setSubmittedAt(toDateInput(new Date()))
    setExpiresAt('')
    setNotes('')
  }

  function handleCreate() {
    setEditing(null)
    resetForm()
    setShowForm(true)
  }

  function handleEdit(tracker: Tracker) {
    setEditing(tracker)
    setPlatform(tracker.platform)
    setCountry(tracker.country || '')
    setSubmittedAt(toDateInput(tracker.submittedAt))
    setExpiresAt(toDateInput(tracker.expiresAt))
    setNotes(tracker.notes || '')
    setShowForm(true)
  }

  async function handleSave() {
    if (!platform.trim() || !submittedAt) return
    const input = {
      platform,
      country,
      submittedAt: fromDateInput(submittedAt),
      expiresAt: expiresAt ? fromDateInput(expiresAt) : undefined,
      notes,
    }
    try {
      if (editing?.id) {
        await updateTracker(editing.id, input)
      } else {
        await addTracker(input)
      }
      setShowForm(false)
      load()
    } catch (err) {
      console.error('Failed to save W-8BEN tracker:', err)
      alert(t('common.error'))
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return
    if (!confirm(t('common.confirm'))) return
    try {
      await deleteTracker(id)
      load()
    } catch (err) {
      console.error('Failed to delete W-8BEN tracker:', err)
      alert(t('common.error'))
    }
  }

  if (showForm) {
    const preview = submittedAt ? computeExpiry(fromDateInput(submittedAt)) : null

    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            {editing ? t('trackers.editTracker') : t('trackers.newTracker')}
          </h1>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg">
              {t('common.cancel')}
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
              {t('common.save')}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('trackers.platform')} *</label>
                <input
                  type="text"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder={t('trackers.platformPlaceholder')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('trackers.country')}</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('trackers.submittedAt')} *</label>
                <input
                  type="date"
                  value={submittedAt}
                  onChange={(e) => setSubmittedAt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('trackers.expiresAt')}</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
                {!expiresAt && preview && (
                  <p className="text-xs text-slate-400 mt-1">
                    {t('trackers.autoExpiry', { date: toDateInput(preview) })}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('trackers.notes')}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('trackers.title')}</h1>
          <p className="text-slate-500 mt-1">{t('trackers.subtitle')}</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus size={18} />
          {t('trackers.newTracker')}
        </button>
      </div>

      <div className="flex items-start gap-2 mb-6 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-500">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>{t('trackers.irsRule')}</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">{t('common.loading')}</p>
        </div>
      ) : trackers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Clock size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">{t('trackers.empty')}</h3>
          <p className="text-slate-400 mb-4">{t('trackers.addFirst')}</p>
          <button onClick={handleCreate} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
            {t('trackers.newTracker')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trackers.map((tracker) => {
            const status = trackerStatus(tracker.expiresAt)
            const days = daysUntil(tracker.expiresAt)
            return (
              <div key={tracker.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{tracker.platform}</h3>
                    {tracker.country && <p className="text-sm text-slate-500">{tracker.country}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(tracker)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(tracker.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium mb-3 ${STATUS_STYLE[status]}`}>
                  {status === 'expired' || status === 'urgent' ? <AlertTriangle size={12} /> : <Clock size={12} />}
                  {t(STATUS_KEY[status])}
                </span>

                <div className="space-y-1.5 text-sm text-slate-500">
                  <p>{t('trackers.submittedAt')}: {toDateInput(tracker.submittedAt)}</p>
                  <p>{t('trackers.expiresAt')}: {toDateInput(tracker.expiresAt)}</p>
                  <p className="text-xs text-slate-400">
                    {days < 0
                      ? t('trackers.expiredDaysAgo', { days: String(Math.abs(days)) })
                      : t('trackers.daysLeft', { days: String(days) })}
                  </p>
                  {tracker.notes && <p className="text-xs text-slate-400">{tracker.notes}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
