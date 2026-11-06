import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Modal, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../src/lib/api'
import { useAuth } from '../../src/context/AuthContext'
import { Card, Button, Input, Badge, Avatar, EmptyState, LoadingScreen, DateField } from '../../src/components/ui'
import NotificationBell from '../../src/components/NotificationBell'
import OfflineBanner from '../../src/components/OfflineBanner'
import { useDialog } from '../../src/components/Dialog'
import { colors, spacing, type, shadow } from '../../src/theme'
import { formatDateRange } from '../../src/lib/date'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'JPY', 'AED']

export default function TripsScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const dialog = useDialog()
  const [trips, setTrips]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState('active')
  const [fromCache, setFromCache] = useState(false)

  const fetchTrips = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data, fromCache: cached } = await api.get('/trips')
      setTrips(data.data)
      setFromCache(!!cached)
    } catch {
      setFromCache(false)
      dialog.alert('Error', 'Failed to load trips', { variant: 'error' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dialog])

  useEffect(() => { fetchTrips() }, [fetchTrips])

  const onRefresh = () => { setRefreshing(true); fetchTrips(true) }

  const handleCreated = (trip) => {
    setTrips((p) => [trip, ...p])
    setShowCreate(false)
  }

  if (loading) return <LoadingScreen />

  const visibleTrips = trips.filter((t) =>
    filter === 'all' ? true : filter === 'archived' ? t.isArchived : !t.isArchived
  )
  const FILTERS = [
    { key: 'active', label: 'Active' },
    { key: 'archived', label: 'Archived' },
    { key: 'all', label: 'All' },
  ]

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good to see you,</Text>
          <Text style={styles.name}>{user?.name?.split(' ')[0]}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <NotificationBell />
          <Avatar user={user} size="md" />
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.xl }}>
        <OfflineBanner visible={fromCache} />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === f.key }}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trip list */}
      <FlatList
        data={visibleTrips}
        keyExtractor={(t) => t._id}
        contentContainerStyle={[styles.list, visibleTrips.length === 0 && { flex: 1 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
        ListEmptyComponent={
          <EmptyState emoji={filter === 'archived' ? '📦' : '🗺️'}
            title={filter === 'archived' ? 'No archived trips' : trips.length ? 'Nothing here' : 'No trips yet'}
            subtitle={filter === 'archived'
              ? 'Archived trips will appear here once you tuck one away.'
              : 'Create your first trip and start splitting expenses.'}
            action={filter === 'archived' ? undefined : 'Create trip'}
            onAction={() => setShowCreate(true)} />
        }
        renderItem={({ item }) => (
          <TripCard trip={item} onPress={() => router.push(`/trips/${item._id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Create modal */}
      <CreateTripModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
    </SafeAreaView>
  )
}

function TripCard({ trip, onPress }) {
  return (
    <Card onPress={onPress} style={styles.tripCard}>
      <View style={styles.tripCardInner}>
        <View style={styles.tripInitials}>
          <Text style={styles.tripInitialsText}>{trip.name.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.tripName} numberOfLines={1}>{trip.name}</Text>
          {trip.description ? (
            <Text style={styles.tripDesc} numberOfLines={1}>{trip.description}</Text>
          ) : null}
          {formatDateRange(trip.startDate, trip.endDate) ? (
            <Text style={styles.tripDates} numberOfLines={1}>
              {formatDateRange(trip.startDate, trip.endDate)}
            </Text>
          ) : null}
          <View style={styles.tripMeta}>
            {/* Member avatars */}
            <View style={styles.avatarStack}>
              {trip.members?.slice(0, 4).map((m, i) => (
                <View key={m._id} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i }}>
                  <Avatar user={m} size="sm" />
                </View>
              ))}
            </View>
            <Text style={styles.memberCount}>{trip.members?.length} {trip.members?.length === 1 ? 'person' : 'people'}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Badge label={trip.currency} />
          {trip.isArchived && <Badge label="Archived" variant="amber" />}
        </View>
      </View>
    </Card>
  )
}

function CreateTripModal({ visible, onClose, onCreated }) {
  const dialog = useDialog()
  const EMPTY = { name: '', description: '', currency: 'INR', startDate: null, endDate: null }
  const [form, setForm]   = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }))

  const handleCreate = async () => {
    if (!form.name.trim()) return dialog.alert('Required', 'Trip name is required')
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      return dialog.alert('Check dates', 'End date cannot be before start date')
    }
    setSaving(true)
    try {
      const { data } = await api.post('/trips', { ...form, name: form.name.trim() })
      onCreated(data.data)
      setForm(EMPTY)
    } catch (err) {
      dialog.alert('Error', err.response?.data?.message || 'Failed to create trip', { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>New trip</Text>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxxl }}
            keyboardShouldPersistTaps="handled"
          >
            <Input label="Trip name *" value={form.name} onChangeText={set('name')}
              placeholder="e.g. Goa 2026" autoFocus />
            <Input label="Description" value={form.description} onChangeText={set('description')}
              placeholder="Optional" multiline numberOfLines={2} />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <DateField label="Start date" value={form.startDate} onChange={set('startDate')}
                placeholder="Optional" style={{ flex: 1 }} />
              <DateField label="End date" value={form.endDate} onChange={set('endDate')}
                placeholder="Optional" minimumDate={form.startDate ? new Date(form.startDate) : undefined}
                style={{ flex: 1 }} />
            </View>
            <View>
              <Text style={styles.inputLabel}>Currency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                  {CURRENCIES.map((c) => (
                    <TouchableOpacity key={c} onPress={() => set('currency')(c)}
                      style={[styles.currencyChip, form.currency === c && styles.currencyChipActive]}>
                      <Text style={{ ...type.bodyMdStrong,
                        color: form.currency === c ? colors.white : colors.ink }}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <Button title="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
              <Button title="Create trip" onPress={handleCreate} loading={saving} style={{ flex: 1 }} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.canvas },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
               paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg },
  greeting:  { ...type.headingXs, color: colors.textMuted },
  name:      { ...type.displayMd, color: colors.ink },
  list:      { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  tripCard:  { padding: spacing.lg },
  tripCardInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tripInitials: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.neutral,
                  alignItems: 'center', justifyContent: 'center' },
  tripInitialsText: { ...type.bodyMdStrong, color: colors.ink },
  tripName:  { ...type.bodyMdStrong, color: colors.ink, marginBottom: 2 },
  tripDesc:  { ...type.bodySm, color: colors.textMuted, marginBottom: spacing.xs },
  tripDates: { ...type.caption, color: colors.textMuted, marginBottom: spacing.xs },
  filterRow: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.xl,
               paddingBottom: spacing.md },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 9999,
                borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  filterChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterText: { ...type.captionStrong, color: colors.textMuted },
  filterTextActive: { color: colors.white },
  tripMeta:  { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  avatarStack: { flexDirection: 'row' },
  memberCount: { ...type.caption, color: colors.textMuted },
  fab: {
    position: 'absolute', right: spacing.xl, bottom: spacing.xl,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center',
    ...shadow.md,
  },
  fabText: { fontSize: 28, color: colors.white, marginTop: -2 },
  modalContainer: { flex: 1, backgroundColor: colors.canvas, padding: spacing.xl, paddingTop: spacing.md },
  modalHandle: { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2,
                 alignSelf: 'center', marginBottom: spacing.lg },
  modalTitle: { ...type.displayMd, color: colors.ink, marginBottom: spacing.xl },
  inputLabel: { ...type.headingXs, color: colors.textMuted, marginBottom: 6 },
  currencyChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
                  borderRadius: 9999, borderWidth: 1, borderColor: colors.border,
                  backgroundColor: colors.white },
  currencyChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
})
