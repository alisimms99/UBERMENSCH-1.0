import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // Report error to monitoring service (if available)
    if (window.reportError) {
      window.reportError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId } = this.state
      const { fallback: CustomFallback, showDetails = false } = this.props

      // Use custom fallback if provided
      if (CustomFallback) {
        return (
          <CustomFallback 
            error={error}
            errorInfo={errorInfo}
            onRetry={this.handleRetry}
            onGoHome={this.handleGoHome}
            onReload={this.handleReload}
          />
        )
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Card className="border-red-200">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-red-600">Something went wrong</CardTitle>
                <CardDescription>
                  An unexpected error occurred in the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <Bug className="h-4 w-4" />
                  <AlertDescription>
                    Error ID: {errorId}
                    {error && (
                      <div className="mt-2 text-xs font-mono">
                        {error.message}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>

                {showDetails && error && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Technical Details
                    </summary>
                    <div className="mt-2 p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap">
                      {error.stack}
                      {errorInfo && errorInfo.componentStack}
                    </div>
                  </details>
                )}

                <div className="space-y-2">
                  <Button 
                    onClick={this.handleRetry}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={this.handleGoHome}
                      variant="outline"
                      size="sm"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Home
                    </Button>
                    
                    <Button 
                      onClick={this.handleReload}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reload
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground text-center">
                  If this problem persists, please contact support with the Error ID above.
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Specialized error boundaries for different parts of the app
export const WorkoutErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={({ onRetry, onGoHome }) => (
      <div className="p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold">Workout Error</h3>
          <p className="text-muted-foreground">
            There was an error with your workout session. Your progress has been saved.
          </p>
          <div className="space-y-2">
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Workout
            </Button>
            <Button onClick={onGoHome} variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
)

export const ProfileErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={({ onRetry, onGoHome }) => (
      <div className="p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold">Profile Error</h3>
          <p className="text-muted-foreground">
            There was an error loading your profile. Your data is safe.
          </p>
          <div className="space-y-2">
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Profile
            </Button>
            <Button onClick={onGoHome} variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
)

export const DataErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={({ onRetry, onGoHome }) => (
      <div className="p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold">Data Error</h3>
          <p className="text-muted-foreground">
            There was an error with data operations. No data has been lost.
          </p>
          <div className="space-y-2">
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={onGoHome} variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
)

export default ErrorBoundary

