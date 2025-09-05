/**
 * Push Notification Service
 * Handles dad mentor nudges and scheduled task reminders
 */

class NotificationService {
  constructor() {
    this.swRegistration = null;
    this.nudgeInterval = null;
    this.lastActivityTime = Date.now();
    this.lastCompletedTask = null;
  }

  /**
   * Initialize service worker and request permission
   */
  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      this.swRegistration = registration;
      console.log('Service Worker registered');

      // Request notification permission
      const permission = await this.requestPermission();
      if (permission === 'granted') {
        this.startNudgeSystem();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    const permission = await Notification.requestPermission();
    localStorage.setItem('notificationPermission', permission);
    return permission;
  }

  /**
   * Start the dad mentor nudge system
   */
  startNudgeSystem() {
    // Check every 30 minutes if we should nudge
    this.nudgeInterval = setInterval(() => {
      this.checkAndNudge();
    }, 30 * 60 * 1000); // 30 minutes

    // Also check on visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateActivity();
      }
    });
  }

  /**
   * Check if user needs a nudge
   */
  async checkAndNudge() {
    const now = Date.now();
    const hoursSinceActivity = (now - this.lastActivityTime) / (1000 * 60 * 60);
    
    // Get current tasks from localStorage
    const tasks = JSON.parse(localStorage.getItem('pendingTasks') || '[]');
    const completedToday = JSON.parse(localStorage.getItem('completedToday') || '[]');
    
    // Nudge if: 2+ hours inactive AND (has uncompleted tasks OR no tasks)
    if (hoursSinceActivity >= 2) {
      if (tasks.length > 0) {
        // Has tasks but not working on them
        this.sendSlackerNudge(tasks.length, completedToday.length);
      } else if (completedToday.length === 0) {
        // No tasks and hasn't done anything today
        this.sendEmptyListNudge();
      }
    }
  }

  /**
   * Send a nudge when user has tasks but isn't doing them
   */
  sendSlackerNudge(taskCount, completedCount) {
    const nudges = [
      {
        title: "🎯 Still ${taskCount} things on your list",
        body: completedCount > 0 
          ? `You knocked out ${completedCount} already. Keep the momentum going!`
          : "Let's knock out just ONE thing. 5 minutes. You got this.",
        actions: [
          { action: 'open', title: 'Show me' },
          { action: 'snooze', title: 'In 1 hour' }
        ]
      },
      {
        title: "👀 Your list is judging you",
        body: `${taskCount} tasks sitting there. Pick the easiest one and just do it.`,
        actions: [
          { action: 'open', title: "Fine, I'm going" },
          { action: 'snooze', title: 'Later' }
        ]
      },
      {
        title: "⏰ 2 hours and nothing done?",
        body: "Your future self is going to hate current you. Let's fix that.",
        actions: [
          { action: 'open', title: 'Alright, alright' },
          { action: 'snooze', title: 'Stop nagging' }
        ]
      },
      {
        title: "🏆 Other dads are getting stuff done",
        body: `You've got ${taskCount} things waiting. Beat the dad average - do ONE.`,
        actions: [
          { action: 'open', title: "I'm on it" },
          { action: 'snooze', title: 'Whatever' }
        ]
      }
    ];

    const nudge = nudges[Math.floor(Math.random() * nudges.length)];
    this.showNotification(nudge);
  }

  /**
   * Send a nudge when user has no tasks
   */
  sendEmptyListNudge() {
    const nudges = [
      {
        title: "📝 Your list is empty",
        body: "Either you're superhuman or you're forgetting something. What needs doing?",
        actions: [
          { action: 'open', title: 'Add tasks' },
          { action: 'snooze', title: 'All good' }
        ]
      },
      {
        title: "🤔 Nothing to do? Really?",
        body: "When's the last time you changed the HVAC filter? Just saying...",
        actions: [
          { action: 'open', title: 'Good point' },
          { action: 'snooze', title: "I'm good" }
        ]
      },
      {
        title: "👻 Your task list is a ghost town",
        body: "Add something before you forget. Future you will thank present you.",
        actions: [
          { action: 'open', title: 'Add something' },
          { action: 'snooze', title: 'Nah' }
        ]
      }
    ];

    const nudge = nudges[Math.floor(Math.random() * nudges.length)];
    this.showNotification(nudge);
  }

  /**
   * Schedule a reminder for a specific task
   */
  scheduleTaskReminder(task, time) {
    const now = new Date();
    const reminderTime = new Date(time);
    const delay = reminderTime - now;

    if (delay > 0) {
      setTimeout(() => {
        this.showNotification({
          title: `⏰ Task Reminder`,
          body: task.title,
          data: { taskId: task.id },
          actions: [
            { action: 'complete', title: 'Done ✓' },
            { action: 'snooze', title: 'Snooze' }
          ],
          requireInteraction: true
        });
      }, delay);

      // Store scheduled reminder
      const reminders = JSON.parse(localStorage.getItem('scheduledReminders') || '[]');
      reminders.push({
        taskId: task.id,
        time: reminderTime.toISOString(),
        created: now.toISOString()
      });
      localStorage.setItem('scheduledReminders', JSON.stringify(reminders));
    }
  }

  /**
   * Show a notification
   */
  async showNotification(options) {
    if (Notification.permission !== 'granted') return;

    try {
      await this.swRegistration.showNotification(
        options.title,
        {
          body: options.body,
          icon: '/icon-192.png',
          badge: '/icon-72.png',
          vibrate: [200, 100, 200],
          data: options.data || {},
          actions: options.actions || [],
          requireInteraction: options.requireInteraction || false,
          tag: options.tag || `nudge-${Date.now()}`,
          renotify: true
        }
      );
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Update last activity time
   */
  updateActivity() {
    this.lastActivityTime = Date.now();
    localStorage.setItem('lastActivityTime', this.lastActivityTime);
  }

  /**
   * Record task completion
   */
  taskCompleted(task) {
    this.lastCompletedTask = Date.now();
    this.updateActivity();
    
    // Update completed today list
    const completedToday = JSON.parse(localStorage.getItem('completedToday') || '[]');
    completedToday.push({
      ...task,
      completedAt: new Date().toISOString()
    });
    localStorage.setItem('completedToday', JSON.stringify(completedToday));
    
    // Reset at midnight
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const tillMidnight = midnight - new Date();
    setTimeout(() => {
      localStorage.setItem('completedToday', '[]');
    }, tillMidnight);
  }

  /**
   * Stop nudge system
   */
  stop() {
    if (this.nudgeInterval) {
      clearInterval(this.nudgeInterval);
      this.nudgeInterval = null;
    }
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;