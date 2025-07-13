"use client"

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} />
      }

      return (
        <div className="min-h-screen bg-retro-dark flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="font-pixel text-neon-pink text-xl mb-4">SYSTEM ERROR</h2>
            <p className="font-pixel text-electric-teal text-sm mb-6">
              Something went wrong in the game engine
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="font-pixel text-white bg-neon-pink px-4 py-2 hover:bg-electric-teal transition-colors"
            >
              RESTART GAME
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
} 