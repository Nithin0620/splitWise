import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const APK_URL = 'https://drive.google.com/file/d/1c3-SGFTng_RTavHmQgb6aqiBDNAo1BV9/view?usp=sharing'
const YEAR = new Date().getFullYear()

const FEATURES = [
  {
    icon: 'split',
    tint: '#FFF0E8',
    color: '#C2410C',
    title: 'Split any way',
    body: 'Equal, exact amounts, percentages, or line items. Every split stays fair and fully editable.',
  },
  {
    icon: 'bolt',
    tint: '#FFF7DB',
    color: '#A16207',
    title: 'Live balances',
    body: 'Add an expense and everyone sees the updated balance instantly on web and mobile.',
  },
  {
    icon: 'mail',
    tint: '#EAF2FF',
    color: '#1D4ED8',
    title: 'Invite by email',
    body: 'Bring friends in even if they have never used SplitWise. One link and they are in the trip.',
  },
  {
    icon: 'globe',
    tint: '#EAF7F0',
    color: '#047857',
    title: 'Multi-currency',
    body: 'Log expenses in the currency you paid. Balances settle in the trip currency automatically.',
  },
  {
    icon: 'repeat',
    tint: '#F3EDFF',
    color: '#6D28D9',
    title: 'Recurring expenses',
    body: 'Rent, subscriptions, and daily stays can repeat on their own schedule without manual entry.',
  },
  {
    icon: 'cloudOff',
    tint: '#F1F1EF',
    color: '#4B5563',
    title: 'Offline ready',
    body: 'Cached trips and an offline banner keep the app usable when the signal drops.',
  },
]

const ROADMAP = [
  {
    icon: 'users',
    tint: '#EAF2FF',
    color: '#1D4ED8',
    title: 'Multi-user trip sharing',
    body: 'Plan together in real time with shared edit access, roles, and live presence.',
  },
  {
    icon: 'template',
    tint: '#F3EDFF',
    color: '#6D28D9',
    title: 'Trip template sharing',
    body: 'Publish a trip as a template, then let friends clone and remix it in one click.',
  },
  {
    icon: 'share',
    tint: '#EAF7F0',
    color: '#047857',
    title: 'Profile sharing',
    body: 'Share your travel style, preferences, and past trips with the people you plan with.',
  },
  {
    icon: 'wallet',
    tint: '#FFF0E8',
    color: '#C2410C',
    title: 'Smart settle-up',
    body: 'Fewer transfers, better payment suggestions, and a clear record of who paid whom.',
  },
  {
    icon: 'message',
    tint: '#FFF7DB',
    color: '#A16207',
    title: 'Group polls and chat',
    body: 'Pick the stay, the cab, and the plan without leaving the trip workspace.',
  },
  {
    icon: 'receipt',
    tint: '#FDF2F8',
    color: '#BE185D',
    title: 'Receipt scanning',
    body: 'Snap a bill and let SplitWise read the line items, tax, and tip for the group.',
  },
  {
    icon: 'link',
    tint: '#ECFEFF',
    color: '#0E7490',
    title: 'Public trip pages',
    body: 'A clean shareable page for the itinerary, budget, and who is coming along.',
  },
  {
    icon: 'sparkles',
    tint: '#FFF1E6',
    color: '#C2410C',
    title: 'And more in the library',
    body: 'Curated places, packing lists, and group memory albums are on the same roadmap.',
  },
]

const ICONS = {
  split: (
    <>
      <path d="M8 3H3v5" />
      <path d="M16 3h5v5" />
      <path d="m21 3-7 7" />
      <path d="m3 21 7-7" />
      <path d="M16 21h5v-5" />
      <path d="M8 21H3v-5" />
    </>
  ),
  bolt: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />,
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </>
  ),
  repeat: (
    <>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </>
  ),
  cloudOff: (
    <>
      <path d="m2 2 20 20" />
      <path d="M5.8 5.8A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.3-.2" />
      <path d="M17.5 19H19a4 4 0 0 0 0-8 6 6 0 0 0-9.6-4.6" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3Z" />
      <path d="M5 3v4" />
      <path d="M3 5h4" />
      <path d="M19 17v4" />
      <path d="M17 19h4" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  template: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </>
  ),
  share: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  wallet: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M16 15h.01" />
    </>
  ),
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />,
  receipt: (
    <>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
  check: <path d="m20 6-11 11-5-5" />,
  android: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  github: (
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7.4a5.8 5.8 0 0 0-1.6-4 5.4 5.4 0 0 0-.1-4s-1.3-.4-4.2 1.6a14.5 14.5 0 0 0-7.6 0C4.4 2.7 3.1 3.1 3.1 3.1a5.4 5.4 0 0 0-.1 4 5.8 5.8 0 0 0-1.6 4c0 5.8 3.5 7 6.8 7.4A4.8 4.8 0 0 0 7 22" />
  ),
}

