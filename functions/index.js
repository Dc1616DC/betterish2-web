const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Scheduled function to process reminder notifications
 * Runs every minute to check for due reminders
 */
exports.processReminderNotifications = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
  console.log('Processing reminder notifications...');
  
  try {
    const now = admin.firestore.Timestamp.now();
    
    // Get all unsent reminders that are due
    const dueRemindersQuery = db.collection('scheduledNotifications')
      .where('sent', '==', false)
      .where('scheduledFor', '<=', now)
      .limit(50); // Process in batches
    
    const dueReminders = await dueRemindersQuery.get();
    console.log(`Found ${dueReminders.size} due reminders`);
    
    const promises = dueReminders.docs.map(async (reminderDoc) => {
      const reminder = reminderDoc.data();
      
      try {
        // Get user's FCM token and notification preferences
        const userDoc = await db.collection('users').doc(reminder.userId).get();
        const userData = userDoc.data();
        
        if (!userData || !userData.fcmToken || !userData.notificationsEnabled) {
          console.log(`Skipping reminder for user ${reminder.userId} - no token or disabled`);
          await reminderDoc.ref.delete();
          return;
        }
        
        // Get the associated task to ensure it still exists and isn't completed
        const taskDoc = await db.collection('tasks').doc(reminder.taskId).get();
        const taskData = taskDoc.data();
        
        if (!taskData || taskData.completed || taskData.deleted) {
          console.log(`Skipping reminder for completed/deleted task ${reminder.taskId}`);
          await reminderDoc.ref.delete();
          return;
        }
        
        // Send the push notification
        const message = {
          token: userData.fcmToken,
          notification: {
            title: reminder.payload.title,
            body: reminder.payload.body || taskData.detail || 'Tap to view details'
          },
          data: {
            type: 'reminder',
            taskId: reminder.taskId,
            userId: reminder.userId
          },
          android: {
            notification: {
              channelId: 'task-reminders',
              priority: 'high',
              sound: 'default',
              icon: 'ic_notification',
              color: '#3B82F6'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
                category: 'TASK_REMINDER'
              }
            }
          }
        };
        
        await messaging.send(message);
        console.log(`Reminder sent successfully for task ${reminder.taskId}`);
        
        // Mark as sent and record delivery
        await reminderDoc.ref.update({
          sent: true,
          sentAt: admin.firestore.Timestamp.now(),
          deliveryStatus: 'sent'
        });
        
        // Update task to clear the reminder setting
        await taskDoc.ref.update({
          'reminder.sent': true
        });
        
      } catch (error) {
        console.error(`Failed to send reminder for task ${reminder.taskId}:`, error);
        
        // Increment failure count
        const attempts = (reminder.attempts || 0) + 1;
        
        if (attempts >= 3) {
          // Delete after 3 failed attempts
          console.log(`Deleting reminder after ${attempts} failed attempts`);
          await reminderDoc.ref.delete();
        } else {
          // Retry later
          await reminderDoc.ref.update({ 
            attempts,
            lastError: error.message,
            lastAttemptAt: admin.firestore.Timestamp.now()
          });
        }
      }
    });
    
    await Promise.all(promises);
    console.log('Finished processing reminder notifications');
    
  } catch (error) {
    console.error('Error processing reminder notifications:', error);
  }
});

/**
 * Function to schedule a reminder notification
 * Called when a user sets a reminder on a task
 */
exports.scheduleReminder = functions.https.onCall(async (data, context) => {
  const { taskId, userId, reminderType, customTime } = data;
  
  if (!taskId || !userId || !reminderType) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }
  
  try {
    // Get the task details
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Task not found');
    }
    
    const taskData = taskDoc.data();
    
    // Calculate when to send the reminder
    let scheduledFor;
    const now = new Date();
    
    switch (reminderType) {
      case 'morning':
        scheduledFor = new Date(now);
        scheduledFor.setDate(now.getDate() + 1); // Tomorrow
        scheduledFor.setHours(9, 0, 0, 0);      // 9:00 AM
        break;
        
      case 'evening':
        scheduledFor = new Date(now);
        scheduledFor.setDate(now.getDate() + 1); // Tomorrow
        scheduledFor.setHours(19, 0, 0, 0);     // 7:00 PM
        break;
        
      case 'custom':
        if (!customTime) {
          throw new functions.https.HttpsError('invalid-argument', 'Custom time required for custom reminder');
        }
        scheduledFor = new Date(customTime);
        break;
        
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid reminder type');
    }
    
    // Create the scheduled notification
    const reminderData = {
      userId,
      taskId,
      type: 'reminder',
      scheduledFor: admin.firestore.Timestamp.fromDate(scheduledFor),
      payload: {
        title: `⏰ Your Reminder: ${taskData.title}`,
        body: taskData.detail || 'Tap to view details'
      },
      sent: false,
      attempts: 0,
      createdAt: admin.firestore.Timestamp.now()
    };
    
    const reminderRef = await db.collection('scheduledNotifications').add(reminderData);
    
    // Update the task with reminder info
    await taskDoc.ref.update({
      reminder: {
        enabled: true,
        type: reminderType,
        scheduledFor: admin.firestore.Timestamp.fromDate(scheduledFor),
        notificationId: reminderRef.id,
        createdAt: admin.firestore.Timestamp.now(),
        sent: false
      }
    });
    
    console.log(`Reminder scheduled for task ${taskId} at ${scheduledFor}`);
    
    return {
      success: true,
      reminderScheduled: scheduledFor.toISOString(),
      notificationId: reminderRef.id
    };
    
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    throw new functions.https.HttpsError('internal', 'Failed to schedule reminder');
  }
});

/**
 * Function to cancel a reminder
 */
exports.cancelReminder = functions.https.onCall(async (data, context) => {
  const { taskId, userId } = data;
  
  if (!taskId || !userId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }
  
  try {
    // Find and delete the scheduled notification
    const scheduledQuery = db.collection('scheduledNotifications')
      .where('taskId', '==', taskId)
      .where('userId', '==', userId)
      .where('sent', '==', false);
    
    const scheduledNotifications = await scheduledQuery.get();
    
    const deletePromises = scheduledNotifications.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    
    // Remove reminder info from task
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (taskDoc.exists) {
      await taskDoc.ref.update({
        reminder: admin.firestore.FieldValue.delete()
      });
    }
    
    console.log(`Reminder cancelled for task ${taskId}`);
    
    return { success: true, cancelled: scheduledNotifications.size };
    
  } catch (error) {
    console.error('Error cancelling reminder:', error);
    throw new functions.https.HttpsError('internal', 'Failed to cancel reminder');
  }
});

/**
 * Clean up completed or deleted tasks from scheduled notifications
 * Triggered when a task is updated
 */
exports.cleanupReminderOnTaskUpdate = functions.firestore.document('tasks/{taskId}').onUpdate(async (change, context) => {
  const newData = change.after.data();
  const taskId = context.params.taskId;
  
  // If task is completed or deleted, remove its scheduled reminders
  if (newData.completed || newData.deleted) {
    try {
      const reminderQuery = db.collection('scheduledNotifications')
        .where('taskId', '==', taskId)
        .where('sent', '==', false);
      
      const reminders = await reminderQuery.get();
      const deletePromises = reminders.docs.map(doc => doc.ref.delete());
      
      await Promise.all(deletePromises);
      console.log(`Cleaned up ${reminders.size} reminders for task ${taskId}`);
      
    } catch (error) {
      console.error(`Error cleaning up reminders for task ${taskId}:`, error);
    }
  }
});