'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { BaseProps } from '@/types/components';

// Toast types
export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastProps extends BaseProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

interface ToastProviderProps extends BaseProps {
  children: React.ReactNode;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  isVisible, 
  onClose, 
  duration = 3000,
  className,
  'data-testid': testId 
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircleIcon className="w-5 h-5 text-green-600" />,
    warning: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />,
    error: <XCircleIcon className="w-5 h-5 text-red-600" />,
    info: <CheckCircleIcon className="w-5 h-5 text-blue-600" />
  };

  const bgColors: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  };

  const textColors: Record<ToastType, string> = {
    success: 'text-green-800',
    warning: 'text-yellow-800',
    error: 'text-red-800',
    info: 'text-blue-800'
  };

  return (
    <div 
      className={`fixed bottom-20 left-4 right-4 mx-auto max-w-sm z-50 transform transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      } ${className || ''}`}
      data-testid={testId}
    >
      <div className={`${bgColors[type]} border rounded-lg p-4 shadow-lg`}>
        <div className="flex items-center space-x-3">
          {icons[type]}
          <p className={`text-sm font-medium ${textColors[type]}`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

// Toast Context
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children,
  className,
  'data-testid': testId 
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = (message: string, type: ToastType = 'success', duration: number = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const contextValue: ToastContextValue = {
    showToast
  };

  return (
    <ToastContext.Provider value={contextValue}>
      <div className={className} data-testid={testId}>
        {children}
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            isVisible={true}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default Toast;