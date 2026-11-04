import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { getSocket } from '../lib/socket'
import { useAuth } from '../context/AuthContext'
import { timeAgo } from '../lib/date'

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

export default function NotificationsBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const panelRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchUnread = useCallback(() => {
    api.get('/notifications/unread-count')
      .then(({ data }) => setUnread(data.data.count))
      .catch(() => {})
  }, [])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notifications')
      setItems(data.data)
      setUnread(data.data.filter((n) => !n.readAt).length)
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    fetchUnread()
    const socket = getSocket()
    socket.emit('join_user', user._id)
    const onNew = ({ notification }) => {
      setUnread((c) => c + 1)
      setItems((prev) => [notification, ...prev].slice(0, 50))
      toast(notification.title, { icon: ICONS[notification.type] ?? '🔔' })
    }
    socket.on('notification_created', onNew)
    return () => socket.off('notification_created', onNew)
  }, [user, fetchUnread])

  useEffect(() => {
    if (!open) return
    fetchItems()
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open, fetchItems])

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })))
    setUnread(0)
    try {
      await api.put('/notifications/read-all')
    } catch {
      toast.error('Failed to mark notifications as read')
    }
  }

  const openNotification = async (notification) => {
    if (!notification.readAt) {
      setItems((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, readAt: new Date().toISOString() } : n))
      )
      setUnread((c) => Math.max(0, c - 1))
      api.put(`/notifications/${notification._id}/read`).catch(() => {})
    }
    setOpen(false)
    if (notification.trip?._id) navigate(`/trips/${notification.trip._id}`)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: 'var(--color-surface)', border: 'none', cursor: 'pointer' }}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
      >
        <span style={{ fontSize: 16 }}>🔔</span>
        {unread > 0 && (
          <span
            className="absolute flex items-center justify-center"
            style={{
              top: -2, right: -2, minWidth: 16, height: 16, padding: '0 3px',
              borderRadius: 9999, background: 'var(--color-accent)', color: '#fff',
              fontSize: 9, fontWeight: 700,
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 rounded-2xl overflow-hidden"
          style={{
            width: 340, maxHeight: 440, display: 'flex', flexDirection: 'column',
            background: '#fff', border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)', zIndex: 50,
          }}
        >
          <div className="flex items-center justify-between px-4 py-3"
               style={{ borderBottom: '1px solid var(--color-border)' }}>
            <span className="text-body-md-strong">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-caption"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="text-caption p-4" style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
            ) : items.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-body-sm" style={{ color: 'var(--color-text-muted)' }}>
                  You're all caught up
                </p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  onClick={() => openNotification(n)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3"
                  style={{
                    background: n.readAt ? '#fff' : 'rgba(255,69,0,0.045)',
                    border: 'none', borderBottom: '1px solid var(--color-border)', cursor: 'pointer',
                  }}
                >
                  <span className="text-lg flex-shrink-0">{ICONS[n.type] ?? '🔔'}</span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-body-sm font-medium truncate">{n.title}</span>
                      {!n.readAt && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: 'var(--color-accent)' }} />
                      )}
                    </span>
                    {n.body && (
                      <span className="block text-caption truncate" style={{ color: 'var(--color-text-muted)' }}>
                        {n.body}
                      </span>
                    )}
                    <span className="block text-caption mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {timeAgo(n.createdAt)}{n.trip?.name ? ` · ${n.trip.name}` : ''}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
