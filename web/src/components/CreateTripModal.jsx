import { useState } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'JPY', 'AED']

const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '')

export default function CreateTripModal({ trip, onClose, onCreated }) {
  const isEdit = !!trip
  const [form, setForm] = useState({
    name: trip?.name ?? '',
    description: trip?.description ?? '',
    startDate: toInputDate(trip?.startDate),
    endDate: toInputDate(trip?.endDate),
    currency: trip?.currency ?? 'INR',
  })
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Trip name is required')
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      return toast.error('End date cannot be before start date')
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        currency: form.currency,
      }
      const { data } = isEdit
        ? await api.put(`/trips/${trip._id}`, payload)
        : await api.post('/trips', payload)
      toast.success(isEdit ? 'Trip updated' : `"${data.data.name}" created!`)
      onCreated?.(data.data)
      onClose?.()
    } catch (err) {
      toast.error(err.response?.data?.message || (isEdit ? 'Failed to update trip' : 'Failed to create trip'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-heading-md">{isEdit ? 'Edit trip' : 'New trip'}</h2>
          <p className="text-body-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {isEdit ? 'Update the details for this trip.' : 'Fill in the details to get started.'}
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
              <input type="date" className="input" value={form.endDate} onChange={set('endDate')}
                     min={form.startDate || undefined} />
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
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
