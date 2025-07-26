// Firebase messaging service worker for push notifications

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// Note: In production, you'll need to replace these with your actual config values
firebase.initializeApp({
  apiKey: "AIzaSyAIagVTVnvTAynzWpR1rN9LYjqP0VR-jRY",
  authDomain: "betterish.firebaseapp.com",
  projectId: "betterish",
  storageBucket: "betterish.appspot.com",
  messagingSenderId: "518718685590",
  appId: "1:518718685590:web:81365b3437a62636bd5db7"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message: ', payload);
  
  const notificationTitle = payload.notification?.title || 'Betterish Reminder';
  const notificationOptions = {
    body: payload.notification?.body || 'You have incomplete tasks',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'betterish-reminder',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View Tasks'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    data: {
      url: '/dashboard',
      taskId: payload.data?.taskId
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    // Open the dashboard
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open dashboard
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});