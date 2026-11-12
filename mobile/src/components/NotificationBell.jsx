import { useCallback, useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../lib/socket'
import { colors } from '../theme'

export default function NotificationBell() {
  const router = useRouter()
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  const refresh = useCallback(() => {
    if (!user) return
    api.get('/notifications/unread-count')
      .then(({ data }) => setCount(data.data.count))
      .catch(() => {})
  }, [user])

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh])
  )

  useEffect(() => {
    if (!user) return
    const socket = getSocket()
    socket.emit('join_user', user._id)
    const onNew = () => setCount((c) => c + 1)
    socket.on('notification_created', onNew)
    return () => socket.off('notification_created', onNew)
  }, [user])

  return (
    <TouchableOpacity
      onPress={() => router.push('/notifications')}
      style={styles.btn}
      accessibilityRole="button"
      accessibilityLabel={`Notifications${count ? `, ${count} unread` : ''}`}
    >
      <Text style={{ fontSize: 20 }}>🔔</Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    width: 40, height: 40, borderRadius: 9999,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  badge: {
    position: 'absolute', top: 2, right: 1,
    minWidth: 16, height: 16, paddingHorizontal: 3,
    borderRadius: 9999, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
})
