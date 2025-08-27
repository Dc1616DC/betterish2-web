'use client';

import { Component } from 'react';

export class TaskErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[TaskErrorBoundary] Error caught:', error, errorInfo);
    console.error('[TaskErrorBoundary] Component stack:', errorInfo.componentStack);
    
    // In production, you could send this to an error reporting service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Something went wrong with loading your tasks
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>We&apos;re having trouble loading your tasks. This usually fixes itself in a moment.</p>
                <p className="mt-1 text-xs text-red-600">If this persists, please refresh the page or try logging out and back in.</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.reload();
                  }}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded text-sm transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TaskErrorBoundary;
