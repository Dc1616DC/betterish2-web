'use client';

import { useState, useCallback } from 'react';
import { logError, ErrorTypes, ErrorSeverity, handleNetworkError, handleFirebaseError } from '@/lib/errorHandler';

export function useErrorHandler(context = {}) {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced async handler with centralized error logging
  const handleAsync = useCallback(async (asyncFn, options = {}) => {
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
      const errorContext = {
        ...context,
        operation,
        component: context.component || 'useErrorHandler'
      };

      if (errorType === 'network') {
        handleNetworkError(err, errorContext);
      } else if (errorType === 'firebase') {
        handleFirebaseError(err, errorContext);
      } else {
        logError(err, errorContext);
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
  const logComponentError = useCallback((error, additionalContext = {}) => {
    return logError(error, {
      ...context,
      ...additionalContext,
      component: context.component || 'Unknown'
    });
  }, [context]);

  const logNetworkError = useCallback((error, additionalContext = {}) => {
    return handleNetworkError(error, {
      ...context,
      ...additionalContext,
      component: context.component || 'Unknown'
    });
  }, [context]);

  const logFirebaseError = useCallback((error, additionalContext = {}) => {
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
  const safeAsync = useCallback((asyncFn, fallback = null, errorContext = {}) => {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        logComponentError(error, {
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

function getErrorMessage(error) {
  // Firebase Auth errors
  if (error?.code) {
    switch (error.code) {
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
        return error.message || 'An unexpected error occurred.';
    }
  }

  // Network errors
  if (error?.name === 'NetworkError' || error?.message?.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Generic error
  return error?.message || 'An unexpected error occurred.';
}