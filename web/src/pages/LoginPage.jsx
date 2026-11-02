export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google'
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-canvas)' }}
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">✈️</div>
          <h1 className="text-heading-xl" style={{ color: 'var(--color-ink)' }}>
            SplitWise
          </h1>
          <p className="text-body-md mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Track shared expenses. Settle up effortlessly.
          </p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-heading-md mb-1" style={{ color: 'var(--color-ink)' }}>
            Welcome back
          </h2>
          <p className="text-body-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Sign in to manage your trips and expenses.
          </p>

          <button onClick={handleGoogleLogin} className="btn-primary w-full gap-3">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#fff" opacity=".9"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#fff" opacity=".9"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fff" opacity=".9"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#fff" opacity=".9"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-caption text-center mt-5" style={{ color: 'var(--color-text-muted)' }}>
            By signing in you agree to our terms of service.
          </p>
        </div>

        {/* Feature hints */}
        <div className="mt-8 flex flex-col gap-3">
          {[
            ['💸', 'Split expenses equally, by exact amount, or percentage'],
            ['⚡', 'Live updates when your group adds or settles expenses'],
            ['📩', "Invite anyone by email — even if they're not on SplitWise yet"],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5">{icon}</span>
              <p className="text-body-sm" style={{ color: 'var(--color-text-muted)' }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
