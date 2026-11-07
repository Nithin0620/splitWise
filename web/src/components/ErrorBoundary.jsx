import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center px-5"
           style={{ backgroundColor: 'var(--color-canvas)' }}>
        <div className="max-w-md w-full text-center">
          <p className="text-5xl mb-4">😵</p>
          <h1 className="text-heading-lg mb-2">Something went wrong</h1>
          <p className="text-body-md mb-6" style={{ color: 'var(--color-text-muted)' }}>
            The app hit an unexpected error. Your data is safe — reload to try again.
          </p>
          {this.state.error?.message && (
            <pre className="text-caption text-left mb-6 p-3 rounded-xl overflow-auto"
                 style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)', maxHeight: 140 }}>
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3 justify-center">
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Reload
            </button>
            <a className="btn-ghost" href="/dashboard">Back to trips</a>
          </div>
        </div>
      </div>
    )
  }
}
