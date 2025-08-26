'use client';

import { useState, useEffect } from 'react';
import { ChevronUpIcon, PlusIcon, SparklesIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

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

// Simplified task card for mobile
function TaskCard({ task, onComplete, onAction, isFirst }) {
  const [swiped, setSwiped] = useState(false);
  const colors = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.work;
  
  const handleComplete = () => {
    setSwiped(true);
    setTimeout(() => onComplete(task.id), 300);
  };

  return (
    <div 
      className={`
        relative bg-white rounded-2xl shadow-sm border transition-all duration-300
        ${isFirst ? 'scale-105 shadow-lg' : 'scale-100'}
        ${swiped ? 'translate-x-full opacity-0' : 'translate-x-0'}
      `}
    >
      {/* Color indicator bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.bg} rounded-l-2xl`} />
      
      <div className="pl-4 pr-3 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-grow mr-3">
            <h3 className="font-semibold text-gray-900 text-base leading-tight">
              {task.title}
            </h3>
            {task.detail && (
              <p className="text-sm text-gray-500 mt-1">{task.detail}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs font-medium ${colors.text}`}>
                {task.category.replace('_', ' ')}
              </span>
              {task.priority === 'high' && (
                <span className="text-xs font-medium text-red-600">urgent</span>
              )}
            </div>
          </div>
          
          <button
            onClick={handleComplete}
            className={`
              flex-shrink-0 w-10 h-10 rounded-full border-2 
              ${colors.border} ${colors.light}
              flex items-center justify-center
              active:scale-95 transition-transform
            `}
          >
            <CheckCircleIcon className={`w-6 h-6 ${colors.text}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Minimal header with greeting
function MobileHeader({ greeting, taskCount, streak }) {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  
  return (
    <div className="px-5 pt-safe pb-4">
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
      `}>
        <div className="px-5 pb-safe">
          {/* Handle bar */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-3">Suggested for today</h3>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
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
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{task.detail}</p>
                      <span className={`text-xs font-medium ${colors.text} mt-2 inline-block`}>
                        {task.category.replace('_', ' ')}
                      </span>
                    </div>
                    <PlusIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
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
      className="fixed bottom-20 right-5 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30"
    >
      <PlusIcon className="w-6 h-6" />
    </button>
  );
}

// Main mobile dashboard
export default function MobileDashboard({ 
  tasks = [], 
  suggestions = [], 
  onTaskComplete,
  onTaskAdd,
  onShowTaskForm,
  streak = 0,
  upcomingEvents = []
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [completedToday, setCompletedToday] = useState(0);
  
  // Filter for today's active tasks
  const todayTasks = tasks.filter(t => !t.completed && !t.snoozed);
  
  // Show suggestions hint if < 3 tasks
  const needsMoreTasks = todayTasks.length < 3;

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader 
        greeting="Good morning"
        taskCount={todayTasks.length}
        streak={streak}
      />
      
      {/* Main content area */}
      <div className="px-5 pb-24">
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
                  onComplete={(id) => {
                    setCompletedToday(prev => prev + 1);
                    onTaskComplete(id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Suggestions hint */}
        {needsMoreTasks && !showSuggestions && (
          <button
            onClick={() => setShowSuggestions(true)}
            className="w-full py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 flex items-center justify-center gap-2 active:scale-98 transition-transform"
          >
            <SparklesIcon className="w-5 h-5 text-blue-600" />
            <span className="text-blue-700 font-medium">Get task suggestions</span>
          </button>
        )}
        
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
    </div>
  );
}