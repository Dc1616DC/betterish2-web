/**
 * Service Worker for Betterish Push Notifications
 * Handles dad mentor nudges and task reminders
 */

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(clients.claim());
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Time to get stuff done!',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || 'betterish-notification',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || '🎯 Betterish Dad Reminder',
      options
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data || {};
  
  // Handle action buttons
  if (event.action === 'complete') {
    // Mark task as complete
    clients.openWindow('/dashboard?action=complete&task=' + data.taskId);
  } else if (event.action === 'snooze') {
    // Snooze for 1 hour
    clients.openWindow('/dashboard?action=snooze&task=' + data.taskId);
  } else {
    // Default - open dashboard
    clients.openWindow('/dashboard');
  }
});

// Background sync for offline task completion
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  // Sync any offline task completions when back online
  console.log('Syncing tasks...');
}