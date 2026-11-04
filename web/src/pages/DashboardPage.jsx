import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import CreateTripModal from '../components/CreateTripModal'
import { formatDateRange } from '../lib/date'

const FILTERS = [
  { key: 'active', label: 'Active' },
  { key: 'archived', label: 'Archived' },
  { key: 'all', label: 'All' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState('active')

  const fetchTrips = async () => {
    try {
      const { data } = await api.get('/trips')
      setTrips(data.data)
    } catch {
      toast.error('Failed to load trips')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTrips() }, [])

  const handleTripCreated = (trip) => {
    setTrips((prev) => {
      const exists = prev.some((t) => t._id === trip._id)
      return exists ? prev.map((t) => (t._id === trip._id ? trip : t)) : [trip, ...prev]
    })
    setShowCreate(false)
  }

  const toggleArchive = async (trip) => {
    const next = !trip.isArchived
    try {
      const { data } = await api.put(`/trips/${trip._id}`, { isArchived: next })
      setTrips((prev) => prev.map((t) => (t._id === trip._id ? data.data : t)))
      toast.success(next ? `"${trip.name}" archived` : `"${trip.name}" unarchived`)
    } catch {
      toast.error('Failed to update trip')
    }
  }

  const visibleTrips = trips.filter((t) =>
    filter === 'all' ? true : filter === 'archived' ? t.isArchived : !t.isArchived
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-heading-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Good to see you,
          </p>
          <h1 className="text-heading-xl" style={{ color: 'var(--color-ink)' }}>
            {user?.name?.split(' ')[0]}
          </h1>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          + New trip
        </button>
      </div>

      {/* Filters */}
      {!loading && trips.length > 0 && (
        <div className="flex gap-1 mb-5 p-1 rounded-full w-fit"
             style={{ backgroundColor: 'var(--color-neutral)' }}>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-4 py-1.5 rounded-full text-body-sm font-medium transition-all"
              style={{
                backgroundColor: filter === f.key ? '#fff' : 'transparent',
                color: filter === f.key ? 'var(--color-ink)' : 'var(--color-text-muted)',
                boxShadow: filter === f.key ? 'var(--shadow-lg)' : 'none',
                border: 'none', cursor: 'pointer',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Trip grid */}
      {loading ? (
        <TripsSkeleton />
      ) : visibleTrips.length === 0 ? (
        <EmptyState
          onNew={() => setShowCreate(true)}
          archived={filter === 'archived'}
          hasAny={trips.length > 0}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleTrips.map((trip) => (
            <TripCard key={trip._id} trip={trip}
              onClick={() => navigate(`/trips/${trip._id}`)}
              onToggleArchive={() => toggleArchive(trip)} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTripModal onClose={() => setShowCreate(false)} onCreated={handleTripCreated} />
      )}
    </div>
  )
}

function TripCard({ trip, onClick, onToggleArchive }) {
  const memberCount = trip.members?.length ?? 0
  const initials = trip.name.slice(0, 2).toUpperCase()
  const dateRange = formatDateRange(trip.startDate, trip.endDate)

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      className="card p-6 text-left w-full cursor-pointer transition-all duration-150 hover:shadow-md relative"
      style={{ border: '1px solid rgba(3,3,2,0.09)', opacity: trip.isArchived ? 0.8 : 1 }}
    >
      {/* Archive toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleArchive() }}
        title={trip.isArchived ? 'Unarchive trip' : 'Archive trip'}
        aria-label={trip.isArchived ? 'Unarchive trip' : 'Archive trip'}
        className="absolute top-4 right-4 text-caption font-medium transition-opacity hover:opacity-70"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 0 }}
      >
        {trip.isArchived ? 'Unarchive' : 'Archive'}
      </button>

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-sm font-semibold"
        style={{ backgroundColor: 'var(--color-neutral)', color: 'var(--color-ink)' }}
      >
        {initials}
      </div>

      <h3 className="text-body-md-strong mb-1 truncate pr-24">{trip.name}</h3>

      {trip.description && (
        <p className="text-body-sm mb-1 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
          {trip.description}
        </p>
      )}

      {dateRange && (
        <p className="text-caption mb-2" style={{ color: 'var(--color-text-muted)' }}>📅 {dateRange}</p>
      )}

      <div className="flex items-center justify-between mt-3">
        {/* Members */}
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            {trip.members?.slice(0, 4).map((m) =>
              m.avatar ? (
                <img key={m._id} src={m.avatar} alt={m.name}
                     className="avatar avatar-sm ring-2 ring-white" />
              ) : (
                <div key={m._id}
                     className="avatar avatar-sm ring-2 ring-white"
                     style={{ backgroundColor: 'var(--color-neutral)', color: 'var(--color-text-muted)', fontSize: 10 }}>
                  {m.name?.charAt(0)}
                </div>
              )
            )}
          </div>
          <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
            {memberCount} {memberCount === 1 ? 'person' : 'people'}
          </span>
        </div>

        {/* Currency + archive badge */}
        <div className="flex items-center gap-2">
          <span className="badge badge-neutral">{trip.currency}</span>
          {trip.isArchived && <span className="badge badge-amber">Archived</span>}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onNew, archived, hasAny }) {
  return (
    <div className="text-center py-24">
      <div className="text-6xl mb-4">{archived ? '📦' : '🗺️'}</div>
      <h2 className="text-heading-md mb-2" style={{ color: 'var(--color-ink)' }}>
        {archived ? 'No archived trips' : hasAny ? 'Nothing here' : 'No trips yet'}
      </h2>
      <p className="text-body-md mb-6" style={{ color: 'var(--color-text-muted)' }}>
        {archived
          ? 'Archived trips will appear here once you tuck one away.'
          : 'Create your first trip and start splitting expenses with friends.'}
      </p>
      {!archived && (
        <button className="btn-primary" onClick={onNew}>
          Create your first trip
        </button>
      )}
    </div>
  )
}

function TripsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-6 animate-pulse">
          <div className="w-10 h-10 rounded-xl mb-4" style={{ backgroundColor: 'var(--color-neutral)' }} />
          <div className="h-4 rounded mb-2" style={{ backgroundColor: 'var(--color-neutral)', width: '60%' }} />
          <div className="h-3 rounded" style={{ backgroundColor: 'var(--color-neutral)', width: '80%' }} />
        </div>
      ))}
    </div>
  )
}
