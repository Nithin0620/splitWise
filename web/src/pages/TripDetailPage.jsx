import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../lib/socket'
import AddExpenseModal from '../components/AddExpenseModal'
import RecordSettlementModal from '../components/RecordSettlementModal'
import InviteMemberModal from '../components/InviteMemberModal'
import CreateTripModal from '../components/CreateTripModal'
import ExpenseDetailModal from '../components/ExpenseDetailModal'
import { useConfirmDialog } from '../lib/useConfirmDialog.jsx'
import { formatDate, formatDateRange } from '../lib/date'

export default function TripDetailPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { confirm, dialog: confirmDialog } = useConfirmDialog()

  const [trip, setTrip]             = useState(null)
  const [expenses, setExpenses]     = useState([])
  const [settlements, setSettlements] = useState([])
  const [balances, setBalances]     = useState(null)
  const [insights, setInsights]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('expenses') // expenses | insights | spending | balances
  const [simplify, setSimplify]     = useState(true)
  const [settleInitial, setSettleInitial] = useState(null)

  const [showAddExpense, setShowAddExpense]         = useState(false)
  const [showSettle, setShowSettle]                 = useState(false)
  const [showInvite, setShowInvite]                 = useState(false)
  const [showEditTrip, setShowEditTrip]             = useState(false)
  const [editingExpense, setEditingExpense]         = useState(null)
  const [viewingExpense, setViewingExpense]         = useState(null)

  const loadAll = useCallback(async () => {
    try {
      const [tripRes, expRes, settleRes, balRes, insightRes] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/expenses/trip/${tripId}`),
        api.get(`/settlements/trip/${tripId}`),
        api.get(`/trips/${tripId}/balances`, { params: { simplify } }),
        api.get(`/trips/${tripId}/insights`),
      ])
      setTrip(tripRes.data.data)
      setExpenses(expRes.data.data)
      setSettlements(settleRes.data.data)
      setBalances(balRes.data.data)
      setInsights(insightRes.data.data)
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        toast.error('Trip not found or access denied')
        navigate('/')
      } else {
        toast.error('Failed to load trip')
      }
    } finally {
      setLoading(false)
    }
  }, [tripId, navigate, simplify])

  useEffect(() => { loadAll() }, [loadAll])

  // Socket.IO live updates
  useEffect(() => {
    const socket = getSocket()
    socket.emit('join_trip', tripId)

    const refresh = () => loadAll()

    socket.on('expense_created',    refresh)
    socket.on('expense_updated',    refresh)
    socket.on('expense_deleted',    refresh)
    socket.on('settlement_created', refresh)
    socket.on('settlement_deleted', refresh)
    socket.on('member_added',       refresh)
    socket.on('member_removed',     refresh)
    socket.on('trip_updated',       refresh)

    return () => {
      socket.emit('leave_trip', tripId)
      socket.off('expense_created',    refresh)
      socket.off('expense_updated',    refresh)
      socket.off('expense_deleted',    refresh)
      socket.off('settlement_created', refresh)
      socket.off('settlement_deleted', refresh)
      socket.off('member_added',       refresh)
      socket.off('member_removed',     refresh)
      socket.off('trip_updated',       refresh)
    }
  }, [tripId, loadAll])

  const deleteExpense = async (id) => {
    const ok = await confirm('Delete this expense?', { confirmText: 'Delete', destructive: true })
    if (!ok) return
    try {
      await api.delete(`/expenses/${id}`)
      setExpenses((p) => p.filter((e) => e._id !== id))
      toast.success('Expense deleted')
      loadAll()
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  const deleteSettlement = async (id) => {
    const ok = await confirm('Remove this settlement?', {
      message: 'This will restore the outstanding balance.',
      confirmText: 'Remove',
      destructive: true,
    })
    if (!ok) return
    try {
      await api.delete(`/settlements/${id}`)
      toast.success('Settlement removed')
      loadAll()
    } catch {
      toast.error('Failed to remove settlement')
    }
  }

  const isOwner = trip?.createdBy?._id === user?._id

  const toggleArchive = async () => {
    const next = !trip.isArchived
    try {
      const { data } = await api.put(`/trips/${tripId}`, { isArchived: next })
      setTrip(data.data)
      toast.success(next ? 'Trip archived' : 'Trip unarchived')
    } catch {
      toast.error('Failed to update trip')
    }
  }

  const settleTransaction = async (t) => {
    const from = t.from?._id ?? t.from
    const to = t.to?._id ?? t.to
    const ok = await confirm('Record payment?', {
      message: `${trip.currency} ${Number(t.amount).toFixed(2)} from ${t.from?.name} to ${t.to?.name}.`,
      confirmText: 'Record',
    })
    if (!ok) return
    try {
      await api.post(`/settlements/trip/${tripId}`, {
        fromUser: from, toUser: to, amount: t.amount, notes: 'Settled in one tap',
      })
      toast.success('Payment recorded')
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment')
    }
  }

  const settleAllTransactions = async () => {
    const txns = balances?.transactions ?? []
    if (!txns.length) return
    const ok = await confirm('Settle everything?', {
      message: `Record ${txns.length} payment${txns.length === 1 ? '' : 's'} to clear all balances.`,
      confirmText: 'Settle all',
    })
    if (!ok) return
    try {
      await api.post(`/settlements/trip/${tripId}/settle-all`, {
        transactions: txns.map((t) => ({
          from: t.from?._id ?? t.from,
          to: t.to?._id ?? t.to,
          amount: t.amount,
        })),
      })
      toast.success('All settled up')
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to settle')
    }
  }

  const remindDebtor = async (t) => {
    const target = t.from?._id ?? t.from
    const ok = await confirm('Send reminder?', {
      message: `Nudge ${t.from?.name} to pay ${trip.currency} ${Number(t.amount).toFixed(2)}.`,
      confirmText: 'Send',
    })
    if (!ok) return
    try {
      await api.post(`/settlements/trip/${tripId}/remind`, {
        toUser: target, amount: t.amount,
      })
      toast.success(`Reminder sent to ${t.from?.name}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reminder')
    }
  }

  const openPartial = (t) => {
    setSettleInitial({
      fromUser: t.from?._id ?? t.from,
      toUser: t.to?._id ?? t.to,
      amount: t.amount,
    })
    setShowSettle(true)
  }

  if (loading) return <TripDetailSkeleton />

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-body-sm mb-6 hover:opacity-70 transition-opacity"
              style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        ← All trips
      </button>

      {/* Trip header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-heading-xl" style={{ color: 'var(--color-ink)' }}>{trip.name}</h1>
            {trip.isArchived && <span className="badge badge-amber">Archived</span>}
          </div>
          {trip.description && (
            <p className="text-body-md" style={{ color: 'var(--color-text-muted)' }}>{trip.description}</p>
          )}
          {formatDateRange(trip.startDate, trip.endDate) && (
            <p className="text-caption mt-1" style={{ color: 'var(--color-text-muted)' }}>
              📅 {formatDateRange(trip.startDate, trip.endDate)}
            </p>
          )}
          <p className="text-caption mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {trip.currency} · {trip.members.length} members
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button className="btn-primary-sm" onClick={() => setShowAddExpense(true)}>
            + Expense
          </button>
          <button className="btn-ghost" style={{ height: 36, padding: '8px 14px', fontSize: 13 }}
                  onClick={() => setShowSettle(true)}>
            Record payment
          </button>
          {isOwner && (
            <button className="btn-ghost" style={{ height: 36, padding: '8px 14px', fontSize: 13 }}
                    onClick={() => setShowInvite(true)}>
              + Invite
            </button>
          )}
          {isOwner && (
            <>
              <button className="btn-ghost" style={{ height: 36, padding: '8px 14px', fontSize: 13 }}
                      onClick={() => setShowEditTrip(true)}>
                Edit
              </button>
              <button className="btn-ghost" style={{ height: 36, padding: '8px 14px', fontSize: 13 }}
                      onClick={toggleArchive}>
                {trip.isArchived ? 'Unarchive' : 'Archive'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col: expenses + balances */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Summary bar */}
          <SummaryBar balances={balances} currency={trip.currency} />

          {/* Tabs */}
          <div>
            <div className="flex gap-1 mb-4 p-1 rounded-full w-fit"
                 style={{ backgroundColor: 'var(--color-neutral)' }}>
              {['expenses', 'insights', 'spending', 'balances'].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                        className="px-5 py-1.5 rounded-full text-body-sm font-medium transition-all capitalize"
                        style={{
                          backgroundColor: tab === t ? '#fff' : 'transparent',
                          color: tab === t ? 'var(--color-ink)' : 'var(--color-text-muted)',
                          boxShadow: tab === t ? 'var(--shadow-lg)' : 'none',
                          border: 'none', cursor: 'pointer',
                        }}>
                  {t}
                </button>
              ))}
            </div>

            {tab === 'expenses' && (
              <ExpenseList
                expenses={expenses}
                userId={user?._id}
                currency={trip.currency}
                onOpen={setViewingExpense}
                onEdit={(e) => { setEditingExpense(e); setShowAddExpense(true) }}
                onDelete={deleteExpense}
              />
            )}
            {tab === 'insights' && (
              <InsightsTab insights={insights} currency={trip.currency} />
            )}
            {tab === 'spending' && (
              <SpendingTab spending={balances?.spending} currency={trip.currency} />
            )}
            {tab === 'balances' && (
              <BalancesTab
                balances={balances}
                settlements={settlements}
                currency={trip.currency}
                userId={user?._id}
                simplify={simplify}
                onToggleSimplify={() => setSimplify((v) => !v)}
                onSettle={settleTransaction}
                onSettleAll={settleAllTransactions}
                onRemind={remindDebtor}
                onPartial={openPartial}
                onDeleteSettlement={deleteSettlement}
              />
            )}
          </div>
        </div>

        {/* Right col: members */}
        <div>
          <MembersPanel
            trip={trip}
            userId={user?._id}
            isOwner={isOwner}
            onInvite={() => setShowInvite(true)}
            onRefresh={loadAll}
          />
        </div>
      </div>

      {/* Modals */}
      {showAddExpense && (
        <AddExpenseModal
          trip={trip}
          expense={editingExpense}
          onClose={() => { setShowAddExpense(false); setEditingExpense(null) }}
          onSaved={() => { setShowAddExpense(false); setEditingExpense(null); loadAll() }}
        />
      )}
      {showSettle && (
        <RecordSettlementModal
          trip={trip}
          balances={balances}
          initial={settleInitial}
          onClose={() => { setShowSettle(false); setSettleInitial(null) }}
          onSaved={() => { setShowSettle(false); setSettleInitial(null); loadAll() }}
        />
      )}
      {showInvite && (
        <InviteMemberModal
          trip={trip}
          onClose={() => setShowInvite(false)}
          onInvited={() => { setShowInvite(false); loadAll() }}
        />
      )}
      {showEditTrip && (
        <CreateTripModal
          trip={trip}
          onClose={() => setShowEditTrip(false)}
          onCreated={() => { setShowEditTrip(false); loadAll() }}
        />
      )}
      {viewingExpense && (
        <ExpenseDetailModal
          expense={viewingExpense}
          currency={trip.currency}
          userId={user?._id}
          members={trip.members}
          onClose={() => setViewingExpense(null)}
          onEdit={(expense) => {
            setViewingExpense(null)
            setEditingExpense(expense)
            setShowAddExpense(true)
          }}
          onDelete={(expense) => {
            setViewingExpense(null)
            deleteExpense(expense._id)
          }}
        />
      )}
      {confirmDialog}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SummaryBar({ balances, currency }) {
  if (!balances) return null
  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: 'Total spent', value: balances.totalExpenses },
        { label: 'Total settled', value: balances.totalSettled },
        { label: 'Outstanding', value: Math.max(0, balances.totalExpenses - balances.totalSettled) },
      ].map(({ label, value }) => (
        <div key={label} className="card p-4">
          <p className="text-caption mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
          <p className="text-body-md-strong">
            {currency} {value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>
      ))}
    </div>
  )
}

