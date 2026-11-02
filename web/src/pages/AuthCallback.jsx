import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function AuthCallback() {
  const [params] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const token = params.get('token')
    const error = params.get('error')

    if (error || !token) {
      toast.error('Google sign-in failed. Please try again.')
      navigate('/login', { replace: true })
      return
    }

    login(token)

    // If user was trying to accept an invite before signing in, redirect there
    const pendingInviteToken = sessionStorage.getItem('pending_invite_token')
    if (pendingInviteToken) {
      sessionStorage.removeItem('pending_invite_token')
      navigate(`/invite/accept?token=${pendingInviteToken}`, { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ backgroundColor: 'var(--color-canvas)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
             style={{ borderColor: 'var(--color-ink)', borderTopColor: 'transparent' }} />
        <p className="text-body-sm" style={{ color: 'var(--color-text-muted)' }}>
          Signing you in…
        </p>
      </div>
    </div>
  )
}
