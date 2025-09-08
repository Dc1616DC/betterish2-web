'use client';

import { useEffect } from 'react';
import { logError, ErrorTypes, ErrorSeverity } from '@/lib/errorHandler';

/**
 * Global Error Handler Component
 * Catches unhandled errors and promise rejections at the window level
 */
export default function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled JavaScript errors
    const handleError = (event) => {
      const error = event.error || new Error(event.message || 'Unknown error');
      
      logError(error, {
        type: ErrorTypes.RUNTIME,
        severity: ErrorSeverity.HIGH,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        source: 'window.onerror'
      });
    };

    // Handle unhandled Promise rejections
    const handleUnhandledRejection = (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(typeof event.reason === 'string' ? event.reason : 'Unhandled promise rejection');
      
      logError(error, {
        type: ErrorTypes.RUNTIME,
        severity: ErrorSeverity.HIGH,
        source: 'unhandledrejection',
        promise: event.promise
      });

      // Prevent the default behavior (logging to console)
      if (process.env.NODE_ENV === 'production') {
        event.preventDefault();
      }
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // This component renders nothing
  return null;
}