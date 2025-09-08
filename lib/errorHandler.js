/**
 * Global Error Handler
 * Centralized error logging and reporting system
 */

'use client';

// Error types for categorization
export const ErrorTypes = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication', 
  VALIDATION: 'validation',
  FIREBASE: 'firebase',
  API: 'api',
  RUNTIME: 'runtime',
  UNKNOWN: 'unknown'
};

// Error severity levels
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

class ErrorHandler {
  constructor() {
    this.listeners = [];
    this.errorQueue = [];
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    if (typeof window !== 'undefined') {
      // Listen for online/offline status
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushErrorQueue();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  /**
   * Log an error with context
   */
  logError(error, context = {}) {
    const errorData = this.normalizeError(error, context);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${errorData.type.toUpperCase()} Error`);
      console.error('Message:', errorData.message);
      console.error('Context:', errorData.context);
      console.error('Stack:', errorData.stack);
      console.error('Timestamp:', errorData.timestamp);
      console.groupEnd();
    }

    // Notify listeners (for UI error displays)
    this.notifyListeners(errorData);

    // Queue for remote logging if offline
    if (!this.isOnline) {
      this.errorQueue.push(errorData);
      return;
    }

    // Log to remote service (Firebase, Sentry, etc.)
    this.sendToRemoteLogging(errorData);

    return errorData;
  }

  /**
   * Normalize error into consistent format
   */
  normalizeError(error, context) {
    const timestamp = new Date().toISOString();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const url = typeof window !== 'undefined' ? window.location.href : '';

    let message = 'Unknown error';
    let stack = '';
    let type = ErrorTypes.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;

    // Handle different error types
    if (error instanceof Error) {
      message = error.message;
      stack = error.stack || '';
      
      // Categorize error types
      if (error.name === 'TypeError' || error.name === 'ReferenceError') {
        type = ErrorTypes.RUNTIME;
        severity = ErrorSeverity.HIGH;
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        type = ErrorTypes.NETWORK;
        severity = ErrorSeverity.MEDIUM;
      } else if (error.message.includes('auth') || error.message.includes('permission')) {
        type = ErrorTypes.AUTHENTICATION;
        severity = ErrorSeverity.HIGH;
      } else if (error.message.includes('Firebase') || error.code) {
        type = ErrorTypes.FIREBASE;
        severity = ErrorSeverity.MEDIUM;
      }
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      message = error.message || JSON.stringify(error);
      type = error.type || type;
      severity = error.severity || severity;
    }

    return {
      id: this.generateErrorId(),
      message,
      stack,
      type,
      severity,
      timestamp,
      context: {
        ...context,
        userAgent,
        url,
        userId: context.userId || 'anonymous'
      }
    };
  }

  /**
   * Send error to remote logging service
   */
  async sendToRemoteLogging(errorData) {
    try {
      // In production, send to Firebase Analytics or external service
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'exception', {
          description: errorData.message,
          fatal: errorData.severity === ErrorSeverity.CRITICAL
        });
      }

      // Could also send to custom endpoint
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // });

    } catch (loggingError) {
      console.warn('Failed to send error to remote logging:', loggingError);
    }
  }

  /**
   * Flush queued errors when back online
   */
  async flushErrorQueue() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    for (const error of errors) {
      try {
        await this.sendToRemoteLogging(error);
      } catch (e) {
        // Re-queue if failed
        this.errorQueue.push(error);
      }
    }
  }

  /**
   * Add error listener for UI notifications
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove error listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Notify all listeners of new error
   */
  notifyListeners(errorData) {
    this.listeners.forEach(callback => {
      try {
        callback(errorData);
      } catch (e) {
        console.warn('Error listener failed:', e);
      }
    });
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all listeners (cleanup)
   */
  clearListeners() {
    this.listeners = [];
  }
}

// Global instance
const errorHandler = new ErrorHandler();

// Convenience functions
export const logError = (error, context) => errorHandler.logError(error, context);
export const addErrorListener = (callback) => errorHandler.addListener(callback);
export const removeErrorListener = (callback) => errorHandler.removeListener(callback);

// Error boundary helper
export const withErrorHandling = (fn, context = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, { ...context, functionName: fn.name });
      throw error; // Re-throw to maintain normal error flow
    }
  };
};

// Network error helper
export const handleNetworkError = (error, context = {}) => {
  const networkError = {
    ...error,
    type: ErrorTypes.NETWORK,
    severity: ErrorSeverity.MEDIUM
  };
  return logError(networkError, context);
};

// Firebase error helper  
export const handleFirebaseError = (error, context = {}) => {
  const firebaseError = {
    ...error,
    type: ErrorTypes.FIREBASE,
    severity: error.code === 'permission-denied' ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM
  };
  return logError(firebaseError, context);
};

export default errorHandler;