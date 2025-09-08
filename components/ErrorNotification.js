'use client';

import { useState, useEffect } from 'react';
import { addErrorListener, removeErrorListener, ErrorSeverity } from '@/lib/errorHandler';

/**
 * Global Error Notification System
 * Shows toast notifications for non-critical errors
 */
export default function ErrorNotification() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleError = (errorData) => {
      // Only show notifications for medium and low severity errors
      // Critical and high severity errors should be handled by ErrorBoundary
      if (errorData.severity === ErrorSeverity.MEDIUM || errorData.severity === ErrorSeverity.LOW) {
        const notification = {
          id: errorData.id,
          message: errorData.message,
          type: errorData.type,
          severity: errorData.severity,
          timestamp: Date.now()
        };

        setNotifications(prev => [...prev, notification]);

        // Auto-dismiss after 5 seconds for low severity, 8 seconds for medium
        const dismissTime = errorData.severity === ErrorSeverity.LOW ? 5000 : 8000;
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, dismissTime);
      }
    };

    addErrorListener(handleError);

    return () => {
      removeErrorListener(handleError);
    };
  }, []);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <ErrorToast
          key={notification.id}
          notification={notification}
          onDismiss={() => dismissNotification(notification.id)}
        />
      ))}
    </div>
  );
}

function ErrorToast({ notification, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for animation
  };

  const getSeverityStyles = () => {
    switch (notification.severity) {
      case ErrorSeverity.MEDIUM:
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          icon: 'text-orange-500',
          text: 'text-orange-800',
          button: 'text-orange-500 hover:text-orange-700'
        };
      case ErrorSeverity.LOW:
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-500',
          text: 'text-blue-800',
          button: 'text-blue-500 hover:text-blue-700'
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <div
      className={`
        ${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 max-w-sm w-full
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {notification.severity === ErrorSeverity.MEDIUM ? (
            <svg className={`h-5 w-5 ${styles.icon}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className={`h-5 w-5 ${styles.icon}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className={`text-sm font-medium ${styles.text}`}>
            {notification.severity === ErrorSeverity.MEDIUM ? 'Warning' : 'Notice'}
          </p>
          <p className={`text-sm ${styles.text} opacity-90 mt-1`}>
            {notification.message}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-gray-500 mt-1">
              Type: {notification.type}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={handleDismiss}
            className={`rounded-md inline-flex ${styles.button} focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}