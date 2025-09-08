'use client';

import { useState } from 'react';
import { getReminderInfo } from '@/lib/reminders';

// Category color system for visual clarity
const CATEGORY_COLORS = {
  personal: { bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  relationship: { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  baby: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  household: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  home_projects: { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  health: { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  events: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  maintenance: { bg: 'bg-slate-500', light: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  work: { bg: 'bg-gray-500', light: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
};

// Simplified task card for mobile with button controls
export default function TaskCard({ task, onComplete, onDismiss, onSnooze, onUndo, onSetReminder, onOpenChat, isFirst, functions, user, userTier }) {
  const [justCompleted, setJustCompleted] = useState(false);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [showReminderMenu, setShowReminderMenu] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const colors = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.work;
  
  // Get reminder info for display
  const reminderInfo = getReminderInfo(task);
  
  const handleComplete = () => {
    setJustCompleted(true);
    onComplete(task.id);
    // Show undo option for 5 seconds after completion
    setTimeout(() => setJustCompleted(false), 5000);
  };
  
  const handleDismiss = () => {
    if (onDismiss) onDismiss(task.id);
  };
  
  const handleUndo = () => {
    setJustCompleted(false);
    if (onUndo) onUndo(task.id);
  };

  const handleSnooze = (duration) => {
    setShowSnoozeMenu(false);
    setShowTimeMenu(false);
    if (onSnooze) {
      onSnooze(task.id, duration);
    }
  };

  const handleSetReminder = async (reminderType) => {
    setShowReminderMenu(false);
    setShowTimeMenu(false);
    
    try {
      if (onSetReminder && functions && user) {
        await onSetReminder(task.id, reminderType);
      }
    } catch (error) {
      console.error('Error setting reminder:', error);
    }
  };

  // Calculate snooze date based on option
  const getSnoozeUntil = (option) => {
    const now = new Date();
    switch(option) {
      case '1day':
        now.setDate(now.getDate() + 1);
        now.setHours(9, 0, 0, 0); // Tomorrow at 9am
        return now;
      case '3days':
        now.setDate(now.getDate() + 3);
        now.setHours(9, 0, 0, 0); // 3 days from now at 9am
        return now;
      case 'weekend':
        const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
        now.setDate(now.getDate() + daysUntilSaturday);
        now.setHours(9, 0, 0, 0); // Saturday at 9am
        return now;
      case '1week':
        now.setDate(now.getDate() + 7);
        now.setHours(9, 0, 0, 0); // 1 week from now at 9am
        return now;
      default:
        return now;
    }
  };

  return (
    <div className="relative">
      {/* Time management menu overlay */}
      {showTimeMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setShowTimeMenu(false)}
          />
          <div className="absolute top-0 left-0 right-0 bg-white rounded-2xl shadow-xl z-50 border border-gray-200">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Time Management</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowTimeMenu(false);
                    setShowSnoozeMenu(true);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                >
                  <span className="text-lg mr-3">💤</span>
                  <div>
                    <div className="font-medium text-gray-900">Snooze Task</div>
                    <div className="text-xs text-gray-500">Hide until later</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowTimeMenu(false);
                    setShowReminderMenu(true);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                >
                  <span className="text-lg mr-3">🔔</span>
                  <div>
                    <div className="font-medium text-gray-900">Set Reminder</div>
                    <div className="text-xs text-gray-500">Get notified later</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowTimeMenu(false);
                    onOpenChat && onOpenChat(task);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                >
                  <span className="text-lg mr-3">💭</span>
                  <div>
                    <div className="font-medium text-gray-900">Ask Sidekick</div>
                    <div className="text-xs text-gray-500">
                      {userTier === 'premium' || userTier === 'family' ? 'Get help with this task' : 'Free: 3/month'}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setShowTimeMenu(false)}
                  className="w-full mt-2 px-3 py-2 text-gray-500 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Snooze options menu */}
      {showSnoozeMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setShowSnoozeMenu(false)}
          />
          <div className="absolute top-0 left-0 right-0 bg-white rounded-2xl shadow-xl z-50 border border-gray-200">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Snooze until:</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleSnooze(getSnoozeUntil('1day'))}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900">Tomorrow</div>
                  <div className="text-xs text-gray-500">9:00 AM</div>
                </button>
                <button
                  onClick={() => handleSnooze(getSnoozeUntil('3days'))}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900">In 3 days</div>
                  <div className="text-xs text-gray-500">9:00 AM</div>
                </button>
                <button
                  onClick={() => handleSnooze(getSnoozeUntil('weekend'))}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900">This weekend</div>
                  <div className="text-xs text-gray-500">Saturday 9:00 AM</div>
                </button>
                <button
                  onClick={() => handleSnooze(getSnoozeUntil('1week'))}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900">Next week</div>
                  <div className="text-xs text-gray-500">9:00 AM</div>
                </button>
                <button
                  onClick={() => setShowSnoozeMenu(false)}
                  className="w-full mt-2 px-3 py-2 text-gray-500 text-sm"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reminder options menu */}
      {showReminderMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setShowReminderMenu(false)}
          />
          <div className="absolute top-0 left-0 right-0 bg-white rounded-2xl shadow-xl z-50 border border-gray-200">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Set reminder for:</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleSetReminder('morning')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900">Tomorrow Morning</div>
                  <div className="text-xs text-gray-500">9:00 AM</div>
                </button>
                <button
                  onClick={() => handleSetReminder('evening')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900">Tomorrow Evening</div>
                  <div className="text-xs text-gray-500">7:00 PM</div>
                </button>
                <button
                  onClick={() => setShowReminderMenu(false)}
                  className="w-full mt-2 px-3 py-2 text-gray-500 text-sm"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div 
        className={`
          relative bg-white rounded-2xl shadow-sm border transition-all duration-300 z-10
          ${isFirst ? 'scale-105 shadow-lg' : 'scale-100'}
          ${task.completed ? 'opacity-50' : 'opacity-100'}
        `}
      >
        {/* Color indicator bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.bg} rounded-l-2xl`} />
        
        <div className="pl-4 pr-3 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-grow">
              <h3 className={`font-semibold text-gray-900 text-base leading-tight ${task.completed ? 'line-through' : ''}`}>
                {task.title}
              </h3>
              {task.detail && (
                <p className={`text-sm text-gray-500 mt-1 ${task.completed ? 'line-through' : ''}`}>{task.detail}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs font-medium ${colors.text}`}>
                  {task.category.replace('_', ' ')}
                </span>
                {task.priority === 'high' && !task.completed && (
                  <span className="text-xs font-medium text-red-600">urgent</span>
                )}
                {reminderInfo && (
                  <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                    <span>🔔</span>
                    {reminderInfo.formattedTime}
                  </span>
                )}
                {task.completed && justCompleted && (
                  <button
                    onClick={handleUndo}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Undo
                  </button>
                )}
              </div>
            </div>
            
            {/* Action buttons for incomplete tasks */}
            {!task.completed && (
              <div className="flex-shrink-0 flex gap-2 ml-3">
                <button
                  onClick={() => setShowTimeMenu(true)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                  title="Options"
                >
                  <span className="text-sm">⋯</span>
                </button>
                <button
                  onClick={handleComplete}
                  className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600"
                  title="Complete"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Completed state */}
            {task.completed && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center ml-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}