import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, SectionList, TouchableOpacity, Switch,
  StyleSheet, RefreshControl, ScrollView, Modal,
} from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../../src/lib/api'
import { useAuth } from '../../../src/context/AuthContext'
import { getSocket } from '../../../src/lib/socket'
import { Card, SmallButton, Button, Badge, Avatar, Divider, SectionLabel, LoadingScreen, EmptyState } from '../../../src/components/ui'
import { useDialog } from '../../../src/components/Dialog'
import { colors, spacing, type, shadow } from '../../../src/theme'
import { formatDate, formatDateRange } from '../../../src/lib/date'

const CAT_EMOJI = { food:'🍽️', transport:'🚗', accommodation:'🏨', entertainment:'🎭', shopping:'🛍️', other:'📦' }
const SPLIT_LABELS = { exact:'exact split', percentage:'% split', shares:'by shares', itemized:'itemized' }

export default function TripDetailScreen() {
  const { tripId } = useLocalSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const dialog = useDialog()

  const [trip, setTrip]               = useState(null)
  const [expenses, setExpenses]       = useState([])
  const [settlements, setSettlements] = useState([])
  const [balances, setBalances]       = useState(null)
  const [insights, setInsights]       = useState(null)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [tab, setTab]                 = useState('expenses')
  const [simplify, setSimplify]       = useState(true)

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [tRes, eRes, sRes, bRes, iRes] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/expenses/trip/${tripId}`),
        api.get(`/settlements/trip/${tripId}`),
        api.get(`/trips/${tripId}/balances`, { params: { simplify } }),
        api.get(`/trips/${tripId}/insights`),
      ])
      setTrip(tRes.data.data)
      setExpenses(eRes.data.data)
      setSettlements(sRes.data.data)
      setBalances(bRes.data.data)
      setInsights(iRes.data.data)
    } catch (err) {
      dialog.alert('Error', 'Failed to load trip', { variant: 'error' })
      router.back()
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [tripId, simplify, dialog])

  useEffect(() => { loadAll() }, [loadAll])

  // Socket live updates
  useEffect(() => {
    const socket = getSocket()
    socket.emit('join_trip', tripId)
    const refresh = () => loadAll(true)
    const events = ['expense_created','expense_updated','expense_deleted',
                    'settlement_created','settlement_deleted','member_added','member_removed','trip_updated']
    events.forEach((e) => socket.on(e, refresh))
    return () => {
      socket.emit('leave_trip', tripId)
      events.forEach((e) => socket.off(e, refresh))
    }
  }, [tripId, loadAll])

  const toggleArchive = async () => {
    const next = !trip?.isArchived
    const ok = await dialog.confirm(
      next ? 'Archive this trip?' : 'Unarchive this trip?',
      next
        ? 'It will be hidden from your active trips. Nothing is deleted.'
        : 'It will return to your active trips.',
      { confirmText: next ? 'Archive' : 'Unarchive' }
    )
    if (!ok) return
    try {
      await api.put(`/trips/${tripId}`, { isArchived: next })
      loadAll(true)
    } catch {
      dialog.alert('Error', 'Failed to update trip', { variant: 'error' })
    }
  }

  const deleteExpense = async (id) => {
    const ok = await dialog.confirm(
      'Delete expense?',
      'This cannot be undone.',
      { confirmText: 'Delete', destructive: true }
    )
    if (!ok) return
    try {
      await api.delete(`/expenses/${id}`)
      loadAll(true)
    } catch {
      dialog.alert('Error', 'Failed to delete', { variant: 'error' })
    }
  }

  const settleTransaction = async (t) => {
    const from = t.from?._id ?? t.from
    const to = t.to?._id ?? t.to
    const ok = await dialog.confirm(
      'Record payment?',
      `${t.from?.name ?? 'They'} pays ${t.to?.name ?? 'them'} ${trip?.currency} ${Number(t.amount).toFixed(2)}.`,
      { confirmText: 'Record' }
    )
    if (!ok) return
    try {
      await api.post(`/settlements/trip/${tripId}`, {
        fromUser: from, toUser: to, amount: t.amount,
        notes: 'Settled in one tap',
      })
      loadAll(true)
    } catch (err) {
      dialog.alert('Error', err.response?.data?.message || 'Failed to record payment', { variant: 'error' })
    }
  }

  const settleAllTransactions = async () => {
    const txns = balances?.transactions ?? []
    if (!txns.length) return
    const ok = await dialog.confirm(
      'Settle everything?',
      `Record ${txns.length} payment${txns.length === 1 ? '' : 's'} to clear all balances.`,
      { confirmText: 'Settle all' }
    )
    if (!ok) return
    try {
      await api.post(`/settlements/trip/${tripId}/settle-all`, {
        transactions: txns.map((t) => ({
          from: t.from?._id ?? t.from,
          to: t.to?._id ?? t.to,
          amount: t.amount,
        })),
      })
      loadAll(true)
    } catch (err) {
      dialog.alert('Error', err.response?.data?.message || 'Failed to settle', { variant: 'error' })
    }
  }

  const remindDebtor = async (t) => {
    const target = t.from?._id ?? t.from
    const ok = await dialog.confirm(
      'Send reminder?',
      `Nudge ${t.from?.name ?? 'them'} to pay ${trip?.currency} ${Number(t.amount).toFixed(2)}.`,
      { confirmText: 'Send' }
    )
    if (!ok) return
    try {
      await api.post(`/settlements/trip/${tripId}/remind`, {
        toUser: target, amount: t.amount,
      })
      dialog.alert('Reminder sent', `${t.from?.name ?? 'They'} has been nudged.`, { variant: 'success' })
    } catch (err) {
      dialog.alert('Error', err.response?.data?.message || 'Failed to send reminder', { variant: 'error' })
    }
  }

  const openPartial = (t) => {
    router.push({
      pathname: `/trips/${tripId}/settle`,
      params: {
        fromUser: t.from?._id ?? t.from,
        toUser: t.to?._id ?? t.to,
        amount: String(t.amount),
      },
    })
  }

  const isOwner = trip?.createdBy?._id === user?._id

  if (loading) return <LoadingScreen />

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{
        headerShown: true, title: trip?.name ?? 'Trip',
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.ink, headerShadowVisible: false,
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {isOwner && (
              <SmallButton title="Edit" onPress={() => router.push(`/trips/${tripId}/edit-trip`)} />
            )}
            <SmallButton title="+ Expense" onPress={() => router.push(`/trips/${tripId}/add-expense`)} />
          </View>
        ),
      }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(true) }} tintColor={colors.ink} />}
      >
        {/* Trip meta */}
        <View style={styles.tripMeta}>
          {trip?.description ? <Text style={styles.tripDesc}>{trip.description}</Text> : null}
          {formatDateRange(trip?.startDate, trip?.endDate) ? (
            <Text style={styles.tripDates}>{formatDateRange(trip?.startDate, trip?.endDate)}</Text>
          ) : null}
          <View style={styles.metaRow}>
            <Badge label={trip?.currency ?? ''} />
            <Text style={styles.memberCountText}>{trip?.members?.length} members</Text>
            {trip?.isArchived && <Badge label="Archived" variant="amber" />}
          </View>
        </View>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Total spent',  value: balances?.totalExpenses ?? 0 },
            { label: 'Settled',      value: balances?.totalSettled ?? 0 },
            { label: 'Outstanding',  value: Math.max(0, (balances?.totalExpenses ?? 0) - (balances?.totalSettled ?? 0)) },
          ].map(({ label, value }) => (
            <Card key={label} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{label}</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {trip?.currency} {value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
            </Card>
          ))}
        </View>

        {/* Action row */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}
            onPress={() => router.push(`/trips/${tripId}/settle`)}>
            <Text style={styles.actionBtnText}>💸 Record payment</Text>
          </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity style={styles.actionBtn}
              onPress={() => router.push(`/trips/${tripId}/invite`)}>
              <Text style={styles.actionBtnText}>📩 Invite</Text>
            </TouchableOpacity>
          )}
          {isOwner && (
            <TouchableOpacity style={styles.actionBtn} onPress={toggleArchive}>
              <Text style={styles.actionBtnText}>{trip?.isArchived ? '📤 Unarchive' : '📦 Archive'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {['expenses', 'insights', 'spending', 'balances', 'members'].map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {tab === 'expenses' && (
          <ExpensesTab expenses={expenses} userId={user?._id} currency={trip?.currency}
            tripId={tripId} onOpen={setSelectedExpense} onDelete={deleteExpense} onEdit={(e) =>
              router.push({ pathname: `/trips/${tripId}/edit-expense`, params: { expenseId: e._id } })} />
        )}
        {tab === 'insights' && (
          <InsightsTab insights={insights} currency={trip?.currency} />
        )}
        {tab === 'spending' && (
          <SpendingTab spending={balances?.spending} currency={trip?.currency} />
        )}
        {tab === 'balances' && (
          <BalancesTab balances={balances} settlements={settlements} currency={trip?.currency}
            userId={user?._id} simplify={simplify} onToggleSimplify={() => setSimplify((v) => !v)}
            onSettle={settleTransaction} onSettleAll={settleAllTransactions}
            onRemind={remindDebtor} onPartial={openPartial}
            onDeleteSettlement={async (id) => {
              const ok = await dialog.confirm(
                'Remove settlement?',
                'This will restore the outstanding balance.',
                { confirmText: 'Remove', destructive: true }
              )
              if (!ok) return
              try {
                await api.delete(`/settlements/${id}`)
                loadAll(true)
              } catch (err) {
                dialog.alert('Error', err.response?.data?.message || 'Failed to remove settlement', { variant: 'error' })
              }
            }} />
        )}
        {tab === 'members' && (
          <MembersTab trip={trip} userId={user?._id} isOwner={isOwner} onRefresh={() => loadAll(true)} />
        )}
      </ScrollView>

      <ExpenseDetailSheet
        expense={selectedExpense}
        currency={trip?.currency}
        members={trip?.members}
        userId={user?._id}
        onClose={() => setSelectedExpense(null)}
        onEdit={(expense) => {
          setSelectedExpense(null)
          router.push({ pathname: `/trips/${tripId}/edit-expense`, params: { expenseId: expense._id } })
        }}
        onDelete={(expense) => {
          setSelectedExpense(null)
          deleteExpense(expense._id)
        }}
      />
    </SafeAreaView>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ExpensesTab({ expenses, userId, currency, tripId, onOpen, onDelete, onEdit }) {
  if (!expenses.length) return <EmptyState emoji="🧾" title="No expenses yet" subtitle="Tap + Expense to add the first one." />
  return (
    <View style={{ gap: spacing.sm }}>
      {expenses.map((exp) => {
        const myShare = exp.splits?.find((s) => s.user?._id === userId)?.amount ?? 0
        const iPaid   = exp.paidBy?._id === userId
        return (
          <Card key={exp._id} style={{ padding: spacing.lg }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onOpen(exp)}
              accessibilityRole="button"
              accessibilityLabel={`${exp.title}, ${currency} ${exp.amount.toFixed(2)}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
            >
              <Text style={{ fontSize: 26 }}>{CAT_EMOJI[exp.category] ?? '📦'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.expTitle} numberOfLines={1}>{exp.title}</Text>
                <Text style={styles.expMeta}>
                  Paid by {iPaid ? 'you' : exp.paidBy?.name} · {formatDate(exp.date, { day: 'numeric', month: 'short' })}
                  {exp.splitType && exp.splitType !== 'equal' ? ` · ${SPLIT_LABELS[exp.splitType] ?? exp.splitType}` : ''}
                  {exp.recurrence?.frequency && exp.recurrence.frequency !== 'none'
                    ? ` · 🔁 ${exp.recurrence.frequency}` : ''}
                </Text>
                {exp.notes ? (
                  <Text style={styles.expNotes} numberOfLines={2}>{exp.notes}</Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {exp.currency && exp.currency !== currency ? (
                  <>
                    <Text style={{ ...type.caption, color: colors.textMuted }}>
                      {exp.currency} {Number(exp.originalAmount ?? exp.amount).toFixed(2)}
                    </Text>
                    <Text style={styles.expAmount}>{currency} {exp.amount.toFixed(2)}</Text>
                  </>
                ) : (
                  <Text style={styles.expAmount}>{currency} {exp.amount.toFixed(2)}</Text>
                )}
                <Text style={{ ...type.caption, color: iPaid ? colors.success : colors.textMuted }}>
                  {iPaid ? `lent ${(exp.amount - myShare).toFixed(2)}` : `owe ${myShare.toFixed(2)}`}
                </Text>
              </View>
            </TouchableOpacity>
            {(exp.createdBy?._id === userId || exp.paidBy?._id === userId) && (
              <View style={styles.expActions}>
                <TouchableOpacity onPress={() => onEdit(exp)} style={styles.expActionBtn}>
                  <Text style={styles.expActionText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(exp._id)} style={styles.expActionBtn}>
                  <Text style={[styles.expActionText, { color: colors.danger }]}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )
      })}
    </View>
  )
}