function Icon({ name, size = 20, strokeWidth = 1.7 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}

function BrandMark({ size = 34 }) {
  return (
    <span
      className="grid place-items-center"
      style={{ width: size, height: size, borderRadius: 999, background: 'var(--color-ink)', color: '#fff' }}
    >
      <Icon name="split" size={size * 0.53} strokeWidth={2} />
    </span>
  )
}

function HeroVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[420px]">
      <div className="relative" style={{ transform: 'rotate(-3deg)' }}>
        <div className="landing-float">
          <div
            style={{
              borderRadius: 42,
              background: '#fff',
              border: '1px solid rgba(3,3,2,0.10)',
              boxShadow: 'var(--shadow-sm)',
              padding: 16,
            }}
          >
            <div className="flex items-center justify-between px-2 pt-1 pb-3">
              <span className="font-serif" style={{ fontSize: 21, color: 'var(--color-ink)' }}>
                Rishikesh 2026
              </span>
              <span className="badge badge-green">
                <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} />
                Live
              </span>
            </div>

            <div
              style={{
                borderRadius: 26,
                overflow: 'hidden',
                background: 'linear-gradient(160deg,#FFD9C2 0%,#FFB38A 46%,#FF7A3D 100%)',
              }}
            >
              <svg viewBox="0 0 320 150" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 132 }}>
                <circle cx="248" cy="38" r="21" fill="#FFF7EF" opacity="0.9" />
                <path d="M0 120 L60 60 L110 105 L160 45 L220 110 L270 75 L320 120 Z" fill="#E85D20" opacity="0.5" />
                <path d="M0 132 L70 86 L130 126 L200 70 L260 120 L320 95 L320 150 L0 150 Z" fill="#8C2F0D" opacity="0.9" />
                <path d="M0 150 L90 132 L160 142 L240 128 L320 140 L320 150 Z" fill="#FFF1E6" opacity="0.28" />
              </svg>
            </div>

            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {['A', 'M', 'R', 'K'].map((initial, i) => (
                    <span
                      key={initial}
                      className="avatar avatar-sm"
                      style={{
                        marginLeft: i === 0 ? 0 : -8,
                        background: ['#FFE0D3', '#E7F0FF', '#EAF7F0', '#F3EDFF'][i],
                        color: ['#B23A0B', '#1D4ED8', '#047857', '#6D28D9'][i],
                        border: '2px solid #fff',
                        zIndex: 4 - i,
                      }}
                    >
                      {initial}
                    </span>
                  ))}
                </div>
                <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
                  4 travellers
                </span>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-body-sm" style={{ color: 'var(--color-text-muted)' }}>
                    You are owed
                  </span>
                  <span className="text-body-md-strong" style={{ color: '#047857' }}>
                    INR 1,149
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-body-sm" style={{ color: 'var(--color-text-muted)' }}>
                    You owe
                  </span>
                  <span className="text-body-md-strong" style={{ color: '#B91C1C' }}>
                    INR 287
                  </span>
                </div>
                <div
                  className="flex items-center justify-between py-2.5"
                  style={{ borderTop: '1px solid var(--color-border)', marginTop: 4 }}
                >
                  <span className="text-body-md-strong">Net balance</span>
                  <span className="font-serif" style={{ fontSize: 24, color: 'var(--color-ink)' }}>
                    INR 862
                  </span>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <span className="btn-primary flex-1" style={{ height: 44, padding: '0 12px', fontSize: 14 }}>
                  Settle up
                </span>
                <span className="btn-ghost grid place-items-center" style={{ width: 46, height: 44, padding: 0 }}>
                  <Icon name="split" size={17} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="landing-float-alt card absolute hidden items-center gap-2.5 p-3 md:flex"
        style={{ left: -34, top: 118, borderRadius: 16 }}
      >
        <span className="avatar avatar-md" style={{ background: '#FFE0D3', color: '#B23A0B' }}>
          A
        </span>
        <div>
          <div className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
            Aarav added
          </div>
          <div className="text-body-sm" style={{ fontWeight: 500 }}>
            Dinner · INR 1,850
          </div>
        </div>
      </div>

      <div
        className="landing-float card absolute flex items-center gap-2 px-3.5 py-3"
        style={{ right: -12, bottom: 54, borderRadius: 16 }}
      >
        <span
          className="grid place-items-center"
          style={{ width: 30, height: 30, borderRadius: 999, background: '#E7F6EC', color: '#0B7A3B' }}
        >
          <Icon name="cloudOff" size={15} />
        </span>
        <div>
          <div className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
            Offline
          </div>
          <div className="text-body-sm" style={{ fontWeight: 500 }}>
            Synced when back
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { user } = useAuth()
  const appHref = user ? '/dashboard' : '/login'
  const appLabel = user ? 'Open the app' : 'Try it on the web'

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-canvas)' }}>
      <header
        className="sticky top-0 z-40 w-full"
        style={{
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'rgba(252,249,247,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
            <BrandMark />
            <span className="font-serif" style={{ fontSize: 25, lineHeight: 1, color: 'var(--color-ink)' }}>
              SplitWise
            </span>
          </Link>

          <nav
            className="hidden items-center gap-7 text-body-sm md:flex"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <a href="#features" className="transition-opacity hover:opacity-60">
              Features
            </a>
            <a href="#library" className="transition-opacity hover:opacity-60">
              Coming soon
            </a>
            <a href="#install" className="transition-opacity hover:opacity-60">
              Get the app
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={APK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost hidden items-center gap-2 sm:inline-flex"
              style={{ height: 40, fontSize: 13, padding: '0 14px' }}
            >
              <Icon name="download" size={15} />
              Install
            </a>
            <Link
              to={appHref}
              className="btn-primary"
              style={{ height: 40, padding: '0 18px', fontSize: 14, minWidth: 0 }}
            >
              {appLabel}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div
              className="absolute -left-32 -top-40 h-96 w-96 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(255,69,0,0.20), transparent 70%)' }}
            />
            <div
              className="absolute -right-24 top-4 h-[30rem] w-[30rem] rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(255,184,0,0.18), transparent 70%)' }}
            />
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20 lg:grid-cols-[1.04fr_0.96fr]">
            <div>
              <span className="badge badge-neutral mb-5">
                <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--color-accent)' }} />
                Now available on Android
              </span>
              <h1
                className="font-serif"
                style={{
                  fontSize: 'clamp(42px, 6.4vw, 70px)',
                  lineHeight: 0.99,
                  letterSpacing: '-0.035em',
                  color: 'var(--color-ink)',
                  margin: 0,
                }}
              >
                Split the bill,
                <br />
                <span style={{ color: 'var(--color-accent)' }}>not the friendship.</span>
              </h1>
              <p className="mt-6 max-w-xl text-body-lg" style={{ color: 'var(--color-text-muted)' }}>
                Plan trips, track shared spending, and settle up in a tap. SplitWise keeps every balance
                clear, every invite simple, and every group on the same page.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={APK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  <Icon name="android" size={18} />
                  Install Android app
                </a>
                <Link to={appHref} className="btn-ghost" style={{ textDecoration: 'none' }}>
                  {appLabel}
                  <Icon name="arrow" size={16} />
                </Link>
              </div>

              <div
                className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-caption"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="check" size={14} />
                  Free to use
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="check" size={14} />
                  No Play Store needed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="check" size={14} />
                  Web and Android
                </span>
              </div>
            </div>

            <HeroVisual />
          </div>
        </section>

        <section
          id="features"
          className="scroll-mt-24"
          style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
        >
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl">
              <span className="badge badge-ink mb-4">Everything in one place</span>
              <h2
                className="font-serif"
                style={{ fontSize: 'clamp(32px, 4vw, 46px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
              >
                Less math. More trip.
              </h2>
              <p className="mt-3 text-body-lg" style={{ color: 'var(--color-text-muted)' }}>
                Built for real groups: the friend who pays first, the one who forgets, and everyone in
                between.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <article key={feature.title} className="card p-6" style={{ borderRadius: 20 }}>
                  <span
                    className="mb-4 grid place-items-center"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: feature.tint,
                      color: feature.color,
                    }}
                  >
                    <Icon name={feature.icon} size={21} />
                  </span>
                  <h3 className="text-body-md-strong" style={{ color: 'var(--color-ink)' }}>
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-body-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {feature.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="install" className="scroll-mt-24">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div
              className="relative overflow-hidden p-8 sm:p-12"
              style={{
                borderRadius: 28,
                background: 'linear-gradient(135deg,#111110 0%,#1D1B19 55%,#3A1A0B 100%)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                aria-hidden="true"
                className="absolute -right-20 -top-24 h-80 w-80 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(255,69,0,0.55), transparent 70%)' }}
              />
              <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
                <div className="max-w-xl">
                  <span
                    className="badge"
                    style={{ background: 'rgba(255,255,255,0.12)', color: '#FFD9C7' }}
                  >
                    Android APK
                  </span>
                  <h2
                    className="mt-4 font-serif"
                    style={{
                      fontSize: 'clamp(30px, 4vw, 44px)',
                      lineHeight: 1.05,
                      letterSpacing: '-0.02em',
                      color: '#fff',
                    }}
                  >
                    Take SplitWise with you.
                  </h2>
                  <p className="mt-3 text-body-md" style={{ color: 'rgba(255,255,255,0.70)' }}>
                    Install the app directly. It uses the same account as the web app, so your trips are
                    already there when you open it.
                  </p>
                  <ul
                    className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-caption"
                    style={{ color: 'rgba(255,255,255,0.60)' }}
                  >
                    <li className="inline-flex items-center gap-1.5">
                      <Icon name="check" size={14} />
                      Android 7+
                    </li>
                    <li className="inline-flex items-center gap-1.5">
                      <Icon name="check" size={14} />
                      89 MB
                    </li>
                    <li className="inline-flex items-center gap-1.5">
                      <Icon name="check" size={14} />
                      Same Google login
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col items-start gap-3">
                  <a
                    href={APK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 font-medium"
                    style={{
                      height: 56,
                      padding: '0 30px',
                      background: '#fff',
                      color: 'var(--color-ink)',
                      borderRadius: 999,
                      textDecoration: 'none',
                      fontFamily: 'var(--font-sans)',
                      boxShadow: 'var(--shadow-lg)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Icon name="download" size={19} />
                    Install the app
                  </a>
                  <p className="text-caption" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Allow installs from your browser when prompted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="library"
          className="scroll-mt-24"
          style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
        >
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <span className="badge badge-neutral mb-4">
                  <Icon name="sparkles" size={13} />
                  Coming to the library
                </span>
                <h2
                  className="font-serif"
                  style={{ fontSize: 'clamp(32px, 4vw, 46px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
                >
                  The next chapter is agentic.
                </h2>
                <p className="mt-3 text-body-lg" style={{ color: 'var(--color-text-muted)' }}>
                  We are turning SplitWise into a shared trip library: a place where plans, templates, and
                  profiles get smarter together. Here is what is landing next.
                </p>
              </div>
              <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
                Roadmap · 2026
              </span>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <article
                className="card flex flex-col justify-between p-6 md:col-span-2"
                style={{
                  borderRadius: 20,
                  background: 'linear-gradient(135deg,#FFF3EC 0%,#FFE3D4 100%)',
                }}
              >
                <div>
                  <span className="badge badge-ink mb-4">Flagship</span>
                  <h3 className="font-serif" style={{ fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
                    Agentic trip planner
                  </h3>
                  <p className="mt-2 max-w-lg text-body-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Describe the trip in one sentence. The planner drafts the itinerary, estimates the
                    budget, sets up the splits, and keeps the whole group in sync from day one.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {['Itinerary', 'Budget', 'Auto-splits', 'Group-ready'].map((tag) => (
                    <span key={tag} className="badge badge-neutral">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>

              {ROADMAP.map((item) => (
                <article key={item.title} className="card p-5" style={{ borderRadius: 20 }}>
                  <span
                    className="mb-3.5 grid place-items-center"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 13,
                      background: item.tint,
                      color: item.color,
                    }}
                  >
                    <Icon name={item.icon} size={19} />
                  </span>
                  <h3 className="text-body-md-strong">{item.title}</h3>
                  <p className="mt-1.5 text-body-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {item.body}
                  </p>
                  <span className="badge badge-neutral mt-4">Soon</span>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <Link to="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
              <BrandMark size={30} />
              <span className="font-serif" style={{ fontSize: 22, color: 'var(--color-ink)' }}>
                SplitWise
              </span>
            </Link>
            <p className="mt-2 text-body-sm" style={{ color: 'var(--color-text-muted)' }}>
              Shared expenses, settled simply.
            </p>
          </div>

          <div
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-body-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <a href="#features" className="transition-opacity hover:opacity-60">
              Features
            </a>
            <a href="#library" className="transition-opacity hover:opacity-60">
              Coming soon
            </a>
            <a
              href={APK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-60"
            >
              Android APK
            </a>
            <Link to={appHref} className="transition-opacity hover:opacity-60" style={{ color: 'inherit' }}>
              {appLabel}
            </Link>
            <a
              href="https://github.com/Nithin0620/splitWise"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-60"
            >
              <Icon name="github" size={15} />
              GitHub
            </a>
          </div>
        </div>
        <div
          className="mx-auto max-w-6xl px-4 pb-8 text-caption sm:px-6"
          style={{ color: 'var(--color-text-muted)' }}
        >
          © {YEAR} SplitWise. Built for trips with friends.
        </div>
      </footer>
    </div>
  )
}
