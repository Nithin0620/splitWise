import { useMemo, useState } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { CURRENCIES, getRate, round2 } from '../lib/currency'

const CATEGORIES = ['food', 'transport', 'accommodation', 'entertainment', 'shopping', 'other']
const CAT_EMOJI  = { food: '🍽️', transport: '🚗', accommodation: '🏨', entertainment: '🎭', shopping: '🛍️', other: '📦' }
const SPLIT_TYPES = [
  { key: 'equal', label: 'Equal' },
  { key: 'exact', label: 'Exact' },
  { key: 'percentage', label: '%' },
  { key: 'shares', label: 'Shares' },
  { key: 'itemized', label: 'Items' },
]
const FREQUENCIES = [
  { key: 'none', label: 'Once' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
]

const num = (value) => {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

export default function AddExpenseModal({ trip, expense, onClose, onSaved }) {
  const { user } = useAuth()
  const isEdit = !!expense
  const tripCurrency = (trip.currency || 'INR').toUpperCase()
  const rate = expense?.exchangeRate || 1

  const [form, setForm] = useState({
    title:     expense?.title ?? '',
    amount:    expense ? String(expense.originalAmount ?? expense.amount ?? '') : '',
    currency:  (expense?.currency || tripCurrency).toUpperCase(),
    category:  expense?.category ?? 'other',
    date:      expense?.date ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    paidBy:    expense?.paidBy?._id ?? user?._id,
    splitType: expense?.splitType ?? 'equal',
    notes:     expense?.notes ?? '',
    tax:       expense?.tax ? String(expense.tax) : '',
    tip:       expense?.tip ? String(expense.tip) : '',
    recurrenceFrequency: expense?.recurrence?.frequency ?? 'none',
    recurrenceInterval: String(expense?.recurrence?.interval || 1),
    recurrenceEndDate: expense?.recurrence?.endDate ? expense.recurrence.endDate.slice(0, 10) : '',
  })

  const [splits, setSplits] = useState(() => {
    const byId = {}
    for (const s of expense?.splits || []) byId[String(s.user._id)] = s
    return trip.members.map((m) => {
      const split = byId[String(m._id)]
      const sourceAmount = split ? split.amount / rate : 0
      return {
        userId: m._id,
        name: m.name,
        avatar: m.avatar,
        amount: sourceAmount ? String(round2(sourceAmount)) : '',
        percentage: split && expense?.amount
          ? String(round2((split.amount / expense.amount) * 100))
          : '',
        shares: '1',
      }
    })
  })

  const [equalMembers, setEqualMembers] = useState(() =>
    expense?.splits ? expense.splits.map((s) => s.user._id) : trip.members.map((m) => m._id)
  )

  const [items, setItems] = useState(() => {
    if (expense?.items?.length) {
      return expense.items.map((item) => ({
        name: item.name || '',
        amount: String(item.amount ?? ''),
        users: (item.users || []).map((u) => String(u?._id ?? u)),
      }))
    }
    return [{ name: '', amount: '', users: trip.members.map((m) => m._id) }]
  })

  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const setSplitField = (userId, field, value) =>
    setSplits((prev) => prev.map((s) => (s.userId === userId ? { ...s, [field]: value } : s)))

  const toggleEqualMember = (id) =>
    setEqualMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  const setItemField = (index, field, value) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)))
  const toggleItemUser = (index, userId) =>
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it
        const on = it.users.includes(userId)
        return { ...it, users: on ? it.users.filter((u) => u !== userId) : [...it.users, userId] }
      })
    )
  const addItem = () =>
    setItems((prev) => [...prev, { name: '', amount: '', users: trip.members.map((m) => m._id) }])
  const removeItem = (index) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))

  const amountNum = num(form.amount)
  const taxNum = num(form.tax)
  const tipNum = num(form.tip)
  const itemSubtotal = round2(items.reduce((sum, item) => sum + num(item.amount), 0))
  const itemTotal = round2(itemSubtotal + taxNum + tipNum)
  const sourceTotal = form.splitType === 'itemized' ? itemTotal : amountNum
  const convertedTotal = useMemo(
    () => round2(sourceTotal * (form.currency === tripCurrency ? 1 : (getRate(form.currency, tripCurrency) || 1))),
    [sourceTotal, form.currency, tripCurrency]
  )

  const exactTotal = round2(splits.reduce((sum, s) => sum + num(s.amount), 0))
  const percentTotal = round2(splits.reduce((sum, s) => sum + num(s.percentage), 0))
  const shareTotal = splits.reduce((sum, s) => sum + num(s.shares), 0)
  const equalPreview = equalMembers.length ? sourceTotal / equalMembers.length : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.paidBy) return toast.error('Select who paid')

    let splitsPayload
    if (form.splitType === 'equal') {
      if (equalMembers.length === 0) return toast.error('Select at least one member to split with')
      splitsPayload = equalMembers.map((id) => ({ user: id }))
    } else if (form.splitType === 'exact') {
      if (Math.abs(exactTotal - sourceTotal) > 0.01) {
        return toast.error(`Exact amounts must sum to ${sourceTotal.toFixed(2)} (currently ${exactTotal.toFixed(2)})`)
      }
      splitsPayload = splits.map((s) => ({ user: s.userId, amount: num(s.amount) }))
    } else if (form.splitType === 'percentage') {
      if (Math.abs(percentTotal - 100) > 0.1) {
        return toast.error(`Percentages must sum to 100 (currently ${percentTotal.toFixed(1)})`)
      }
      splitsPayload = splits.map((s) => ({ user: s.userId, percentage: num(s.percentage) }))
    } else if (form.splitType === 'shares') {
      if (shareTotal <= 0) return toast.error('Shares must add up to more than zero')
      splitsPayload = splits.map((s) => ({ user: s.userId, shares: num(s.shares) }))
    } else {
      if (!items.length) return toast.error('Add at least one item')
      for (const item of items) {
        if (num(item.amount) <= 0) return toast.error('Every item needs an amount')
        if (!item.users.length) return toast.error('Every item needs at least one person')
      }
      splitsPayload = []
    }

    if (form.splitType !== 'itemized' && amountNum <= 0) {
      return toast.error('Enter a valid amount')
    }

    const payload = {
      title: form.title.trim(),
      amount: round2(sourceTotal),
      currency: form.currency,
      category: form.category,
      date: form.date,
      paidBy: form.paidBy,
      splitType: form.splitType,
      splits: splitsPayload,
      notes: form.notes.trim(),
      recurrence: {
        frequency: form.recurrenceFrequency,
        interval: Math.max(1, parseInt(form.recurrenceInterval, 10) || 1),
        endDate: form.recurrenceEndDate || undefined,
      },
    }

    if (form.splitType === 'itemized') {
      payload.items = items.map((item) => ({
        name: item.name.trim() || 'Item',
        amount: num(item.amount),
        users: item.users,
      }))
      payload.tax = taxNum
      payload.tip = tipNum
    }

    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/expenses/${expense._id}`, payload)
        toast.success('Expense updated')
      } else {
        await api.post(`/expenses/trip/${trip._id}`, payload)
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
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="p-4 sm:p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-heading-md">{isEdit ? 'Edit expense' : 'Add expense'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex flex-col gap-5 overflow-y-auto" style={{ maxHeight: '75vh' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
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

          {/* Currency + amount + date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Currency</label>
              <select className="select" value={form.currency} onChange={set('currency')}>
                {CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
              </select>
            </div>
            {form.splitType === 'itemized' ? (
              <div>
                <label className="label">Total (auto)</label>
                <input className="input" value={itemTotal.toFixed(2)} readOnly />
              </div>
            ) : (
              <div>
                <label className="label">Amount ({form.currency}) *</label>
                <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
                       value={form.amount} onChange={set('amount')} />
              </div>
            )}
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={set('date')} />
            </div>
          </div>

          {form.currency !== tripCurrency && sourceTotal > 0 && (
            <p className="text-caption -mt-2" style={{ color: 'var(--color-text-muted)' }}>
              ≈ {tripCurrency} {convertedTotal.toFixed(2)} at today's rate
            </p>
          )}

          <div>
            <label className="label">Paid by</label>
            <select className="select" value={form.paidBy} onChange={set('paidBy')}>
              {trip.members.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Split</label>
            <div className="flex flex-wrap gap-2">
              {SPLIT_TYPES.map((t) => (
                <button key={t.key} type="button"
                        onClick={() => setForm((p) => ({ ...p, splitType: t.key }))}
                        className="flex-1 py-2 text-body-sm font-medium rounded-full transition-all"
                        style={{
                          backgroundColor: form.splitType === t.key ? 'var(--color-ink)' : 'var(--color-neutral)',
                          color: form.splitType === t.key ? '#fff' : 'var(--color-text-muted)',
                          border: 'none', cursor: 'pointer', minWidth: 68,
                        }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {form.splitType === 'equal' && (
            <div>
              <p className="text-caption mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Select members to split with {sourceTotal > 0 ? `(${form.currency} ${equalPreview.toFixed(2)} each)` : ''}
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
                Enter each person's exact share (must sum to {sourceTotal.toFixed(2)})
              </p>
              {splits.map((s) => (
                <div key={s.userId} className="flex items-center gap-3">
                  <span className="text-body-sm w-20 sm:w-24 truncate">{s.name}</span>
                  <input type="number" min="0" step="0.01" className="input flex-1"
                         placeholder="0.00" value={s.amount}
                         onChange={(e) => setSplitField(s.userId, 'amount', e.target.value)} />
                </div>
              ))}
              <p className="text-caption text-right" style={{
                color: Math.abs(exactTotal - sourceTotal) < 0.01 ? '#059669' : '#dc2626'
              }}>
                Total: {form.currency} {exactTotal.toFixed(2)}
              </p>
            </div>
          )}

          {form.splitType === 'percentage' && (
            <div className="flex flex-col gap-2">
              <p className="text-caption mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Enter percentages (must sum to 100%)
              </p>
              {splits.map((s) => (
                <div key={s.userId} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-body-sm w-20 sm:w-24 truncate">{s.name}</span>
                  <input type="number" min="0" step="0.1" max="100" className="input flex-1"
                         placeholder="0" value={s.percentage}
                         onChange={(e) => setSplitField(s.userId, 'percentage', e.target.value)} />
                  <span className="text-body-sm w-4 sm:w-6" style={{ color: 'var(--color-text-muted)' }}>%</span>
                  {sourceTotal > 0 && (
                    <span className="hidden sm:block text-caption w-20 text-right" style={{ color: 'var(--color-text-muted)' }}>
                      = {form.currency} {((num(s.percentage) / 100) * sourceTotal).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
              <p className="text-caption text-right" style={{
                color: Math.abs(percentTotal - 100) < 0.1 ? '#059669' : '#dc2626'
              }}>
                Total: {percentTotal.toFixed(1)}%
              </p>
            </div>
          )}

          {form.splitType === 'shares' && (
            <div className="flex flex-col gap-2">
              <p className="text-caption mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Give each person a number of shares (e.g. 2:1:1)
              </p>
              {splits.map((s) => {
                const share = shareTotal > 0 ? (num(s.shares) / shareTotal) * sourceTotal : 0
                return (
                  <div key={s.userId} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-body-sm w-20 sm:w-24 truncate">{s.name}</span>
                    <input type="number" min="0" step="1" className="input flex-1"
                           placeholder="1" value={s.shares}
                           onChange={(e) => setSplitField(s.userId, 'shares', e.target.value)} />
                    <span className="hidden sm:block text-caption w-28 text-right" style={{ color: 'var(--color-text-muted)' }}>
                      = {form.currency} {share.toFixed(2)}
                    </span>
                  </div>
                )
              })}
              <p className="text-caption text-right" style={{ color: shareTotal > 0 ? '#059669' : '#dc2626' }}>
                {shareTotal} share{shareTotal === 1 ? '' : 's'} total
              </p>
            </div>
          )}

          {form.splitType === 'itemized' && (
            <div className="flex flex-col gap-3">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col gap-2 p-3 rounded-xl"
                     style={{ border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2">
                    <input className="input flex-1" placeholder={`Item ${index + 1}`}
                           value={item.name}
                           onChange={(e) => setItemField(index, 'name', e.target.value)} />
                    <div className="w-20 sm:w-[110px] flex-shrink-0">
                      <input type="number" min="0" step="0.01" className="input"
                             placeholder="0.00" value={item.amount}
                             onChange={(e) => setItemField(index, 'amount', e.target.value)} />
                    </div>
                    <button type="button" onClick={() => removeItem(index)}
                            className="btn-ghost flex-shrink-0" style={{ padding: '0 10px', color: '#dc2626' }}>×</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trip.members.map((m) => {
                      const on = item.users.includes(m._id)
                      return (
                        <button key={m._id} type="button" onClick={() => toggleItemUser(index, m._id)}
                                className="text-caption px-3 py-1 rounded-full"
                                style={{
                                  backgroundColor: on ? 'var(--color-ink)' : 'var(--color-surface)',
                                  color: on ? '#fff' : 'var(--color-text-muted)',
                                  border: '1px solid var(--color-border)', cursor: 'pointer',
                                }}>
                          {m.name.split(' ')[0]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              <button type="button" className="btn-ghost" onClick={addItem}>+ Add item</button>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tax</label>
                  <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
                         value={form.tax} onChange={set('tax')} />
                </div>
                <div>
                  <label className="label">Tip</label>
                  <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
                         value={form.tip} onChange={set('tip')} />
                </div>
              </div>
              <p className="text-body-sm text-right">
                Total: {form.currency} {itemTotal.toFixed(2)}
              </p>
            </div>
          )}

          {/* Recurrence */}
          <div>
            <label className="label">Repeat</label>
            <div className="flex flex-wrap gap-2">
              {FREQUENCIES.map((f) => (
                <button key={f.key} type="button"
                        onClick={() => setForm((p) => ({ ...p, recurrenceFrequency: f.key }))}
                        className="flex-1 py-2 text-body-sm font-medium rounded-full transition-all"
                        style={{
                          backgroundColor: form.recurrenceFrequency === f.key ? 'var(--color-ink)' : 'var(--color-neutral)',
                          color: form.recurrenceFrequency === f.key ? '#fff' : 'var(--color-text-muted)',
                          border: 'none', cursor: 'pointer', minWidth: 72,
                        }}>
                  {f.label}
                </button>
              ))}
            </div>
            {form.recurrenceFrequency !== 'none' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="label">Every</label>
                  <input type="number" min="1" step="1" className="input"
                         value={form.recurrenceInterval} onChange={set('recurrenceInterval')} />
                </div>
                <div>
                  <label className="label">Ends on (optional)</label>
                  <input type="date" className="input" value={form.recurrenceEndDate}
                         onChange={set('recurrenceEndDate')} />
                </div>
              </div>
            )}
          </div>

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