function ExpenseDetailSheet({ expense, currency, members, userId, onClose, onEdit, onDelete }) {
  if (!expense) return null

  const canManage = expense.createdBy?._id === userId || expense.paidBy?._id === userId
  const splitLabel = {
    equal: 'Equally', exact: 'Exact amounts', percentage: 'By percentage',
    shares: 'By shares', itemized: 'Itemized',
  }[expense.splitType] || 'Equally'
  const memberMap = {}
  for (const m of members || []) memberMap[m._id] = m.name

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
            <Text style={{ fontSize: 28 }}>{CAT_EMOJI[expense.category] ?? '📦'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ ...type.headingLg }} numberOfLines={2}>{expense.title}</Text>
              <Text style={{ ...type.caption, color: colors.textMuted }}>{formatDate(expense.date)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.sheetClose} accessibilityLabel="Close details">
              <Text style={{ fontSize: 15 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <Text style={{ ...type.displaySm }}>{currency} {expense.amount.toFixed(2)}</Text>
            {expense.currency && expense.currency !== currency && (
              <Text style={{ ...type.caption, color: colors.textMuted }}>
                {expense.currency} {Number(expense.originalAmount ?? expense.amount).toFixed(2)}
                {expense.exchangeRate ? ` · rate ${expense.exchangeRate}` : ''}
              </Text>
            )}
          </View>

          <ScrollView
            style={{ marginTop: spacing.lg }}
            contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
            showsVerticalScrollIndicator={false}
          >
            <DetailRow label="Paid by" value={expense.paidBy?.name ?? '—'} />
            <DetailRow label="Split" value={splitLabel} />
            {expense.recurrence?.frequency && expense.recurrence.frequency !== 'none' && (
              <DetailRow
                label="Repeats"
                value={`${expense.recurrence.frequency}${expense.recurrence.interval > 1 ? ` · every ${expense.recurrence.interval}` : ''}`}
              />
            )}
            {expense.notes ? <DetailRow label="Notes" value={expense.notes} /> : null}

            {expense.items?.length ? (
              <View style={{ gap: 6 }}>
                <SectionLabel>Items</SectionLabel>
                {expense.items.map((item, idx) => (
                  <View key={idx} style={styles.detailRow}>
                    <Text style={{ ...type.bodySm, flex: 1 }} numberOfLines={1}>
                      {item.name}
                      <Text style={{ color: colors.textMuted }}>
                        {' '}· {(item.users || []).map((u) => memberMap[String(u?._id ?? u)]?.split(' ')[0]).filter(Boolean).join(', ')}
                      </Text>
                    </Text>
                    <Text style={{ ...type.bodySm }}>
                      {expense.currency || currency} {Number(item.amount).toFixed(2)}
                    </Text>
                  </View>
                ))}
                {Number(expense.tax) > 0 && <DetailRow label="Tax" value={`${expense.currency || currency} ${Number(expense.tax).toFixed(2)}`} />}
                {Number(expense.tip) > 0 && <DetailRow label="Tip" value={`${expense.currency || currency} ${Number(expense.tip).toFixed(2)}`} />}
              </View>
            ) : null}

            <View style={{ gap: 6 }}>
              <SectionLabel>Split between</SectionLabel>
              {(expense.splits || []).map((split, idx) => (
                <View key={split.user?._id ?? idx} style={styles.detailRow}>
                  <Text style={{ ...type.bodySm, flex: 1 }}>{split.user?.name ?? 'Member'}</Text>
                  <Text style={{ ...type.bodySm }}>{currency} {split.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {canManage && (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button title="Delete" variant="ghost" onPress={() => onDelete(expense)} style={{ flex: 1 }} />
              <Button title="Edit expense" onPress={() => onEdit(expense)} style={{ flex: 1 }} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={{ ...type.bodySm, width: 84, color: colors.textMuted }}>{label}</Text>
      <Text style={{ ...type.bodySm, flex: 1 }}>{value}</Text>
    </View>
  )
}

function InsightsTab({ insights, currency }) {
  if (!insights || !insights.expenseCount) {
    return <EmptyState emoji="📊" title="No insights yet" subtitle="Add a few expenses to see spending patterns." />
  }

  const {
    totalSpent, expenseCount, averageExpense, averagePerDay,
    biggestExpense, categories, daily, monthly,
  } = insights

  const useMonthly = monthly.length > 1
  const trend = useMonthly ? monthly : daily
  const trendKey = useMonthly ? 'month' : 'date'
  const maxTrend = Math.max(...trend.map((d) => d.amount), 1)

  const stats = [
    { label: 'Total spent', value: `${currency} ${totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
    { label: 'Avg / active day', value: `${currency} ${averagePerDay.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
    { label: 'Avg expense', value: `${currency} ${averageExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
    { label: 'Expenses', value: String(expenseCount) },
  ]

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {stats.map((s) => (
          <Card key={s.label} style={{ flexBasis: '47%', flexGrow: 1, padding: spacing.lg }}>
            <Text style={styles.summaryLabel}>{s.label}</Text>
            <Text style={{ ...type.bodyLg, marginTop: 2 }} numberOfLines={1}>{s.value}</Text>
          </Card>
        ))}
      </View>

      {biggestExpense && (
        <Card style={{ padding: spacing.lg }}>
          <Text style={styles.summaryLabel}>Biggest expense</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 }}>
            <Text style={{ fontSize: 22 }}>{CAT_EMOJI[biggestExpense.category] ?? '📦'}</Text>
            <Text style={{ ...type.bodyMdStrong, flex: 1 }} numberOfLines={1}>{biggestExpense.title}</Text>
            <Text style={{ ...type.bodyMdStrong }}>{currency} {biggestExpense.amount.toFixed(2)}</Text>
          </View>
        </Card>
      )}

      {/* Trend */}
      <Card style={{ padding: spacing.lg }}>
        <SectionLabel>{useMonthly ? 'Monthly trend' : 'Daily trend'}</SectionLabel>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 130, marginTop: spacing.sm }}>
          {trend.slice(-14).map((point) => {
            const height = Math.max(4, (point.amount / maxTrend) * 90)
            const label = useMonthly
              ? new Date(`${point[trendKey]}-01`).toLocaleDateString('en-IN', { month: 'short' })
              : String(new Date(point[trendKey]).getDate())
            return (
              <View key={point[trendKey]} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <View style={{ width: '100%', height, backgroundColor: colors.accent, borderRadius: 4, opacity: 0.85 }} />
                <Text style={{ ...type.caption, fontSize: 9 }} numberOfLines={1}>{label}</Text>
              </View>
            )
          })}
        </View>
      </Card>

      {/* Categories */}
      <Card style={{ padding: spacing.lg }}>
        <SectionLabel>By category</SectionLabel>
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          {categories.map((c) => (
            <View key={c.category} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Text style={{ fontSize: 16 }}>{CAT_EMOJI[c.category] ?? '📦'}</Text>
                <Text style={{ ...type.bodySm, flex: 1, textTransform: 'capitalize' }}>{c.category}</Text>
                <Text style={{ ...type.caption, color: colors.textMuted }}>
                  {c.count} · {c.percentage.toFixed(0)}%
                </Text>
                <Text style={{ ...type.bodySm }}>{currency} {c.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
              </View>
              <View style={{ height: 6, borderRadius: 9999, backgroundColor: colors.surface, overflow: 'hidden' }}>
                <View style={{ width: `${Math.max(2, c.percentage)}%`, height: '100%', backgroundColor: colors.accent, borderRadius: 9999 }} />
              </View>
            </View>
          ))}
        </View>
      </Card>
    </View>
  )
}

function SpendingTab({ spending, currency }) {
  if (!spending?.length) {
    return <EmptyState emoji="💸" title="No spending yet" subtitle="Add an expense to see member totals." />
  }
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ ...type.caption, color: colors.textMuted }}>
        Amount each member has settled so far
      </Text>
      {spending.map((s) => (
        <Card key={s.user?._id} style={{ padding: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Avatar user={s.user} size="sm" />
            <View style={{ flex: 1 }}>
              <Text style={{ ...type.bodyMdStrong }}>{s.user?.name}</Text>
              {!s.isFullySettled && s.totalShare > 0 && (
                <Text style={{ ...type.caption, color: colors.textMuted }}>
                  {currency} {s.totalSpent.toFixed(2)} of {currency} {s.totalShare.toFixed(2)} settled
                </Text>
              )}
            </View>
            <Text style={{ ...type.bodyMdStrong }}>
              {currency} {s.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </Text>
          </View>
        </Card>
      ))}
    </View>
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

  const noData = !balances.transactions?.length && !settlements?.length
  if (noData) return <EmptyState emoji="✅" title="All settled up!" subtitle="No outstanding balances." />

  return (
    <View style={{ gap: spacing.xl }}>
      {/* Progress */}
      <Card style={{ padding: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
          <Text style={{ ...type.bodySm, color: colors.textMuted }}>
            {totalSettled.toFixed(2)} of {totalExpenses.toFixed(2)} {currency} settled
          </Text>
          <Text style={{ ...type.captionStrong, color: outstanding > 0.01 ? colors.danger : colors.success }}>
            {outstanding > 0.01 ? `${outstanding.toFixed(2)} left` : 'All clear'}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      </Card>

      {/* Simplify toggle */}
      <View style={styles.simplifyRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.bodyMdStrong, color: colors.ink }}>Simplify debts</Text>
          <Text style={{ ...type.caption, color: colors.textMuted, marginTop: 2 }}>
            Fewer payments by routing through the group
          </Text>
        </View>
        <Switch
          value={simplify}
          onValueChange={onToggleSimplify}
          trackColor={{ false: colors.border, true: colors.ink }}
          thumbColor={colors.white}
          accessibilityLabel="Simplify debts"
        />
      </View>

      {balances.transactions?.length > 0 && (
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionLabel style={{ marginBottom: 0 }}>
              {simplify ? 'Suggested settlements' : 'Direct debts'}
            </SectionLabel>
            <TouchableOpacity onPress={onSettleAll} style={styles.settleAllBtn} accessibilityRole="button">
              <Text style={{ ...type.captionStrong, color: colors.white }}>⚡ Settle all</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: spacing.sm }} />
          {balances.transactions.map((t, i) => (
            <Card key={i} style={{ padding: spacing.md, marginBottom: spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Avatar user={t.from} size="sm" />
                <Text style={{ ...type.bodySm, flex: 1 }}>
                  <Text style={{ fontWeight: '600' }}>{t.from?.name}</Text>
                  {' → '}
                  <Text style={{ fontWeight: '600' }}>{t.to?.name}</Text>
                </Text>
                <Text style={{ ...type.bodyMdStrong }}>{currency} {t.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.txnActions}>
                <TouchableOpacity onPress={() => onSettle(t)} style={styles.txnBtn} accessibilityRole="button">
                  <Text style={styles.txnBtnText}>✓ Settle</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onPartial(t)} style={styles.txnBtn} accessibilityRole="button">
                  <Text style={styles.txnBtnText}>Partial</Text>
                </TouchableOpacity>
                {t.to?._id === userId && (
                  <TouchableOpacity onPress={() => onRemind(t)} style={styles.txnBtn} accessibilityRole="button">
                    <Text style={styles.txnBtnText}>🔔 Remind</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))}
        </View>
      )}
      {balances.balances?.length > 0 && (
        <View>
          <SectionLabel>Net balances</SectionLabel>
          {balances.balances.map((b) => (
            <Card key={b.user?._id} style={{ padding: spacing.md, marginBottom: spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Avatar user={b.user} size="sm" />
                <Text style={{ ...type.bodySm, flex: 1 }}>{b.user?.name}</Text>
                <Text style={{ ...type.bodyMdStrong, color: b.netAmount >= 0 ? colors.success : colors.danger }}>
                  {b.netAmount >= 0 ? '+' : ''}{currency} {Math.abs(b.netAmount).toFixed(2)}
                </Text>
                <Text style={{ ...type.caption, color: colors.textMuted }}>
                  {b.netAmount >= 0 ? 'owed' : 'owes'}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
      {settlements?.length > 0 && (
        <View>
          <SectionLabel>Payment history</SectionLabel>
          {settlements.map((s) => (
            <Card key={s._id} style={{ padding: spacing.md, marginBottom: spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Text style={{ fontSize: 20 }}>💸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...type.bodySm }}>
                    <Text style={{ fontWeight: '600' }}>{s.fromUser?.name}</Text> paid <Text style={{ fontWeight: '600' }}>{s.toUser?.name}</Text>
                  </Text>
                  <Text style={{ ...type.caption, color: colors.textMuted }}>
                    {formatDate(s.settledAt)}
                  </Text>
                </View>
                <Text style={{ ...type.bodyMdStrong }}>{currency} {s.amount.toFixed(2)}</Text>
                <TouchableOpacity onPress={() => onDeleteSettlement(s._id)}>
                  <Text style={{ fontSize: 16 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      )}
    </View>
  )
}

function MembersTab({ trip, userId, isOwner, onRefresh }) {
  const router = useRouter()
  const dialog = useDialog()
  const removeMember = async (memberId, name) => {
    const ok = await dialog.confirm(
      `Remove ${name}?`,
      'They will lose access to this trip.',
      { confirmText: 'Remove', destructive: true }
    )
    if (!ok) return
    try {
      await api.delete(`/trips/${trip._id}/members/${memberId}`)
      onRefresh()
    } catch (err) {
      dialog.alert('Error', err.response?.data?.message || 'Failed', { variant: 'error' })
    }
  }
  return (
    <View style={{ gap: spacing.sm }}>
      {isOwner && (
        <TouchableOpacity style={styles.inviteRow}
          onPress={() => router.push(`/trips/${trip._id}/invite`)}>
          <Text style={{ fontSize: 20 }}>📩</Text>
          <Text style={{ ...type.bodyMdStrong, color: colors.ink }}>Invite someone</Text>
        </TouchableOpacity>
      )}
      {trip?.members?.map((m) => (
        <Card key={m._id} style={{ padding: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Avatar user={m} size="md" />
            <View style={{ flex: 1 }}>
              <Text style={{ ...type.bodyMdStrong }}>{m.name}</Text>
              <Text style={{ ...type.caption, color: colors.textMuted }}>{m.email}</Text>
            </View>
            {m._id === trip.createdBy?._id && <Badge label="Owner" variant="ink" />}
            {isOwner && m._id !== trip.createdBy?._id && m._id !== userId && (
              <TouchableOpacity onPress={() => removeMember(m._id, m.name)}>
                <Text style={{ ...type.bodySm, color: colors.textMuted }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.canvas },
  tripMeta:    { marginBottom: spacing.lg },
  tripDesc:    { ...type.bodyMd, color: colors.textMuted, marginBottom: spacing.xs },
  tripDates:   { ...type.caption, color: colors.textMuted, marginBottom: spacing.xs },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  memberCountText: { ...type.caption, color: colors.textMuted },
  summaryRow:  { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  summaryCard: { flex: 1, padding: spacing.md },
  summaryLabel:{ ...type.caption, color: colors.textMuted, marginBottom: 4 },
  summaryValue:{ ...type.bodyMdStrong, color: colors.ink },
  actionRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  actionBtn:   { flex: 1, minWidth: '28%', padding: spacing.md, borderRadius: 12,
                 backgroundColor: colors.neutral, alignItems: 'center' },
  actionBtnText: { ...type.bodySm, color: colors.ink },
  tabRow:      { flexDirection: 'row', gap: 2, backgroundColor: colors.neutral,
                 borderRadius: 9999, padding: 4, marginBottom: spacing.lg },
  tab:         { flex: 1, paddingVertical: spacing.xs, borderRadius: 9999, alignItems: 'center' },
  tabActive:   { backgroundColor: colors.white, ...shadow.sm },
  tabText:     { ...type.bodySm, color: colors.textMuted },
  tabTextActive:{ ...type.bodyMdStrong, color: colors.ink },
  expTitle:    { ...type.bodyMdStrong, color: colors.ink },
  expMeta:     { ...type.caption, color: colors.textMuted, marginTop: 2 },
  expNotes:    { ...type.caption, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  expAmount:   { ...type.bodyMdStrong, color: colors.ink },
  progressTrack: { height: 8, borderRadius: 9999, backgroundColor: colors.neutral, overflow: 'hidden' },
  progressFill:  { height: 8, borderRadius: 9999, backgroundColor: colors.ink },
  simplifyRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                   padding: spacing.md, borderRadius: 12, backgroundColor: colors.surface },
  settleAllBtn:  { backgroundColor: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 6,
                   borderRadius: 9999 },
  txnActions:    { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm,
                   paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  txnBtn:        { paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 9999,
                   backgroundColor: colors.neutral },
  txnBtnText:    { ...type.captionStrong, color: colors.ink },
  expActions:  { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm,
                 paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  expActionBtn:{ flex: 1, alignItems: 'center' },
  expActionText:{ ...type.bodySm, color: colors.textMuted },
  inviteRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                 padding: spacing.md, borderRadius: 12, borderWidth: 1,
                 borderColor: colors.border, borderStyle: 'dashed' },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(3,3,2,0.35)' },
  sheet:       { backgroundColor: colors.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28,
                 padding: spacing.xl, paddingBottom: spacing.xxl, maxHeight: '85%' },
  sheetClose:  { width: 36, height: 36, borderRadius: 9999, backgroundColor: colors.surface,
                 alignItems: 'center', justifyContent: 'center' },
  detailRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
})
