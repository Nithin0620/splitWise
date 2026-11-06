import { formatDate } from '../lib/date'

const CATEGORY_EMOJI = {
  food: '🍽️', transport: '🚗', accommodation: '🏨',
  entertainment: '🎭', shopping: '🛍️', other: '📦',
}

const SPLIT_LABELS = {
  equal: 'Equally', exact: 'Exact amounts', percentage: 'By percentage',
  shares: 'By shares', itemized: 'Itemized',
}

export default function ExpenseDetailModal({ expense, currency, userId, members, onClose, onEdit, onDelete }) {
  if (!expense) return null

  const canManage = expense.createdBy?._id === userId || expense.paidBy?._id === userId
  const memberMap = {}
  for (const m of members || []) memberMap[m._id] = m.name

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="p-4 sm:p-6 flex flex-col gap-4" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{CATEGORY_EMOJI[expense.category] || '📦'}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-heading-md">{expense.title}</h2>
              <p className="text-caption mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {formatDate(expense.date)}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close details"
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-surface)', border: 'none', cursor: 'pointer' }}>
              ✕
            </button>
          </div>

          <div>
            <p className="text-display-sm break-words" style={{ fontSize: 'clamp(28px, 9vw, 46px)' }}>
              {currency} {expense.amount.toFixed(2)}
            </p>
            {expense.currency && expense.currency !== currency && (
              <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
                {expense.currency} {Number(expense.originalAmount ?? expense.amount).toFixed(2)}
                {expense.exchangeRate ? ` · rate ${expense.exchangeRate}` : ''}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Row label="Paid by" value={expense.paidBy?.name ?? '—'} />
            <Row label="Split" value={SPLIT_LABELS[expense.splitType] || 'Equally'} />
            {expense.recurrence?.frequency && expense.recurrence.frequency !== 'none' && (
              <Row label="Repeats"
                   value={`${expense.recurrence.frequency}${expense.recurrence.interval > 1 ? ` · every ${expense.recurrence.interval}` : ''}`} />
            )}
            {expense.notes && <Row label="Notes" value={expense.notes} />}
          </div>

          {expense.items?.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-caption font-medium" style={{ color: 'var(--color-text-muted)' }}>Items</p>
              {expense.items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="text-body-sm flex-1">
                    {item.name}
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      {' '}· {(item.users || []).map((u) => memberMap[String(u?._id ?? u)]?.split(' ')[0]).filter(Boolean).join(', ')}
                    </span>
                  </span>
                  <span className="text-body-sm">
                    {expense.currency || currency} {Number(item.amount).toFixed(2)}
                  </span>
                </div>
              ))}
              {Number(expense.tax) > 0 && <Row label="Tax" value={`${expense.currency || currency} ${Number(expense.tax).toFixed(2)}`} />}
              {Number(expense.tip) > 0 && <Row label="Tip" value={`${expense.currency || currency} ${Number(expense.tip).toFixed(2)}`} />}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <p className="text-caption font-medium" style={{ color: 'var(--color-text-muted)' }}>Split between</p>
            {(expense.splits || []).map((split, idx) => (
              <div key={split.user?._id ?? idx} className="flex items-center justify-between gap-3">
                <span className="text-body-sm">{split.user?.name ?? 'Member'}</span>
                <span className="text-body-sm">{currency} {split.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {canManage && (
            <div className="flex gap-3 pt-1">
              <button className="btn-ghost flex-1" onClick={() => onDelete(expense)}>Delete</button>
              <button className="btn-primary flex-1" onClick={() => onEdit(expense)}>Edit expense</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-body-sm w-16 sm:w-20 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="text-body-sm flex-1">{value}</span>
    </div>
  )
}
