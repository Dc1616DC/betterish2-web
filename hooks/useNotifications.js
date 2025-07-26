import { useState, useEffect, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';

// VAPID Key - you'll need to generate this in Firebase Console
const VAPID_KEY = 'YOUR_VAPID_KEY_HERE'; // Replace with actual VAPID key

export function useNotifications(messaging, user, db) {
  const [permission, setPermission] = useState('default');
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  // Request notification permission
  const requestPermission = useCallback(async () => {
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
      console.error('Error getting notification permission:', err);
      setError(err.message);
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
        const notificationOptions = {
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