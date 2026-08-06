import React from 'react'
import PropTypes from 'prop-types'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 text-center">
          <div className="max-w-md animate-fade-in">
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-red-50 rounded-full">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
            </div>
            
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">
              Oops! Something went wrong
            </h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              We encountered an unexpected error. Don't worry, your data is safe. 
              You can try refreshing the page or going back home.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button 
                onClick={this.handleReset}
                variant="primary"
                leftIcon={<RefreshCcw className="w-4 h-4" />}
              >
                Refresh Page
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="secondary"
                leftIcon={<Home className="w-4 h-4" />}
              >
                Go to Home
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-10 text-left">
                <p className="text-xs font-mono text-red-600 bg-red-50 p-4 rounded-xl overflow-auto max-h-40 border border-red-100">
                  {this.state.error?.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
}
