import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import api from '../src/lib/api'
import { colors, spacing, type } from '../src/theme'
import { timeAgo } from '../src/lib/date'
import { EmptyState, LoadingScreen, SmallButton, Divider } from '../src/components/ui'
import { useDialog } from '../src/components/Dialog'

const ICONS = {
  expense_added: '🧾',
  expense_updated: '✏️',
  expense_deleted: '🗑️',
  settlement_recorded: '💸',
  settlement_reminder: '⏰',
  settlement_deleted: '↩️',
  member_added: '👋',
  member_removed: '👋',
  trip_updated: '✈️',
}

export default function NotificationsScreen() {
  const router = useRouter()
  const dialog = useDialog()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data } = await api.get('/notifications')
      setItems(data.data)
    } catch {
      dialog.alert('Error', 'Failed to load notifications', { variant: 'error' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dialog])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const markAllRead = async () => {
    const unread = items.filter((n) => !n.readAt)
    if (!unread.length) return
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })))
    try {
      await api.put('/notifications/read-all')
    } catch {
      dialog.alert('Error', 'Failed to mark notifications as read', { variant: 'error' })
      load(true)
    }
  }

  const open = async (notification) => {
    if (!notification.readAt) {
      setItems((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, readAt: new Date().toISOString() } : n))
      )
      api.put(`/notifications/${notification._id}/read`).catch(() => {})
    }
    if (notification.trip?._id) {
      router.push(`/trips/${notification.trip._id}`)
    }
  }

  if (loading) return <LoadingScreen />

  const unreadCount = items.filter((n) => !n.readAt).length

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && <SmallButton title="Mark all read" onPress={markAllRead} />}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true) }}
            tintColor={colors.ink}
          />
        }
        ItemSeparatorComponent={() => <Divider style={{ marginVertical: spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState emoji="🔔" title="You're all caught up" subtitle="Trip activity and reminders will appear here." />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => open(item)}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.body}`}
          >
            <View style={[styles.iconWrap, !item.readAt && styles.iconWrapUnread]}>
              <Text style={{ fontSize: 18 }}>{ICONS[item.type] ?? '🔔'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ ...type.bodyMdStrong, flex: 1 }} numberOfLines={1}>
                  {item.title}
                </Text>
                {!item.readAt && <View style={styles.dot} />}
              </View>
              {item.body ? (
                <Text style={{ ...type.bodySm, color: colors.textMuted }} numberOfLines={2}>
                  {item.body}
                </Text>
              ) : null}
              <Text style={{ ...type.caption, color: colors.textMuted, marginTop: 2 }}>
                {timeAgo(item.createdAt)}
                {item.trip?.name ? ` · ${item.trip.name}` : ''}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  title: { ...type.displaySm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.sm },
  iconWrap: {
    width: 40, height: 40, borderRadius: 9999,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface,
  },
  iconWrapUnread: { backgroundColor: '#FFE7DD' },
  dot: { width: 8, height: 8, borderRadius: 9999, backgroundColor: colors.accent },
})
