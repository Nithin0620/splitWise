import { useState } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'JPY', 'AED']

export default function CreateTripModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', description: '', startDate: '', endDate: '', currency: 'INR',
  })
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Trip name is required')
    setSaving(true)
    try {
      const { data } = await api.post('/trips', {
        name: form.name.trim(),
        description: form.description.trim(),
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        currency: form.currency,
      })
      onCreated(data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create trip')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-heading-md">New trip</h2>
          <p className="text-body-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Fill in the details to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="label">Trip name *</label>
            <input className="input" placeholder="e.g. Goa 2026" value={form.name} onChange={set('name')} autoFocus />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="textarea" rows={2} placeholder="Optional — a short note about this trip"
              value={form.description} onChange={set('description')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start date</label>
              <input type="date" className="input" value={form.startDate} onChange={set('startDate')} />
            </div>
            <div>
              <label className="label">End date</label>
              <input type="date" className="input" value={form.endDate} onChange={set('endDate')} />
            </div>
          </div>

          <div>
            <label className="label">Currency</label>
            <select className="select" value={form.currency} onChange={set('currency')}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-ghost flex-1" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Creating…' : 'Create trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
