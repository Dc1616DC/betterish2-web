/**
 * Notification Settings Component
 * Manage push notifications and schedule task reminders
 */

/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect } from 'react';
import { BellIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import notificationService from '@/lib/notificationService';

export default function NotificationSettings({ task, onClose }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  const [reminderSet, setReminderSet] = useState(false);
  const [nudgeSettings, setNudgeSettings] = useState({
    enabled: true,
    frequency: 2, // hours
    quietHours: { start: 22, end: 8 } // 10pm to 8am
  });

  useEffect(() => {
    // Check current notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const enableNotifications = async () => {
    const enabled = await notificationService.init();
    setNotificationsEnabled(enabled);
    
    if (enabled) {
      // Show success notification
      notificationService.showNotification({
        title: '🎯 Notifications Enabled!',
        body: "I'll nudge you when you're slacking off. You're welcome.",
        actions: [
          { action: 'open', title: 'Thanks... I guess' }
        ]
      });
    }
  };

  const scheduleReminder = () => {
    if (!reminderTime || !task) return;
    
    // Convert time input to today's date with that time
    const [hours, minutes] = reminderTime.split(':');
    const reminderDate = new Date();
    reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // If time has passed today, set for tomorrow
    if (reminderDate < new Date()) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }
    
    notificationService.scheduleTaskReminder(task, reminderDate);
    setReminderSet(true);
    
    // Show confirmation
    const timeString = reminderDate.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    const dayString = reminderDate.toDateString() === new Date().toDateString() 
      ? 'today' 
      : 'tomorrow';
    
    alert(`Reminder set for ${timeString} ${dayString}`);
  };

  const saveNudgeSettings = () => {
    localStorage.setItem('nudgeSettings', JSON.stringify(nudgeSettings));
    
    // Restart nudge system with new settings
    notificationService.stop();
    notificationService.startNudgeSystem();
    
    alert('Nudge settings updated!');
  };

  if (!task) {
    // Global notification settings
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BellIcon className="w-5 h-5" />
          Notification Settings
        </h3>
        
        {!notificationsEnabled ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enable notifications to get dad mentor nudges when you're not completing tasks.
            </p>
            <button
              onClick={enableNotifications}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enable Push Notifications
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Dad Mentor Nudges</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={nudgeSettings.enabled}
                  onChange={(e) => setNudgeSettings({...nudgeSettings, enabled: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nudge me every:
              </label>
              <select
                value={nudgeSettings.frequency}
                onChange={(e) => setNudgeSettings({...nudgeSettings, frequency: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="3">3 hours</option>
                <option value="4">4 hours</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quiet hours (no nudges):
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={nudgeSettings.quietHours.start}
                  onChange={(e) => setNudgeSettings({
                    ...nudgeSettings, 
                    quietHours: {...nudgeSettings.quietHours, start: parseInt(e.target.value)}
                  })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                  min="0"
                  max="23"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  value={nudgeSettings.quietHours.end}
                  onChange={(e) => setNudgeSettings({
                    ...nudgeSettings, 
                    quietHours: {...nudgeSettings.quietHours, end: parseInt(e.target.value)}
                  })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                  min="0"
                  max="23"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">24-hour format (22 = 10pm)</p>
            </div>
            
            <button
              onClick={saveNudgeSettings}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Save Nudge Settings
            </button>
            
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Sample nudges you'll get:
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-600 italic">"Still 5 things on your list. Pick one and knock it out."</p>
                <p className="text-xs text-gray-600 italic">"2 hours and nothing done? Your future self will hate you."</p>
                <p className="text-xs text-gray-600 italic">"Your list is judging you. Just do ONE thing."</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Task-specific reminder scheduling
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <ClockIcon className="w-5 h-5" />
          Schedule Reminder
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm font-medium text-blue-900">{task.title}</p>
          {task.detail && (
            <p className="text-xs text-blue-700 mt-1">{task.detail}</p>
          )}
        </div>
        
        {!notificationsEnabled ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Enable notifications first to schedule reminders.
            </p>
            <button
              onClick={enableNotifications}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enable Notifications
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remind me at:
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={scheduleReminder}
              disabled={!reminderTime || reminderSet}
              className={`w-full px-4 py-2 rounded-lg transition-colors ${
                reminderSet 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {reminderSet ? '✓ Reminder Set' : 'Set Reminder'}
            </button>
            
            {reminderSet && (
              <p className="text-xs text-green-600 text-center">
                You'll get a notification to complete this task!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}