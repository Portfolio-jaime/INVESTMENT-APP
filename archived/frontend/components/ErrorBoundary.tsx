import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Log to external error tracking service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Oops! Something went wrong
                </h1>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  {this.props.fallbackMessage || 'An unexpected error occurred in the application'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Error Details
              </h3>
              <div className="text-sm text-slate-700 dark:text-slate-300 font-mono break-all">
                {this.state.error?.message || 'Unknown error'}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                What you can do:
              </h3>
              <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-2">
                <li>Try refreshing the page or component</li>
                <li>Check your internet connection</li>
                <li>Clear your browser cache and reload</li>
                <li>If the problem persists, contact support</li>
              </ul>
            </div>

            <div className="flex items-center space-x-4 mt-8">
              <button
                onClick={this.handleReset}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center space-x-2 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6 bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <summary className="text-sm font-semibold text-slate-900 dark:text-white cursor-pointer">
                  Stack Trace (Development Only)
                </summary>
                <pre className="mt-2 text-xs text-slate-700 dark:text-slate-300 overflow-auto max-h-96">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
