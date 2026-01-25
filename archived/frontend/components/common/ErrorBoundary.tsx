/**
 * Error Boundary Component
 *
 * Catches React errors in child components and displays a fallback UI
 * instead of crashing the entire application.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('Error Boundary caught error:', error, errorInfo);

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // Store error info in state
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send to error tracking service (Sentry, etc.)
    // this.sendErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
              Oops! Something went wrong
            </h2>

            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm font-mono text-red-800 dark:text-red-300 break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-700 dark:text-red-400 cursor-pointer">
                      Stack trace
                    </summary>
                    <pre className="text-xs text-red-600 dark:text-red-400 mt-2 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col space-y-3">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw size={18} className="mr-2" />
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                Reload Application
              </button>

              <a
                href="https://github.com/your-org/investment-app/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-center text-blue-600 dark:text-blue-400 hover:underline"
              >
                Report this issue
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
