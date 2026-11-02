import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api, { API_BASE_URL } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function AcceptInvitePage() {
  const [params] = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const token = params.get('token')

  const [preview, setPreview] = useState(null)   // trip info from /invites/preview
  const [status, setStatus]   = useState('loading') // loading | valid | invalid | accepting | done
  const [error, setError]     = useState('')
  const accepted = useRef(false)

  // Load invite preview (public — no auth needed)
  useEffect(() => {
    if (!token) { setStatus('invalid'); setError('No invite token found.'); return }
    api.get(`/invites/preview?token=${token}`)
      .then(({ data }) => { setPreview(data.data); setStatus('valid') })
      .catch((err) => {
        setError(err.response?.data?.message || 'Invalid or expired invite link.')
        setStatus('invalid')
      })
  }, [token])

  // If user is already signed in and invite is valid, auto-accept
  useEffect(() => {
    if (authLoading || accepted.current) return
    if (status === 'valid' && user) {
      accepted.current = true
      handleAccept()
    }
  }, [status, user, authLoading])

  const handleAccept = async () => {
    setStatus('accepting')
    try {
      const { data } = await api.post('/invites/accept', { token })
      toast.success(data.message || 'You joined the trip!')
      navigate(`/trips/${data.data._id}`, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not accept invite.')
      setStatus('invalid')
    }
  }

  const handleGoogleSignIn = () => {
    // Store token in sessionStorage so AuthCallback can pick it up after OAuth
    sessionStorage.setItem('pending_invite_token', token)
    window.location.href = `${API_BASE_URL}/auth/google`
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ backgroundColor: 'var(--color-canvas)' }}>
      <div className="w-full max-w-sm">

        {/* Loading */}
        {(status === 'loading' || authLoading) && (
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-4"
                 style={{ borderColor: 'var(--color-ink)', borderTopColor: 'transparent' }} />
            <p className="text-body-sm" style={{ color: 'var(--color-text-muted)' }}>Loading invite…</p>
          </div>
        )}

        {/* Auto-accepting */}
        {status === 'accepting' && (
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-4"
                 style={{ borderColor: 'var(--color-ink)', borderTopColor: 'transparent' }} />
            <p className="text-body-sm" style={{ color: 'var(--color-text-muted)' }}>Joining trip…</p>
          </div>
        )}

        {/* Invalid / expired */}
        {status === 'invalid' && (
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-heading-md mb-2">Invite not valid</h2>
            <p className="text-body-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
            <button className="btn-primary w-full" onClick={() => navigate('/')}>
              Go to dashboard
            </button>
          </div>
        )}

        {/* Valid invite — user not signed in yet */}
        {status === 'valid' && !user && preview && (
          <div>
            {/* Inviter info */}
            <div className="text-center mb-8">
              {preview.invitedBy?.avatar ? (
                <img src={preview.invitedBy.avatar} alt={preview.invitedBy.name}
                     className="avatar avatar-lg mx-auto mb-3"
                     style={{ border: '2px solid var(--color-border)' }} />
              ) : (
                <div className="avatar avatar-lg mx-auto mb-3"
                     style={{ backgroundColor: 'var(--color-neutral)', color: 'var(--color-ink)', fontSize: 20 }}>
                  {preview.invitedBy?.name?.charAt(0) ?? '?'}
                </div>
              )}
              <p className="text-body-sm" style={{ color: 'var(--color-text-muted)' }}>
                <strong style={{ color: 'var(--color-ink)' }}>{preview.invitedBy?.name}</strong> invited you to join
              </p>
            </div>

            {/* Trip card */}
            <div className="card p-6 mb-6">
              <p className="text-heading-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>Trip invitation</p>
              <h2 className="text-heading-lg mb-3">{preview.tripName}</h2>
              <div className="flex items-center gap-2">
                <span className="badge badge-neutral">💰 {preview.currency}</span>
                <span className="badge badge-neutral">
                  👥 {preview.memberCount} {preview.memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>
              {preview.expiresAt && (
                <p className="text-caption mt-3" style={{ color: 'var(--color-text-muted)' }}>
                  Invite expires {new Date(preview.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>

            {/* Email match note */}
            <p className="text-caption text-center mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Sign in with <strong>{preview.email}</strong> to accept this invite.
            </p>

            <button onClick={handleGoogleSignIn} className="btn-primary w-full gap-3">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#fff" opacity=".9"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#fff" opacity=".9"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fff" opacity=".9"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#fff" opacity=".9"/>
              </svg>
              Sign in with Google to join
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
