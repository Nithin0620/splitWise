import { useCallback, useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'

export function useConfirmDialog() {
  const [state, setState] = useState(null)
  const resolverRef = useRef(null)

  const confirm = useCallback((title, options = {}) => new Promise((resolve) => {
    resolverRef.current?.(false)
    resolverRef.current = resolve
    setState({
      title,
      message: options.message || '',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      destructive: Boolean(options.destructive),
    })
  }), [])

  const close = useCallback((result) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setState(null)
  }, [])

  const dialog = (
    <ConfirmDialog
      open={Boolean(state)}
      title={state?.title}
      message={state?.message}
      confirmText={state?.confirmText}
      cancelText={state?.cancelText}
      destructive={state?.destructive}
      onCancel={() => close(false)}
      onConfirm={() => close(true)}
    />
  )

  return { confirm, dialog }
}
