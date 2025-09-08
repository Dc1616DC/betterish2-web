'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { User } from '@/types/models';
import { BaseProps } from '@/types/components';

interface NotificationPermissionProps extends BaseProps {
  messaging: any; // Firebase messaging instance
  user: User | null;
  db: any; // Firebase database instance
}

const NotificationPermission: React.FC<NotificationPermissionProps> = ({ 
  messaging, 
  user, 
  db,
  className 
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const { permission, requestPermission, isSupported } = useNotifications(messaging, user, db);

  // Don't show if notifications aren't supported or already granted/denied
  if (!isSupported || permission !== 'default' || !isVisible) {
    return null;
  }

  const handleRequestPermission = async (): Promise<void> => {
    setIsRequesting(true);
    try {
      const token = await requestPermission();
      if (token) {
        // Success - hide the banner
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = (): void => {
    setIsVisible(false);
    // Optionally save this preference to not show again
  };

  return (
    <div className={`mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg ${className || ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <BellIcon className="w-6 h-6 text-blue-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">
              Stay on track with gentle reminders
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Get notified about incomplete tasks so you never miss that win at home.
            </p>
            <div className="mt-3 flex space-x-3">
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isRequesting ? 'Setting up...' : 'Enable Reminders'}
              </button>
              <button
                onClick={handleDismiss}
                className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1.5"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-blue-400 hover:text-blue-600"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default NotificationPermission;