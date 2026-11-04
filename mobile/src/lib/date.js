export function formatDate(value, options) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(
    'en-IN',
    options || { day: 'numeric', month: 'short', year: 'numeric' }
  )
}

export function formatDateRange(start, end) {
  if (!start && !end) return ''
  if (start && !end) return `From ${formatDate(start)}`
  if (!start && end) return `Until ${formatDate(end)}`
  const sameYear = new Date(start).getFullYear() === new Date(end).getFullYear()
  return `${formatDate(start, { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })} – ${formatDate(end)}`
}

export function timeAgo(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(date, { day: 'numeric', month: 'short' })
}

export function toISODate(value) {
  if (!value) return new Date().toISOString()
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}
