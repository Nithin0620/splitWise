import { useState, useEffect } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['food', 'transport', 'accommodation', 'entertainment', 'shopping', 'other']
const CAT_EMOJI  = { food: '🍽️', transport: '🚗', accommodation: '🏨', entertainment: '🎭', shopping: '🛍️', other: '📦' }

export default function AddExpenseModal({ trip, expense, onClose, onSaved }) {
  const { user } = useAuth()
  const isEdit = !!expense

  const [form, setForm] = useState({
    title:     expense?.title     ?? '',
    amount:    expense?.amount    ?? '',
    category:  expense?.category  ?? 'other',
    date:      expense?.date      ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    paidBy:    expense?.paidBy?._id ?? user?._id,
    splitType: expense?.splitType ?? 'equal',
    notes:     expense?.notes     ?? '',
  })

  // Per-member split state for exact/percentage
  const [splits, setSplits] = useState(() => {
    if (expense?.splits) {
      return expense.splits.map((s) => ({
        userId: s.user._id,
        name:   s.user.name,
        avatar: s.user.avatar,
        amount: s.amount,
        percentage: expense.amount ? ((s.amount / expense.amount) * 100).toFixed(1) : 0,
      }))
    }
    return trip.members.map((m) => ({ userId: m._id, name: m.name, avatar: m.avatar, amount: 0, percentage: 0 }))
  })

  // For equal split — which members are included
  const [equalMembers, setEqualMembers] = useState(() =>
    expense?.splits ? expense.splits.map((s) => s.user._id) : trip.members.map((m) => m._id)
  )

  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  // Recompute equal split preview
  const equalPreview = (() => {
    const n = equalMembers.length
    if (!n || !form.amount) return 0
    return (parseFloat(form.amount) / n).toFixed(2)
  })()

  const toggleEqualMember = (id) =>
    setEqualMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  const setSplitField = (userId, field, value) =>
    setSplits((prev) => prev.map((s) => s.userId === userId ? { ...s, [field]: value } : s))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim())        return toast.error('Title is required')
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0)          return toast.error('Enter a valid amount')
    if (!form.paidBy)              return toast.error('Select who paid')

    let splitsPayload
    if (form.splitType === 'equal') {
      if (equalMembers.length === 0) return toast.error('Select at least one member to split with')
      splitsPayload = equalMembers.map((id) => ({ user: id }))
    } else if (form.splitType === 'exact') {
      const total = splits.reduce((s, x) => s + parseFloat(x.amount || 0), 0)
      if (Math.abs(total - amt) > 0.01) return toast.error(`Exact amounts must sum to ${amt} (currently ${total.toFixed(2)})`)
      splitsPayload = splits.map((s) => ({ user: s.userId, amount: parseFloat(s.amount) }))
    } else {
      const totalPct = splits.reduce((s, x) => s + parseFloat(x.percentage || 0), 0)
      if (Math.abs(totalPct - 100) > 0.1) return toast.error(`Percentages must sum to 100 (currently ${totalPct.toFixed(1)})`)
      splitsPayload = splits.map((s) => ({ user: s.userId, percentage: parseFloat(s.percentage) }))
    }

    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/expenses/${expense._id}`, {
          title: form.title.trim(), amount: amt, category: form.category,
          date: form.date, paidBy: form.paidBy, splitType: form.splitType,
          splits: splitsPayload, notes: form.notes.trim(),
        })
        toast.success('Expense updated')
      } else {
        await api.post(`/expenses/trip/${trip._id}`, {
          title: form.title.trim(), amount: amt, category: form.category,
          date: form.date, paidBy: form.paidBy, splitType: form.splitType,
          splits: splitsPayload, notes: form.notes.trim(),
        })
        toast.success('Expense added')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-heading-md">{isEdit ? 'Edit expense' : 'Add expense'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto" style={{ maxHeight: '75vh' }}>
          {/* Title + category */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="label">What for? *</label>
              <input className="input" placeholder="e.g. Dinner at rooftop" value={form.title} onChange={set('title')} autoFocus />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="select" value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CAT_EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount + date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount ({trip.currency}) *</label>
              <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
                     value={form.amount} onChange={set('amount')} />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={set('date')} />
            </div>
          </div>

          {/* Paid by */}
          <div>
            <label className="label">Paid by</label>
            <select className="select" value={form.paidBy} onChange={set('paidBy')}>
              {trip.members.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Split type */}
          <div>
            <label className="label">Split</label>
            <div className="flex gap-2">
              {['equal', 'exact', 'percentage'].map((t) => (
                <button key={t} type="button"
                        onClick={() => setForm((p) => ({ ...p, splitType: t }))}
                        className="flex-1 py-2 text-body-sm font-medium rounded-full transition-all capitalize"
                        style={{
                          backgroundColor: form.splitType === t ? 'var(--color-ink)' : 'var(--color-neutral)',
                          color: form.splitType === t ? '#fff' : 'var(--color-text-muted)',
                          border: 'none', cursor: 'pointer',
                        }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Split details */}
          {form.splitType === 'equal' && (
            <div>
              <p className="text-caption mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Select members to split with {form.amount ? `(${trip.currency} ${equalPreview} each)` : ''}
              </p>
              <div className="flex flex-col gap-2">
                {trip.members.map((m) => (
                  <label key={m._id} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={equalMembers.includes(m._id)}
                           onChange={() => toggleEqualMember(m._id)}
                           className="w-4 h-4 rounded" />
                    <span className="text-body-sm">{m.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {form.splitType === 'exact' && (
            <div className="flex flex-col gap-2">
              <p className="text-caption mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Enter each person's exact share (must sum to {form.amount || 0})
              </p>
              {splits.map((s) => (
                <div key={s.userId} className="flex items-center gap-3">
                  <span className="text-body-sm w-24 truncate">{s.name}</span>
                  <input type="number" min="0" step="0.01" className="input flex-1"
                         placeholder="0.00" value={s.amount}
                         onChange={(e) => setSplitField(s.userId, 'amount', e.target.value)} />
                </div>
              ))}
              <p className="text-caption text-right" style={{
                color: Math.abs(splits.reduce((a, s) => a + parseFloat(s.amount || 0), 0) - parseFloat(form.amount || 0)) < 0.01 ? '#059669' : '#dc2626'
              }}>
                Total: {trip.currency} {splits.reduce((a, s) => a + parseFloat(s.amount || 0), 0).toFixed(2)}
              </p>
            </div>
          )}

          {form.splitType === 'percentage' && (
            <div className="flex flex-col gap-2">
              <p className="text-caption mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Enter percentages (must sum to 100%)
              </p>
              {splits.map((s) => (
                <div key={s.userId} className="flex items-center gap-3">
                  <span className="text-body-sm w-24 truncate">{s.name}</span>
                  <input type="number" min="0" step="0.1" max="100" className="input flex-1"
                         placeholder="0" value={s.percentage}
                         onChange={(e) => setSplitField(s.userId, 'percentage', e.target.value)} />
                  <span className="text-body-sm w-6" style={{ color: 'var(--color-text-muted)' }}>%</span>
                  {form.amount && (
                    <span className="text-caption w-20 text-right" style={{ color: 'var(--color-text-muted)' }}>
                      = {trip.currency} {((parseFloat(s.percentage || 0) / 100) * parseFloat(form.amount || 0)).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
              <p className="text-caption text-right" style={{
                color: Math.abs(splits.reduce((a, s) => a + parseFloat(s.percentage || 0), 0) - 100) < 0.1 ? '#059669' : '#dc2626'
              }}>
                Total: {splits.reduce((a, s) => a + parseFloat(s.percentage || 0), 0).toFixed(1)}%
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea className="textarea" rows={2} placeholder="Optional note"
                      value={form.notes} onChange={set('notes')} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-ghost flex-1" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
