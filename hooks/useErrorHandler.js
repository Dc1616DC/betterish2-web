'use client';

import { useState, useCallback } from 'react';

export function useErrorHandler() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsync = useCallback(async (asyncFn, options = {}) => {
    const { 
      loadingMessage = 'Processing...',
      successMessage = null,
      showToast = false 
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
      
      if (showToast) {
        // Show error toast if needed
      }
      
      throw err; // Re-throw so caller can handle if needed
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    isLoading,
    handleAsync,
    clearError
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