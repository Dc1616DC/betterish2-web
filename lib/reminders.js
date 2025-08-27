import { httpsCallable } from 'firebase/functions';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * Client-side utilities for managing task reminders
 */

/**
 * Set a reminder for a task
 * @param {string} taskId - The task ID
 * @param {string} reminderType - 'morning', 'evening', or 'custom'  
 * @param {Object} options - Additional options
 * @param {Date} options.customTime - Required if reminderType is 'custom'
 * @param {Object} functions - Firebase functions instance
 * @param {Object} db - Firestore database instance
 * @param {Object} user - Current user
 * @returns {Promise<Object>} Result of scheduling the reminder
 */
export async function setTaskReminder(taskId, reminderType, { customTime = null, functions, db, user }) {
  if (!taskId || !reminderType || !functions || !db || !user) {
    throw new Error('Missing required parameters for setting reminder');
  }

  try {
    // Call the Cloud Function to schedule the reminder
    const scheduleReminder = httpsCallable(functions, 'scheduleReminder');
    
    const result = await scheduleReminder({
      taskId,
      userId: user.uid,
      reminderType,
      customTime: customTime ? customTime.toISOString() : null
    });

    console.log('Reminder scheduled successfully:', result.data);
    return result.data;

  } catch (error) {
    console.error('Error setting task reminder:', error);
    throw new Error(`Failed to set reminder: ${error.message}`);
  }
}

/**
 * Cancel a reminder for a task
 * @param {string} taskId - The task ID
 * @param {Object} functions - Firebase functions instance
 * @param {Object} user - Current user
 * @returns {Promise<Object>} Result of cancelling the reminder
 */
export async function cancelTaskReminder(taskId, { functions, user }) {
  if (!taskId || !functions || !user) {
    throw new Error('Missing required parameters for cancelling reminder');
  }

  try {
    const cancelReminder = httpsCallable(functions, 'cancelReminder');
    
    const result = await cancelReminder({
      taskId,
      userId: user.uid
    });

    console.log('Reminder cancelled successfully:', result.data);
    return result.data;

  } catch (error) {
    console.error('Error cancelling task reminder:', error);
    throw new Error(`Failed to cancel reminder: ${error.message}`);
  }
}

/**
 * Calculate the next reminder time based on type
 * @param {string} reminderType - 'morning', 'evening', or 'custom'
 * @param {Date} customTime - Required if reminderType is 'custom'
 * @returns {Date} The calculated reminder time
 */
export function calculateReminderTime(reminderType, customTime = null) {
  const now = new Date();
  
  switch (reminderType) {
    case 'morning':
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9:00 AM
      return tomorrow;
      
    case 'evening':
      const tomorrowEvening = new Date(now);
      tomorrowEvening.setDate(now.getDate() + 1);
      tomorrowEvening.setHours(19, 0, 0, 0); // 7:00 PM
      return tomorrowEvening;
      
    case 'custom':
      if (!customTime) {
        throw new Error('Custom time is required for custom reminder type');
      }
      return new Date(customTime);
      
    default:
      throw new Error('Invalid reminder type');
  }
}

/**
 * Format reminder time for display
 * @param {Date} reminderTime - The reminder time
 * @param {string} reminderType - The reminder type for context
 * @returns {string} Formatted time string
 */
export function formatReminderTime(reminderTime, reminderType) {
  const now = new Date();
  const isToday = reminderTime.toDateString() === now.toDateString();
  const isTomorrow = reminderTime.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
  
  const timeStr = reminderTime.toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit' 
  });
  
  if (isToday) {
    return `Today ${timeStr}`;
  } else if (isTomorrow) {
    return `Tomorrow ${timeStr}`;
  } else {
    return `${reminderTime.toLocaleDateString()} ${timeStr}`;
  }
}

/**
 * Get reminder display text for different types
 * @param {string} reminderType - The reminder type
 * @returns {Object} Display information
 */
export function getReminderDisplayInfo(reminderType) {
  switch (reminderType) {
    case 'morning':
      return {
        title: 'Morning Reminder',
        subtitle: 'Tomorrow 9:00 AM',
        icon: '🌅'
      };
      
    case 'evening':
      return {
        title: 'Evening Reminder', 
        subtitle: 'Tomorrow 7:00 PM',
        icon: '🌆'
      };
      
    case 'custom':
      return {
        title: 'Custom Reminder',
        subtitle: 'At your specified time',
        icon: '🕐'
      };
      
    default:
      return {
        title: 'Reminder',
        subtitle: '',
        icon: '🔔'
      };
  }
}

/**
 * Check if a task has an active reminder
 * @param {Object} task - The task object
 * @returns {boolean} Whether the task has an active reminder
 */
export function hasActiveReminder(task) {
  return task.reminder && 
         task.reminder.enabled && 
         !task.reminder.sent &&
         task.reminder.scheduledFor;
}

/**
 * Get reminder information for display
 * @param {Object} task - The task object
 * @returns {Object|null} Reminder display info or null if no active reminder
 */
export function getReminderInfo(task) {
  if (!hasActiveReminder(task)) {
    return null;
  }
  
  const reminderTime = task.reminder.scheduledFor.toDate();
  const displayInfo = getReminderDisplayInfo(task.reminder.type);
  
  return {
    ...displayInfo,
    scheduledFor: reminderTime,
    formattedTime: formatReminderTime(reminderTime, task.reminder.type),
    type: task.reminder.type
  };
}