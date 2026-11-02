import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, SectionList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, ScrollView,
} from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../../src/lib/api'
import { useAuth } from '../../../src/context/AuthContext'
import { getSocket } from '../../../src/lib/socket'
import { Card, SmallButton, Badge, Avatar, Divider, SectionLabel, LoadingScreen, EmptyState } from '../../../src/components/ui'
import { colors, spacing, type, shadow } from '../../../src/theme'

const CAT_EMOJI = { food:'🍽️', transport:'🚗', accommodation:'🏨', entertainment:'🎭', shopping:'🛍️', other:'📦' }

export default function TripDetailScreen() {
  const { tripId } = useLocalSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  const [trip, setTrip]               = useState(null)
  const [expenses, setExpenses]       = useState([])
  const [settlements, setSettlements] = useState([])
  const [balances, setBalances]       = useState(null)
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [tab, setTab]                 = useState('expenses')

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [tRes, eRes, sRes, bRes] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/expenses/trip/${tripId}`),
        api.get(`/settlements/trip/${tripId}`),
        api.get(`/trips/${tripId}/balances`),
      ])
      setTrip(tRes.data.data)
      setExpenses(eRes.data.data)
      setSettlements(sRes.data.data)
      setBalances(bRes.data.data)
    } catch (err) {
      Alert.alert('Error', 'Failed to load trip')
      router.back()
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [tripId])

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

  const deleteExpense = (id) => {
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/expenses/${id}`); loadAll(true) }
        catch { Alert.alert('Error', 'Failed to delete') }
      }},
    ])
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
              <Text style={styles.actionBtnText}>📩 Invite member</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {['expenses', 'balances', 'members'].map((t) => (
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
            tripId={tripId} onDelete={deleteExpense} onEdit={(e) =>
              router.push({ pathname: `/trips/${tripId}/edit-expense`, params: { expenseId: e._id } })} />
        )}
        {tab === 'balances' && (
          <BalancesTab balances={balances} settlements={settlements} currency={trip?.currency}
            userId={user?._id} onDeleteSettlement={(id) => {
              Alert.alert('Remove settlement?', '', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: async () => {
                  await api.delete(`/settlements/${id}`); loadAll(true)
                }},
              ])
            }} />
        )}
        {tab === 'members' && (
          <MembersTab trip={trip} userId={user?._id} isOwner={isOwner} onRefresh={() => loadAll(true)} />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ExpensesTab({ expenses, userId, currency, tripId, onDelete, onEdit }) {
  if (!expenses.length) return <EmptyState emoji="🧾" title="No expenses yet" subtitle="Tap + Expense to add the first one." />
  return (
    <View style={{ gap: spacing.sm }}>
      {expenses.map((exp) => {
        const myShare = exp.splits?.find((s) => s.user?._id === userId)?.amount ?? 0
        const iPaid   = exp.paidBy?._id === userId
        return (
          <Card key={exp._id} style={{ padding: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Text style={{ fontSize: 26 }}>{CAT_EMOJI[exp.category] ?? '📦'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.expTitle} numberOfLines={1}>{exp.title}</Text>
                <Text style={styles.expMeta}>
                  Paid by {iPaid ? 'you' : exp.paidBy?.name} · {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.expAmount}>{currency} {exp.amount.toFixed(2)}</Text>
                <Text style={{ ...type.caption, color: iPaid ? colors.success : colors.textMuted }}>
                  {iPaid ? `lent ${(exp.amount - myShare).toFixed(2)}` : `owe ${myShare.toFixed(2)}`}
                </Text>
              </View>
            </View>
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

function BalancesTab({ balances, settlements, currency, userId, onDeleteSettlement }) {
  if (!balances) return null
  const noData = !balances.transactions?.length && !settlements?.length
  if (noData) return <EmptyState emoji="✅" title="All settled up!" subtitle="No outstanding balances." />
  return (
    <View style={{ gap: spacing.xl }}>
      {balances.transactions?.length > 0 && (
        <View>
          <SectionLabel>Suggested settlements</SectionLabel>
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
                    {new Date(s.settledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
  const removeMember = (memberId, name) => {
    Alert.alert(`Remove ${name}?`, 'They will lose access to this trip.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await api.delete(`/trips/${trip._id}/members/${memberId}`); onRefresh() }
        catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed') }
      }},
    ])
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
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  memberCountText: { ...type.caption, color: colors.textMuted },
  summaryRow:  { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  summaryCard: { flex: 1, padding: spacing.md },
  summaryLabel:{ ...type.caption, color: colors.textMuted, marginBottom: 4 },
  summaryValue:{ ...type.bodyMdStrong, color: colors.ink },
  actionRow:   { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  actionBtn:   { flex: 1, padding: spacing.md, borderRadius: 12, backgroundColor: colors.neutral,
                 alignItems: 'center' },
  actionBtnText: { ...type.bodySm, color: colors.ink },
  tabRow:      { flexDirection: 'row', gap: 2, backgroundColor: colors.neutral,
                 borderRadius: 9999, padding: 4, marginBottom: spacing.lg },
  tab:         { flex: 1, paddingVertical: spacing.xs, borderRadius: 9999, alignItems: 'center' },
  tabActive:   { backgroundColor: colors.white, ...shadow.sm },
  tabText:     { ...type.bodySm, color: colors.textMuted },
  tabTextActive:{ ...type.bodyMdStrong, color: colors.ink },
  expTitle:    { ...type.bodyMdStrong, color: colors.ink },
  expMeta:     { ...type.caption, color: colors.textMuted, marginTop: 2 },
  expAmount:   { ...type.bodyMdStrong, color: colors.ink },
  expActions:  { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm,
                 paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  expActionBtn:{ flex: 1, alignItems: 'center' },
  expActionText:{ ...type.bodySm, color: colors.textMuted },
  inviteRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                 padding: spacing.md, borderRadius: 12, borderWidth: 1,
                 borderColor: colors.border, borderStyle: 'dashed' },
})
