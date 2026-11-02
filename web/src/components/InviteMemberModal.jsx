import { useState, useEffect } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function InviteMemberModal({ trip, onClose, onInvited }) {
  const [email, setEmail]       = useState('')
  const [invites, setInvites]   = useState([])
  const [sending, setSending]   = useState(false)
  const [loadingInvites, setLoadingInvites] = useState(true)

  useEffect(() => {
    api.get(`/invites/trips/${trip._id}`)
      .then(({ data }) => setInvites(data.data))
      .catch(() => {})
      .finally(() => setLoadingInvites(false))
  }, [trip._id])

  const handleInvite = async (e) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return toast.error('Enter an email address')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return toast.error('Enter a valid email')

    setSending(true)
    try {
      // First try the trips/:id/members route (handles both existing users and invites)
      const { data } = await api.post(`/trips/${trip._id}/members`, { email: trimmed })
      if (data.invited) {
        toast.success(`Invite sent to ${trimmed}`)
      } else {
        toast.success(`${trimmed} added to trip!`)
      }
      setEmail('')
      onInvited()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite')
    } finally {
      setSending(false)
    }
  }

  const cancelInvite = async (inviteId) => {
    try {
      await api.delete(`/invites/${inviteId}`)
      setInvites((p) => p.filter((i) => i._id !== inviteId))
      toast.success('Invite cancelled')
    } catch {
      toast.error('Failed to cancel invite')
    }
  }

  const pendingInvites = invites.filter((i) => i.status === 'pending')
  const pastInvites    = invites.filter((i) => i.status !== 'pending')

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-heading-md">Invite to trip</h2>
          <p className="text-body-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Enter an email — they'll get a link to join.
          </p>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Invite form */}
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              className="input flex-1"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-primary-sm flex-shrink-0 px-5" disabled={sending}>
              {sending ? '…' : 'Send'}
            </button>
          </form>

          {/* Pending invites */}
          {!loadingInvites && pendingInvites.length > 0 && (
            <div>
              <p className="label mb-3">Pending invitations</p>
              <div className="flex flex-col gap-2">
                {pendingInvites.map((inv) => (
                  <div key={inv._id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                       style={{ backgroundColor: 'var(--color-surface)' }}>
                    <span className="text-lg">📩</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium truncate">{inv.email}</p>
                      <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
                        Expires {new Date(inv.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span className="badge badge-amber">Pending</span>
                    <button onClick={() => cancelInvite(inv._id)}
                            className="text-caption hover:opacity-70"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past invites */}
          {!loadingInvites && pastInvites.length > 0 && (
            <div>
              <p className="label mb-3">Past invitations</p>
              <div className="flex flex-col gap-2">
                {pastInvites.slice(0, 5).map((inv) => (
                  <div key={inv._id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                       style={{ backgroundColor: 'var(--color-surface)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm truncate">{inv.email}</p>
                    </div>
                    <span className={`badge ${inv.status === 'accepted' ? 'badge-green' : 'badge-neutral'}`}>
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button type="button" className="btn-ghost w-full" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
