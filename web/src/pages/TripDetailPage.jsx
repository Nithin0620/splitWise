import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../lib/socket'
import AddExpenseModal from '../components/AddExpenseModal'
import RecordSettlementModal from '../components/RecordSettlementModal'
import InviteMemberModal from '../components/InviteMemberModal'

export default function TripDetailPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [trip, setTrip]             = useState(null)
  const [expenses, setExpenses]     = useState([])
  const [settlements, setSettlements] = useState([])
  const [balances, setBalances]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('expenses') // expenses | balances

  const [showAddExpense, setShowAddExpense]         = useState(false)
  const [showSettle, setShowSettle]                 = useState(false)
  const [showInvite, setShowInvite]                 = useState(false)
  const [editingExpense, setEditingExpense]         = useState(null)

  const loadAll = useCallback(async () => {
    try {
      const [tripRes, expRes, settleRes, balRes] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/expenses/trip/${tripId}`),
        api.get(`/settlements/trip/${tripId}`),
        api.get(`/trips/${tripId}/balances`),
      ])
      setTrip(tripRes.data.data)
      setExpenses(expRes.data.data)
      setSettlements(settleRes.data.data)
      setBalances(balRes.data.data)
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
  }, [tripId, navigate])

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
    if (!confirm('Delete this expense?')) return
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
    if (!confirm('Remove this settlement?')) return
    try {
      await api.delete(`/settlements/${id}`)
      toast.success('Settlement removed')
      loadAll()
    } catch {
      toast.error('Failed to remove settlement')
    }
  }

  const isOwner = trip?.createdBy?._id === user?._id

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
              {['expenses', 'balances'].map((t) => (
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

            {tab === 'expenses' ? (
              <ExpenseList
                expenses={expenses}
                userId={user?._id}
                currency={trip.currency}
                onEdit={(e) => { setEditingExpense(e); setShowAddExpense(true) }}
                onDelete={deleteExpense}
              />
            ) : (
              <BalancesTab
                balances={balances}
                settlements={settlements}
                currency={trip.currency}
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
          onClose={() => setShowSettle(false)}
          onSaved={() => { setShowSettle(false); loadAll() }}
        />
      )}
      {showInvite && (
        <InviteMemberModal
          trip={trip}
          onClose={() => setShowInvite(false)}
          onInvited={() => { setShowInvite(false); loadAll() }}
        />
      )}
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

function ExpenseList({ expenses, userId, currency, onEdit, onDelete }) {
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

  return (
    <div className="flex flex-col gap-3">
      {expenses.map((exp) => {
        const myShare = exp.splits?.find((s) => s.user?._id === userId)?.amount ?? 0
        const iPaid = exp.paidBy?._id === userId
        return (
          <div key={exp._id} className="card p-4 flex items-center gap-4">
            <div className="text-2xl w-10 text-center flex-shrink-0">
              {CATEGORY_EMOJI[exp.category] || '📦'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-md-strong truncate">{exp.title}</p>
              <p className="text-caption mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Paid by {iPaid ? 'you' : exp.paidBy?.name} ·{' '}
                {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
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
                  <button onClick={() => onEdit(exp)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:opacity-70"
                          style={{ background: 'none', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                    ✏️
                  </button>
                  <button onClick={() => onDelete(exp._id)}
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

function BalancesTab({ balances, settlements, currency, onDeleteSettlement }) {
  if (!balances) return null
  return (
    <div className="flex flex-col gap-6">
      {/* Suggested transactions */}
      {balances.transactions?.length > 0 && (
        <div>
          <h3 className="text-heading-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Suggested settlements
          </h3>
          <div className="flex flex-col gap-2">
            {balances.transactions.map((t, i) => (
              <div key={i} className="card p-4 flex items-center gap-3">
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
                    {new Date(s.settledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
  const removeMember = async (memberId) => {
    if (!confirm('Remove this member?')) return
    try {
      await api.delete(`/trips/${trip._id}/members/${memberId}`)
      toast.success('Member removed')
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member')
    }
  }

  return (
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
