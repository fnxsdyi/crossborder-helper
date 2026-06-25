import { useEffect, useState } from 'react'
import db, { type Client } from '@/db'
import { Plus, Users, Edit, Trash2, Mail, Globe } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'

export function Clients() {
  const { t } = useI18n()
  const [clients, setClients] = useState<Client[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [address, setAddress] = useState('')
  const [country, setCountry] = useState('')
  const [vatNumber, setVatNumber] = useState('')

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    const data = await db.clients.toArray()
    setClients(data)
  }

  function handleCreate() {
    setEditingClient(null)
    setName('')
    setEmail('')
    setCompany('')
    setAddress('')
    setCountry('')
    setVatNumber('')
    setShowForm(true)
  }

  function handleEdit(client: Client) {
    setEditingClient(client)
    setName(client.name)
    setEmail(client.email)
    setCompany(client.company || '')
    setAddress(client.address || '')
    setCountry(client.country)
    setVatNumber(client.vatNumber || '')
    setShowForm(true)
  }

  async function handleSave() {
    const clientData = {
      name,
      email,
      company,
      address,
      country,
      vatNumber,
      createdAt: editingClient?.createdAt || new Date(),
    }

    if (editingClient?.id) {
      await db.clients.update(editingClient.id, clientData)
    } else {
      await db.clients.add(clientData as Client)
    }
    setShowForm(false)
    loadClients()
  }

  async function handleDelete(id: number) {
    if (confirm(t('common.confirm'))) {
      await db.clients.delete(id)
      loadClients()
    }
  }

  if (showForm) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            {editingClient ? t('clients.editClient') : t('clients.newClient')}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('clients.name')} *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('clients.email')} *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('clients.company')}</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('clients.address')}</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('clients.country')} *</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('clients.vatNumber')}</label>
                <input
                  type="text"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
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
          <h1 className="text-2xl font-bold text-slate-900">{t('clients.title')}</h1>
          <p className="text-slate-500 mt-1">{t('clients.subtitle')}</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus size={18} />
          {t('clients.newClient')}
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Users size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">{t('clients.noClients')}</h3>
          <p className="text-slate-400 mb-4">{t('clients.addFirst')}</p>
          <button onClick={handleCreate} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
            {t('clients.newClient')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div key={client.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{client.name}</h3>
                  {client.company && <p className="text-sm text-slate-500">{client.company}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(client)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(client.id!)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Mail size={14} />
                  {client.email}
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={14} />
                  {client.country}
                </div>
                {client.vatNumber && (
                  <p className="text-xs text-slate-400">VAT: {client.vatNumber}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
