import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './layouts/AppLayout'
import ErrorBoundary from './components/ErrorBoundary'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import AuthCallback from './pages/AuthCallback'
import DashboardPage from './pages/DashboardPage'
import TripDetailPage from './pages/TripDetailPage'
import AcceptInvitePage from './pages/AcceptInvitePage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user)    return <Navigate to="/dashboard" replace />
  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ backgroundColor: 'var(--color-canvas)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
             style={{ borderColor: 'var(--color-ink)', borderTopColor: 'transparent' }} />
        <p className="text-body-sm" style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/invite/accept" element={<AcceptInvitePage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/trips/:tripId" element={<TripDetailPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff',
            color: 'var(--color-ink)',
            border: '1px solid rgba(3,3,2,0.09)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-sm)',
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#030302', secondary: '#fff' },
          },
        }}
      />
    </AuthProvider>
  )
}
