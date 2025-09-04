'use client';

import { useState, useEffect } from 'react';
import { ChevronUpIcon, PlusIcon, SparklesIcon, CalendarIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import MobileProjectCard from './MobileProjectCard';
import SidekickChat from './SidekickChat';
import EmergencyMode from './EmergencyMode';
import AIMentorCheckIn from './AIMentorCheckIn';
import dynamic from 'next/dynamic';

// Dynamically import EventReminder to prevent lexical declaration issues
const EventReminder = dynamic(() => import('./EventReminder'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-16 bg-gray-100 rounded"></div>
});
import { setTaskReminder, hasActiveReminder, getReminderInfo } from '@/lib/reminders';

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
function TaskCard({ task, onComplete, onDismiss, onSnooze, onUndo, onSetReminder, onOpenChat, isFirst, functions, user, userTier }) {
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
      // Could show a toast or error message here
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

// Minimal header with greeting
function MobileHeader({ greeting, taskCount, streak, onLogout }) {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  
  return (
    <div className="px-4 py-4" style={{ paddingTop: `max(1rem, env(safe-area-inset-top))` }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {timeOfDay}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'} today
            {streak > 0 && ` • ${streak} day streak 🔥`}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="p-2 text-gray-500 hover:text-red-600 active:text-red-700"
          title="Sign out"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Swipe-up drawer for suggestions
function SuggestionsDrawer({ isOpen, onClose, suggestions, onAddTask, currentTaskCount }) {
  // Only show if user has < 3 tasks
  const shouldShowSuggestions = currentTaskCount < 3;
  
  if (!shouldShowSuggestions) return null;
  
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div className={`
        fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-xl z-50
        transform transition-transform duration-300
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      `}
      style={{ 
        maxHeight: 'calc(85vh - env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
      >
        <div className="flex flex-col h-full">
          {/* Handle bar */}
          <div className="flex justify-center py-3 flex-shrink-0">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
          
          <div className="px-5 flex-1 flex flex-col">
            <h3 className="font-semibold text-gray-900 mb-3 flex-shrink-0">Suggested for today</h3>
            
            <div className="space-y-3 flex-1 overflow-y-auto -webkit-overflow-scrolling-touch pb-4">
            {suggestions.map((task, index) => {
              const colors = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.work;
              return (
                <button
                  key={index}
                  onClick={() => {
                    onAddTask(task);
                    onClose();
                  }}
                  className="w-full text-left p-4 bg-gray-50 rounded-xl active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start">
                    <div className={`w-1 h-12 ${colors.bg} rounded-full mr-3 flex-shrink-0`} />
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        {task.isEssential && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                            Essential
                          </span>
                        )}
                        {task.isSeasonal && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                            Seasonal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{task.detail}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs font-medium ${colors.text}`}>
                          {task.category.replace('_', ' ')}
                        </span>
                        {task.timeEstimate && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{task.timeEstimate}</span>
                          </>
                        )}
                        {task.prevents && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-600">Prevents {task.prevents}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <PlusIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Quick add floating button
function QuickAddButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30"
      style={{ 
        bottom: `calc(5rem + env(safe-area-inset-bottom) + 1rem)` 
      }}
    >
      <PlusIcon className="w-6 h-6" />
    </button>
  );
}

// Main mobile dashboard
export default function MobileDashboard({ 
  tasks = [], 
  projects = [],
  suggestions = [], 
  onTaskComplete,
  onTaskAdd,
  onTaskSnooze,
  onTaskReminder,
  onShowTaskForm,
  streak = 0,
  upcomingEvents = [],
  onLogout,
  db,
  functions,
  user,
  onProjectComplete,
  onUpdate,
  userTier = 'free'
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [completedToday, setCompletedToday] = useState(0);
  const [showSidekickChat, setShowSidekickChat] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showEmergencyMode, setShowEmergencyMode] = useState(false);

  // Chat handlers
  const handleOpenChat = (task) => {
    setSelectedTask(task);
    setShowSidekickChat(true);
  };

  const handleCloseChat = () => {
    setShowSidekickChat(false);
    setSelectedTask(null);
  };
  
  // Filter for today's active tasks (exclude completed and snoozed)
  const todayTasks = tasks.filter(t => {
    // Filter out completed tasks
    if (t.completed || t.completedAt) return false;
    
    // Filter out snoozed tasks that haven't reached their snooze time yet
    if (t.snoozedUntil) {
      try {
        const snoozeTime = typeof t.snoozedUntil.toDate === 'function' 
          ? t.snoozedUntil.toDate() 
          : new Date(t.snoozedUntil);
        const now = new Date();
        if (now < snoozeTime) {
          return false; // Task is still snoozed
        }
      } catch (error) {
        console.warn('Error processing snooze time for task:', t.id, error);
        // If there's an error processing the snooze time, show the task anyway
      }
    }
    
    return true;
  });
  
  // Show suggestions hint if < 3 tasks
  const needsMoreTasks = todayTasks.length < 3;

  return (
    <div className="mobile-container bg-gray-50">
      <MobileHeader 
        greeting="Good morning"
        taskCount={todayTasks.length}
        streak={streak}
        onLogout={onLogout}
      />
      
      {/* Main content area with proper mobile scrolling */}
      <div className="px-4 mobile-content">
        {/* Active Projects */}
        {projects && projects.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Active Projects</h2>
            <div className="space-y-3">
              {projects.map(project => (
                <MobileProjectCard
                  key={project.id}
                  project={project}
                  db={db}
                  onUpdate={onUpdate}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Today's Tasks */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Today&apos;s focus</h2>
            {completedToday > 0 && (
              <span className="text-sm text-green-600 font-medium">
                {completedToday} done ✓
              </span>
            )}
          </div>
          
          {todayTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500 mb-4">No tasks yet today</p>
              <button
                onClick={() => setShowSuggestions(true)}
                className="text-blue-600 font-medium"
              >
                Get suggestions →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.slice(0, 5).map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isFirst={index === 0}
                  functions={functions}
                  user={user}
                  userTier={userTier}
                  onComplete={(id) => {
                    setCompletedToday(prev => prev + 1);
                    onTaskComplete(id);
                  }}
                  onDismiss={(id) => {
                    // For now, just remove from list - could implement proper dismiss later
                    console.log('Task dismissed:', id);
                  }}
                  onSnooze={(id, snoozeUntil) => {
                    if (onTaskSnooze) onTaskSnooze(id, snoozeUntil);
                  }}
                  onSetReminder={(id, reminderType) => {
                    if (onTaskReminder) onTaskReminder(id, reminderType);
                  }}
                  onOpenChat={handleOpenChat}
                  onUndo={(id) => {
                    setCompletedToday(prev => Math.max(0, prev - 1));
                    // TODO: Implement undo in parent
                  }}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Planning & Events Section */}
        {user && db && (
          <div className="mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Planning & Events</h3>
              </div>
              <EventReminder
                user={user}
                db={db}
                onTaskAdded={onUpdate}
                compact={true}
              />
            </div>
          </div>
        )}

        {/* AI Mentor Check-In - Replaces old suggestions */}
        <AIMentorCheckIn
          onAddTasks={(newTasks) => {
            newTasks.forEach(task => onTaskAdd(task));
          }}
          onEmergencyMode={() => setShowEmergencyMode(true)}
          currentTasks={todayTasks}
        />
        
        {/* Emergency Mode Button */}
        <button
          onClick={() => setShowEmergencyMode(true)}
          className="w-full py-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 flex items-center justify-center gap-2 active:scale-98 transition-transform mt-4"
        >
          <span className="text-2xl">🚨</span>
          <span className="text-orange-700 font-medium">Emergency Mode</span>
          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">Survival</span>
        </button>
        
        {/* Upcoming events (minimal) */}
        {upcomingEvents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Coming up</h3>
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              {upcomingEvents.slice(0, 2).map((event, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{event.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{event.daysUntil}d</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Task instructions */}
        {todayTasks.length > 0 && (
          <div className="mt-8 text-center text-xs text-gray-400 px-4 space-y-1">
            <p>💡 Tap checkmark to complete • Tap menu (⋯) for options</p>
          </div>
        )}
      </div>
      
      {/* Quick add button */}
      <QuickAddButton onClick={onShowTaskForm} />
      
{/* Old suggestions drawer removed - replaced with AI Mentor Check-In */}

      {/* AI Sidekick Chat */}
      <SidekickChat
        task={selectedTask}
        isVisible={showSidekickChat}
        onClose={handleCloseChat}
        userTier={userTier}
      />

      {/* Emergency Mode */}
      <EmergencyMode
        isOpen={showEmergencyMode}
        onClose={() => setShowEmergencyMode(false)}
      />
    </div>
  );
}