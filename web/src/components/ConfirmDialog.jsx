import { useEffect } from 'react'

export default function ConfirmDialog({
  open, title, message, confirmText, cancelText, destructive, onCancel, onConfirm,
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      onClick={(event) => event.target === event.currentTarget && onCancel()}
    >
      <div
        className="modal"
        style={{ maxWidth: 420 }}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="p-6">
          <h2 className="text-heading-md">{title}</h2>
          {message && (
            <p className="text-body-md mt-2" style={{ color: 'var(--color-text-muted)' }}>
              {message}
            </p>
          )}
          <div className="flex gap-3 mt-6">
            <button className="btn-ghost flex-1" onClick={onCancel} autoFocus={destructive}>
              {cancelText}
            </button>
            <button
              className={`${destructive ? 'btn-danger' : 'btn-primary'} flex-1`}
              onClick={onConfirm}
              autoFocus={!destructive}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
