'use client';

import { useState, useEffect } from 'react';
import { ExclamationCircleIcon, HeartIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function SmartReminders({ userId, tasks, completionHistory, onReminderAction }) {
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    if (!userId || !tasks) return;
    
    const generateReminders = () => {
      const now = new Date();
      const daysSinceStart = Math.floor((now - new Date('2025-01-01')) / (1000 * 60 * 60 * 24));
      
      const newReminders = [];
      
      // Check relationship task patterns
      const relationshipTasks = completionHistory.filter(task => 
        task.category === 'relationship' && 
        task.completedAt && 
        task.completedAt > Date.now() - (7 * 24 * 60 * 60 * 1000)
      );
      
      if (relationshipTasks.length === 0 && daysSinceStart > 3) {
        newReminders.push({
          id: 'relationship-neglect',
          type: 'relationship',
          title: 'Relationship Check-in',
          message: "You haven't done any relationship tasks lately. Your partner might appreciate some attention.",
          action: "Consider sending a loving text or planning something thoughtful",
          icon: HeartIcon,
          color: 'bg-pink-50 border-pink-200 text-pink-800',
          priority: 'medium',
          suggestedTask: {
            title: 'Send appreciation text',
            detail: 'Tell your partner something you appreciate about them today'
          }
        });
      }
      
      // Check for stale tasks
      const staleTasks = tasks.filter(task => {
        const createdAt = task.createdAt?.toDate?.() || new Date(task.createdAt);
        const daysSinceCreated = (now - createdAt) / (1000 * 60 * 60 * 24);
        return daysSinceCreated > 2 && !task.completed;
      });
      
      if (staleTasks.length > 2) {
        newReminders.push({
          id: 'stale-tasks',
          type: 'productivity',
          title: 'Tasks Piling Up',
          message: `You have ${staleTasks.length} tasks that have been sitting for over 2 days.`,
          action: "Maybe break them down into smaller steps or consider if they're still relevant",
          icon: ExclamationCircleIcon,
          color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          priority: 'medium'
        });
      }
      
      // Weekend planning reminder
      const isThursday = now.getDay() === 4;
      const isFriday = now.getDay() === 5;
      
      if ((isThursday || isFriday) && daysSinceStart > 7) {
        newReminders.push({
          id: 'weekend-planning',
          type: 'planning',
          title: 'Weekend Coming Up',
          message: 'Planning ahead can help you have a smoother weekend with the family.',
          action: 'Consider prepping something for Saturday morning or planning a family activity',
          icon: CalendarIcon,
          color: 'bg-blue-50 border-blue-200 text-blue-800',
          priority: 'low'
        });
      }
      
      // Energy pattern reminder
      const currentHour = now.getHours();
      if (currentHour >= 14 && currentHour <= 16) {
        const recentHighEnergyTasks = completionHistory.filter(task => 
          task.priority === 'high' && 
          task.completedAt > Date.now() - (24 * 60 * 60 * 1000)
        );
        
        if (recentHighEnergyTasks.length === 0) {
          newReminders.push({
            id: 'energy-timing',
            type: 'energy',
            title: 'Afternoon Energy Window',
            message: 'This is often a good time for focused tasks before the evening routine kicks in.',
            action: 'Consider tackling one meaningful task while you have good energy',
            icon: ClockIcon,
            color: 'bg-green-50 border-green-200 text-green-800',
            priority: 'low'
          });
        }
      }
      
      // Filter out dismissed reminders
      const dismissed = JSON.parse(localStorage.getItem('dismissedReminders') || '[]');
      const activeReminders = newReminders.filter(reminder => 
        !dismissed.includes(reminder.id)
      );
      
      // Sort by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      activeReminders.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
      
      setReminders(activeReminders.slice(0, 2)); // Show max 2 reminders
    };
    
    generateReminders();
  }, [userId, tasks, completionHistory]);

  const handleDismiss = (reminderId) => {
    // Store dismissed reminders
    const dismissed = JSON.parse(localStorage.getItem('dismissedReminders') || '[]');
    dismissed.push(reminderId);
    localStorage.setItem('dismissedReminders', JSON.stringify(dismissed));
    
    // Remove from current reminders
    setReminders(prev => prev.filter(r => r.id !== reminderId));
    
    if (onReminderAction) {
      onReminderAction('dismiss', { reminderId });
    }
  };

  const handleAction = (reminder) => {
    if (onReminderAction) {
      if (reminder.id.includes('relationship')) {
        onReminderAction('add_relationship_task', {
          title: reminder.suggestedTask?.title || 'Check in with partner',
          detail: reminder.suggestedTask?.detail || 'How are they feeling today?'
        });
      } else if (reminder.id.includes('weekend')) {
        onReminderAction('weekend_planning', reminder);
      } else {
        onReminderAction('reminder_action', reminder);
      }
    }
    handleDismiss(reminder.id);
  };

  if (reminders.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      {reminders.map((reminder) => {
        const IconComponent = reminder.icon;
        return (
          <div
            key={reminder.id}
            className={`p-4 rounded-lg border-2 ${reminder.color} relative`}
          >
            <button
              onClick={() => handleDismiss(reminder.id)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
            
            <div className="flex items-start gap-3 pr-6">
              <IconComponent className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">{reminder.title}</h3>
                <p className="text-sm opacity-90 mb-2">{reminder.message}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium opacity-75">
                    💡 {reminder.action}
                  </p>
                  {reminder.suggestedTask && (
                    <button
                      onClick={() => handleAction(reminder)}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                    >
                      Add Task
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
