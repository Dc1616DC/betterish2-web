'use client';

import { useState, useCallback } from 'react';
import { 
  logError, 
  ErrorTypes, 
  ErrorSeverity, 
  handleNetworkError, 
  handleFirebaseError, 
  ErrorContext, 
  ErrorData 
} from '@/lib/errorHandler';

interface AsyncOptions {
  loadingMessage?: string;
  successMessage?: string | null;
  showToast?: boolean;
  errorType?: 'network' | 'firebase' | null;
  operation?: string;
}

interface UseErrorHandlerReturn {
  error: string | null;
  isLoading: boolean;
  handleAsync: <T>(asyncFn: () => Promise<T>, options?: AsyncOptions) => Promise<T>;
  clearError: () => void;
  logError: (error: Error | string | object, additionalContext?: ErrorContext) => ErrorData;
  logNetworkError: (error: Error | string, additionalContext?: ErrorContext) => ErrorData;
  logFirebaseError: (error: any, additionalContext?: ErrorContext) => ErrorData;
  safeAsync: <T>(
    asyncFn: (...args: any[]) => Promise<T>, 
    fallback?: T | null, 
    errorContext?: ErrorContext
  ) => (...args: any[]) => Promise<T | null>;
}

export function useErrorHandler(context: ErrorContext = {}): UseErrorHandlerReturn {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced async handler with centralized error logging
  const handleAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>, 
    options: AsyncOptions = {}
  ): Promise<T> => {
    const { 
      loadingMessage = 'Processing...',
      successMessage = null,
      showToast = false,
      errorType = null,
      operation = 'async operation'
    } = options;

    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      
      if (successMessage && showToast) {
        // Show success toast if needed
      }
      
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      
      // Log error to centralized system
      const errorContext: ErrorContext = {
        ...context,
        operation,
        component: context.component || 'useErrorHandler'
      };

      if (errorType === 'network') {
        handleNetworkError(err as Error, errorContext);
      } else if (errorType === 'firebase') {
        handleFirebaseError(err as any, errorContext);
      } else {
        logError(err as Error, errorContext);
      }
      
      if (showToast) {
        // Show error toast if needed
      }
      
      throw err; // Re-throw so caller can handle if needed
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  // Direct error logging methods
  const logComponentError = useCallback((
    error: Error | string | object, 
    additionalContext: ErrorContext = {}
  ): ErrorData => {
    return logError(error, {
      ...context,
      ...additionalContext,
      component: context.component || 'Unknown'
    });
  }, [context]);

  const logNetworkError = useCallback((
    error: Error | string, 
    additionalContext: ErrorContext = {}
  ): ErrorData => {
    return handleNetworkError(error, {
      ...context,
      ...additionalContext,
      component: context.component || 'Unknown'
    });
  }, [context]);

  const logFirebaseError = useCallback((
    error: any, 
    additionalContext: ErrorContext = {}
  ): ErrorData => {
    return handleFirebaseError(error, {
      ...context,
      ...additionalContext,
      component: context.component || 'Unknown'
    });
  }, [context]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Safe async wrapper that won't throw
  const safeAsync = useCallback(<T>(
    asyncFn: (...args: any[]) => Promise<T>, 
    fallback: T | null = null, 
    errorContext: ErrorContext = {}
  ) => {
    return async (...args: any[]): Promise<T | null> => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        logComponentError(error as Error, {
          ...errorContext,
          operation: asyncFn.name || 'safe async operation'
        });
        return fallback;
      }
    };
  }, [logComponentError]);

  return {
    error,
    isLoading,
    handleAsync,
    clearError,
    logError: logComponentError,
    logNetworkError,
    logFirebaseError,
    safeAsync
  };
}

interface FirebaseError extends Error {
  code?: string;
}

interface NetworkError extends Error {
  name: 'NetworkError';
}

function getErrorMessage(error: unknown): string {
  // Firebase Auth errors
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as FirebaseError;
    switch (firebaseError.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'permission-denied':
        return 'You don\'t have permission to perform this action.';
      case 'unavailable':
        return 'Service temporarily unavailable. Please try again.';
      default:
        return firebaseError.message || 'An unexpected error occurred.';
    }
  }

  // Network errors
  if (error instanceof Error) {
    if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    return error.message || 'An unexpected error occurred.';
  }

  // Generic error
  return 'An unexpected error occurred.';
}