import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationsBell from '../components/NotificationsBell'
import toast from 'react-hot-toast'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-canvas)' }}>
      {/* Nav */}
      <header
        className="sticky top-0 z-40 w-full"
        style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(252,249,247,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-5 h-14 flex items-center justify-between gap-2">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 text-decoration-none">
            <span className="text-xl" role="img" aria-label="plane">✈️</span>
            <span className="font-serif text-heading-lg" style={{ color: 'var(--color-ink)' }}>
              SplitWise
            </span>
          </Link>

          {/* User area */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationsBell />
            <div className="flex items-center gap-2">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer"
                     className="avatar avatar-sm" style={{ border: '1px solid var(--color-border)' }} />
              ) : (
                <div className="avatar avatar-sm"
                     style={{ backgroundColor: 'var(--color-neutral)', color: 'var(--color-text-muted)' }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-body-sm hidden sm:block" style={{ color: 'var(--color-text-muted)' }}>
                {user?.name}
              </span>
            </div>
            <button onClick={handleLogout} className="btn-ghost" style={{ height: 36, padding: '8px 10px', fontSize: 13 }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-5 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
