'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import { logError, ErrorTypes, ErrorSeverity } from '@/lib/errorHandler';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  name?: string;
  context?: Record<string, any>;
  onError?: (error: Error, errorInfo: ErrorInfo, errorData: any) => void;
  onRetry?: () => void;
  fallback?: (error: Error | null, retry: () => void) => ReactNode;
  showHomeLink?: boolean;
  fallbackMessage?: string;
}

interface WithErrorBoundaryOptions {
  name?: string;
  context?: Record<string, any>;
  onError?: (error: Error, errorInfo: ErrorInfo, errorData: any) => void;
  onRetry?: () => void;
  fallback?: (error: Error | null, retry: () => void) => ReactNode;
  showHomeLink?: boolean;
  fallbackMessage?: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error using our centralized error handler
    const errorData = logError(error, {
      type: ErrorTypes.RUNTIME,
      severity: ErrorSeverity.HIGH,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'ErrorBoundary',
      props: this.props.context || {}
    });

    this.setState({
      error,
      errorInfo,
      errorId: errorData.id
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorData);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });

    // Call optional retry callback
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-6">
              {this.props.fallbackMessage || "We're sorry, but something unexpected happened. Our team has been notified."}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-6 bg-gray-50 rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Error Details (Development)
                </summary>
                <div className="text-sm text-gray-600 space-y-2">
                  <div>
                    <strong>Message:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>Error ID:</strong> {this.state.errorId}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                type="button"
              >
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                type="button"
              >
                Reload Page
              </button>
              
              {this.props.showHomeLink !== false && (
                <a
                  href="/"
                  className="block w-full bg-gray-50 text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-center"
                >
                  Go Home
                </a>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>, 
  options: WithErrorBoundaryOptions = {}
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary
      name={options.name || Component.displayName || Component.name}
      context={options.context}
      onError={options.onError}
      onRetry={options.onRetry}
      fallback={options.fallback}
      showHomeLink={options.showHomeLink}
      fallbackMessage={options.fallbackMessage}
    >
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary;