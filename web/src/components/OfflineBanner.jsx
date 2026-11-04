export default function OfflineBanner({ visible }) {
  if (!visible) return null

  return (
    <div
      className="rounded-xl px-3 py-2 mb-5 text-body-sm font-medium"
      style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
      role="status"
    >
      Offline — showing saved data
    </div>
  )
}
