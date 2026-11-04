import { useState } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function RecordSettlementModal({ trip, balances, initial, onClose, onSaved }) {
  // Pre-fill from an explicit transaction (partial payments) or the first suggestion
  const firstTx = initial || balances?.transactions?.[0]
  const [form, setForm] = useState({
    fromUser: firstTx?.from?._id ?? '',
    toUser:   firstTx?.to?._id   ?? '',
    amount:   firstTx?.amount    ?? '',
    notes:    '',
    settledAt: new Date().toISOString().slice(0, 10),
  })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fromUser || !form.toUser) return toast.error('Select both payer and receiver')
    if (form.fromUser === form.toUser)  return toast.error('Payer and receiver must be different')
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) return toast.error('Enter a valid amount')

    setSaving(true)
    try {
      await api.post(`/settlements/trip/${trip._id}`, {
        fromUser: form.fromUser,
        toUser:   form.toUser,
        amount:   amt,
        notes:    form.notes.trim(),
        settledAt: form.settledAt,
      })
      toast.success('Payment recorded')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-heading-md">Record a payment</h2>
          <p className="text-body-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Log that someone paid someone back.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Suggested settlements quick-fill */}
          {balances?.transactions?.length > 0 && (
            <div>
              <label className="label">Suggested</label>
              <div className="flex flex-col gap-2">
                {balances.transactions.slice(0, 3).map((t, i) => (
                  <button key={i} type="button"
                          onClick={() => setForm((p) => ({ ...p, fromUser: t.from._id, toUser: t.to._id, amount: t.amount }))}
                          className="flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors"
                          style={{ backgroundColor: 'var(--color-neutral)', border: 'none', cursor: 'pointer' }}>
                    <span className="text-body-sm">
                      <strong>{t.from?.name}</strong> → <strong>{t.to?.name}</strong>
                    </span>
                    <span className="text-body-sm font-medium">
                      {trip.currency} {t.amount.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label">Who paid?</label>
            <select className="select" value={form.fromUser} onChange={set('fromUser')}>
              <option value="">Select…</option>
              {trip.members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Paid to?</label>
            <select className="select" value={form.toUser} onChange={set('toUser')}>
              <option value="">Select…</option>
              {trip.members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount ({trip.currency})</label>
              <input type="number" min="0" step="0.01" className="input"
                     placeholder="0.00" value={form.amount} onChange={set('amount')} />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.settledAt} onChange={set('settledAt')} />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <input className="input" placeholder="Optional note" value={form.notes} onChange={set('notes')} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-ghost flex-1" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving…' : 'Record payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
