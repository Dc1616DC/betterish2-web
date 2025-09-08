'use client';

import { useState, useEffect } from 'react';
import { ChevronUpIcon, SparklesIcon, CalendarIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import MobileProjectCard from './MobileProjectCard';
import SidekickChat from './SidekickChat';
import EmergencyMode from './EmergencyMode';
import AIMentorCheckIn from './AIMentorCheckIn';
import dynamic from 'next/dynamic';
import TaskCard from './mobile/TaskCard';
import MobileHeader from './mobile/MobileHeader';
import SuggestionsDrawer from './mobile/SuggestionsDrawer';
import QuickAddButton from './mobile/QuickAddButton';

// Dynamically import EventReminder to prevent lexical declaration issues
const EventReminder = dynamic(() => import('./EventReminder'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-16 bg-gray-100 rounded"></div>
});
import { setTaskReminder, hasActiveReminder, getReminderInfo } from '@/lib/reminders';

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
      
      {/* Suggestions drawer */}
      <SuggestionsDrawer
        isOpen={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        suggestions={suggestions}
        onAddTask={onTaskAdd}
        currentTaskCount={todayTasks.length}
      />

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