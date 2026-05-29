'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('[ErrorBoundary] Caught error:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error details:', error)
    console.error('[ErrorBoundary] Component stack:', info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-screen flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="text-destructive font-mono text-sm">Something went wrong</div>
            <pre className="text-[10px] text-muted-foreground max-w-md overflow-auto bg-muted p-4 rounded">
              {this.state.error?.message}
            </pre>
            <button
              className="px-4 py-2 text-xs bg-primary text-primary-foreground rounded hover:opacity-90"
              onClick={() => window.location.reload()}
            >
              Reload App
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
