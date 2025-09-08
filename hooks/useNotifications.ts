import { useState, useEffect, useCallback } from 'react';
import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, updateDoc, Firestore } from 'firebase/firestore';
import { User } from 'firebase/auth';

// VAPID Key - Generated from Firebase Console Cloud Messaging
const VAPID_KEY = 'BLfM-zFvgzgx0LGYrlISWU34W1mMoOem872u--p6ObMJ3Y9-sn97lXUQ21LB1HMX4l9C0lWN1ppfV1BMW-Pi0fU';

interface UseNotificationsReturn {
  permission: NotificationPermission;
  token: string | null;
  error: string | null;
  requestPermission: () => Promise<string | null>;
  isSupported: boolean;
}

export function useNotifications(
  messaging: Messaging | null, 
  user: User | null, 
  db: Firestore | null
): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<string | null> => {
    if (!messaging || !user) return null;

    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications');
      }

      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        // Get FCM token
        const currentToken = await getToken(messaging, {
          vapidKey: VAPID_KEY
        });

        if (currentToken) {
          setToken(currentToken);
          
          // Save token to user's document for server-side notifications
          if (user?.uid && db) {
            await updateDoc(doc(db, 'users', user.uid), {
              fcmToken: currentToken,
              notificationsEnabled: true,
              lastTokenUpdate: new Date()
            });
          }

          return currentToken;
        } else {
          throw new Error('No registration token available');
        }
      } else {
        throw new Error('Notification permission denied');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error getting notification permission:', err);
      setError(errorMessage);
      return null;
    }
  }, [messaging, user, db]);

  // Set up foreground message listener
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show notification when app is in foreground
      if (permission === 'granted') {
        const notificationTitle = payload.notification?.title || 'Betterish Reminder';
        const notificationOptions: NotificationOptions = {
          body: payload.notification?.body || 'You have incomplete tasks',
          icon: '/favicon.ico',
          tag: 'betterish-reminder',
          requireInteraction: false
        };

        new Notification(notificationTitle, notificationOptions);
      }
    });

    return () => unsubscribe();
  }, [messaging, permission]);

  // Check initial permission status
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  return {
    permission,
    token,
    error,
    requestPermission,
    isSupported: 'Notification' in window
  };
}