function ExpenseList({ expenses, userId, currency, onOpen, onEdit, onDelete }) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3">🧾</div>
        <p className="text-body-md" style={{ color: 'var(--color-text-muted)' }}>No expenses yet</p>
      </div>
    )
  }

  const CATEGORY_EMOJI = {
    food: '🍽️', transport: '🚗', accommodation: '🏨',
    entertainment: '🎭', shopping: '🛍️', other: '📦',
  }
  const SPLIT_LABELS = {
    exact: 'exact split', percentage: '% split', shares: 'by shares', itemized: 'itemized',
  }

  return (
    <div className="flex flex-col gap-3">
      {expenses.map((exp) => {
        const myShare = exp.splits?.find((s) => s.user?._id === userId)?.amount ?? 0
        const iPaid = exp.paidBy?._id === userId
        return (
          <div key={exp._id} className="card p-4 flex items-center gap-4"
               onClick={() => onOpen(exp)}
               style={{ cursor: 'pointer' }}>
            <div className="text-2xl w-10 text-center flex-shrink-0">
              {CATEGORY_EMOJI[exp.category] || '📦'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-md-strong truncate">{exp.title}</p>
              <p className="text-caption mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Paid by {iPaid ? 'you' : exp.paidBy?.name} ·{' '}
                {formatDate(exp.date, { day: 'numeric', month: 'short' })}
                {exp.splitType && exp.splitType !== 'equal'
                  ? ` · ${SPLIT_LABELS[exp.splitType] ?? exp.splitType}` : ''}
                {exp.recurrence?.frequency && exp.recurrence.frequency !== 'none'
                  ? ` · 🔁 ${exp.recurrence.frequency}` : ''}
              </p>
              {exp.notes && (
                <p className="text-caption mt-1 italic truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {exp.notes}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              {exp.currency && exp.currency !== currency && (
                <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
                  {exp.currency} {Number(exp.originalAmount ?? exp.amount).toFixed(2)}
                </p>
              )}
              <p className="text-body-md-strong">
                {currency} {exp.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
              <p className="text-caption" style={{ color: iPaid ? '#059669' : 'var(--color-text-muted)' }}>
                {iPaid ? `you lent ${currency} ${(exp.amount - myShare).toFixed(2)}` : `your share ${currency} ${myShare.toFixed(2)}`}
              </p>
            </div>
            <div className="flex gap-1">
              {(exp.createdBy?._id === userId || exp.paidBy?._id === userId) && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); onEdit(exp) }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:opacity-70"
                          style={{ background: 'none', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                    ✏️
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(exp._id) }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:opacity-70"
                          style={{ background: 'none', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                    🗑️
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function InsightsTab({ insights, currency }) {
  const CATEGORY_EMOJI = {
    food: '🍽️', transport: '🚗', accommodation: '🏨',
    entertainment: '🎭', shopping: '🛍️', other: '📦',
  }

  if (!insights?.expenseCount) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3">📊</div>
        <p className="text-body-md" style={{ color: 'var(--color-text-muted)' }}>No insights yet</p>
        <p className="text-caption mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Add a few expenses to see spending patterns.
        </p>
      </div>
    )
  }

  const {
    totalSpent, expenseCount, averageExpense, averagePerDay,
    biggestExpense, categories, daily, monthly,
  } = insights

  const fmt = (n) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })
  const useMonthly = monthly.length > 1
  const trend = (useMonthly ? monthly : daily).slice(-14)
  const trendKey = useMonthly ? 'month' : 'date'
  const maxTrend = Math.max(...trend.map((p) => p.amount), 1)

  const stats = [
    { label: 'Total spent', value: `${currency} ${fmt(totalSpent)}` },
    { label: 'Avg / active day', value: `${currency} ${fmt(averagePerDay)}` },
    { label: 'Avg expense', value: `${currency} ${fmt(averageExpense)}` },
    { label: 'Expenses', value: String(expenseCount) },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
            <p className="text-body-md-strong mt-1 truncate">{s.value}</p>
          </div>
        ))}
      </div>

      {biggestExpense && (
        <div className="card p-4">
          <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Biggest expense</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xl">{CATEGORY_EMOJI[biggestExpense.category] || '📦'}</span>
            <span className="text-body-md-strong flex-1 truncate">{biggestExpense.title}</span>
            <span className="text-body-md-strong">{currency} {biggestExpense.amount.toFixed(2)}</span>
          </div>
        </div>
      )}

      {trend.length > 0 && (
        <div className="card p-4">
          <p className="text-caption mb-3" style={{ color: 'var(--color-text-muted)' }}>
            {useMonthly ? 'Monthly trend' : 'Daily trend'}
          </p>
          <div className="flex items-end gap-1" style={{ height: 130 }}>
            {trend.map((point) => {
              const height = Math.max(4, (point.amount / maxTrend) * 90)
              const label = useMonthly
                ? new Date(`${point[trendKey]}-01`).toLocaleDateString('en-IN', { month: 'short' })
                : String(new Date(point[trendKey]).getDate())
              return (
                <div key={point[trendKey]} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded"
                       title={`${label}: ${currency} ${point.amount.toFixed(2)}`}
                       style={{ height, backgroundColor: 'var(--color-accent)', opacity: 0.85 }} />
                  <span className="text-caption" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="card p-4">
          <p className="text-caption mb-3" style={{ color: 'var(--color-text-muted)' }}>By category</p>
          <div className="flex flex-col gap-3">
            {categories.map((c) => (
              <div key={c.category} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{CATEGORY_EMOJI[c.category] || '📦'}</span>
                  <span className="text-body-sm flex-1 capitalize truncate">{c.category}</span>
                  <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
                    {c.count} · {c.percentage.toFixed(0)}%
                  </span>
                  <span className="text-body-sm">{currency} {fmt(c.amount)}</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 6, backgroundColor: 'var(--color-surface)' }}>
                  <div className="h-full rounded-full"
                       style={{ width: `${Math.max(2, c.percentage)}%`, backgroundColor: 'var(--color-accent)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SpendingTab({ spending, currency }) {
  if (!spending?.length) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3">💸</div>
        <p className="text-body-md" style={{ color: 'var(--color-text-muted)' }}>No spending yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-caption mb-1" style={{ color: 'var(--color-text-muted)' }}>
        Amount each member has settled so far
      </p>
      {spending.map((s) => (
        <div key={s.user?._id} className="card p-4 flex items-center gap-3">
          <Avatar user={s.user} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-body-sm font-medium truncate">{s.user?.name}</p>
            {!s.isFullySettled && s.totalShare > 0 && (
              <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
                {currency} {s.totalSpent.toFixed(2)} of {currency} {s.totalShare.toFixed(2)} settled
              </p>
            )}
          </div>
          <span className="text-body-md-strong">
            {currency} {s.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  )
}

function BalancesTab({
  balances, settlements, currency, userId, simplify, onToggleSimplify,
  onSettle, onSettleAll, onRemind, onPartial, onDeleteSettlement,
}) {
  if (!balances) return null

  const totalExpenses = balances.totalExpenses ?? 0
  const totalSettled = balances.totalSettled ?? 0
  const outstanding = Math.max(0, totalExpenses - totalSettled)
  const pct = totalExpenses > 0 ? Math.min(100, (totalSettled / totalExpenses) * 100) : 100

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-body-sm" style={{ color: 'var(--color-text-muted)' }}>
            {totalSettled.toFixed(2)} of {totalExpenses.toFixed(2)} {currency} settled
          </span>
          <span className="text-caption font-semibold"
                style={{ color: outstanding > 0.01 ? '#dc2626' : '#059669' }}>
            {outstanding > 0.01 ? `${outstanding.toFixed(2)} left` : 'All clear'}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-neutral)' }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: 'var(--color-ink)' }} />
        </div>
      </div>

      {/* Simplify toggle */}
      <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="flex-1">
          <p className="text-body-md-strong">Simplify debts</p>
          <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
            Fewer payments by routing through the group
          </p>
        </div>
        <button
          role="switch"
          aria-checked={simplify}
          aria-label="Simplify debts"
          onClick={onToggleSimplify}
          className="relative rounded-full transition-colors flex-shrink-0"
          style={{
            width: 44, height: 24, border: 'none', cursor: 'pointer',
            backgroundColor: simplify ? 'var(--color-ink)' : 'var(--color-border)',
          }}
        >
          <span className="absolute rounded-full bg-white transition-all"
                style={{ width: 20, height: 20, top: 2, left: simplify ? 22 : 2 }} />
        </button>
      </div>

      {/* Suggested transactions */}
      {balances.transactions?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-heading-xs" style={{ color: 'var(--color-text-muted)' }}>
              {simplify ? 'Suggested settlements' : 'Direct debts'}
            </h3>
            <button className="btn-primary-sm" onClick={onSettleAll}>⚡ Settle all</button>
          </div>
          <div className="flex flex-col gap-2">
            {balances.transactions.map((t, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar user={t.from} size="sm" />
                  <div className="flex-1">
                    <p className="text-body-sm">
                      <strong>{t.from?.name}</strong> → <strong>{t.to?.name}</strong>
                    </p>
                  </div>
                  <span className="text-body-md-strong">
                    {currency} {t.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button onClick={() => onSettle(t)}
                          className="text-caption px-3 py-1 rounded-full"
                          style={{ backgroundColor: 'var(--color-neutral)', border: 'none', cursor: 'pointer' }}>
                    ✓ Settle
                  </button>
                  <button onClick={() => onPartial(t)}
                          className="text-caption px-3 py-1 rounded-full"
                          style={{ backgroundColor: 'var(--color-neutral)', border: 'none', cursor: 'pointer' }}>
                    Partial
                  </button>
                  {t.to?._id === userId && (
                    <button onClick={() => onRemind(t)}
                            className="text-caption px-3 py-1 rounded-full"
                            style={{ backgroundColor: 'var(--color-neutral)', border: 'none', cursor: 'pointer' }}>
                      🔔 Remind
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual balances */}
      <div>
        <h3 className="text-heading-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Net balances
        </h3>
        <div className="flex flex-col gap-2">
          {balances.balances?.map((b) => (
            <div key={b.user?._id} className="card p-4 flex items-center gap-3">
              <Avatar user={b.user} size="sm" />
              <span className="flex-1 text-body-sm">{b.user?.name}</span>
              <span className="text-body-md-strong"
                    style={{ color: b.netAmount >= 0 ? '#059669' : '#dc2626' }}>
                {b.netAmount >= 0 ? '+' : ''}{currency} {Math.abs(b.netAmount).toFixed(2)}
              </span>
              <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
                {b.netAmount >= 0 ? 'is owed' : 'owes'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Past settlements */}
      {settlements?.length > 0 && (
        <div>
          <h3 className="text-heading-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Payment history
          </h3>
          <div className="flex flex-col gap-2">
            {settlements.map((s) => (
              <div key={s._id} className="card p-4 flex items-center gap-3">
                <span className="text-xl">💸</span>
                <div className="flex-1">
                  <p className="text-body-sm">
                    <strong>{s.fromUser?.name}</strong> paid <strong>{s.toUser?.name}</strong>
                  </p>
                  <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
                    {formatDate(s.settledAt)}
                  </p>
                </div>
                <span className="text-body-md-strong">
                  {currency} {s.amount.toFixed(2)}
                </span>
                <button onClick={() => onDeleteSettlement(s._id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: 'none', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!balances.transactions?.length && !settlements?.length && (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-body-md" style={{ color: 'var(--color-text-muted)' }}>
            All settled up!
          </p>
        </div>
      )}
    </div>
  )
}

function MembersPanel({ trip, userId, isOwner, onInvite, onRefresh }) {
  const { confirm, dialog: confirmDialog } = useConfirmDialog()

  const removeMember = async (memberId) => {
    const ok = await confirm('Remove this member?', {
      message: 'They will lose access to this trip.',
      confirmText: 'Remove',
      destructive: true,
    })
    if (!ok) return
    try {
      await api.delete(`/trips/${trip._id}/members/${memberId}`)
      toast.success('Member removed')
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member')
    }
  }

  return (
    <>
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-heading-xs" style={{ color: 'var(--color-text-muted)' }}>Members</h3>
        {isOwner && (
          <button onClick={onInvite} className="btn-primary-sm">+ Invite</button>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {trip.members?.map((m) => (
          <div key={m._id} className="flex items-center gap-3">
            <Avatar user={m} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium truncate">{m.name}</p>
              <p className="text-caption truncate" style={{ color: 'var(--color-text-muted)' }}>{m.email}</p>
            </div>
            {m._id === trip.createdBy?._id && (
              <span className="badge badge-ink" style={{ fontSize: 10 }}>Owner</span>
            )}
            {isOwner && m._id !== trip.createdBy?._id && m._id !== userId && (
              <button onClick={() => removeMember(m._id)}
                      className="text-caption hover:opacity-70"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
    {confirmDialog}
    </>
  )
}

function Avatar({ user, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'avatar-sm' : 'avatar-md'
  if (user?.avatar) {
    return <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer" className={`avatar ${sizeClass}`} />
  }
  return (
    <div className={`avatar ${sizeClass}`}
         style={{ backgroundColor: 'var(--color-neutral)', color: 'var(--color-text-muted)' }}>
      {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  )
}

function TripDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 rounded mb-2" style={{ backgroundColor: 'var(--color-neutral)', width: '30%' }} />
      <div className="h-4 rounded mb-8" style={{ backgroundColor: 'var(--color-neutral)', width: '50%' }} />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl" style={{ backgroundColor: 'var(--color-neutral)' }} />)}
      </div>
      <div className="h-64 rounded-2xl" style={{ backgroundColor: 'var(--color-neutral)' }} />
    </div>
  )
}
