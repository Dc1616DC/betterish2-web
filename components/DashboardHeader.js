'use client';

import { useState } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import StreakBanner from '@/components/StreakBanner';
import SmartReminders from '@/components/SmartReminders';
import VoiceTaskRecorder from '@/components/VoiceTaskRecorder';

export default function DashboardHeader({
  dateStr,
  greeting,
  user,
  emergencyModeActive,
  onClearEmergencyMode,
  tasks,
  completionHistory,
  onReminderAction,
  loading,
  onRefresh,
  onAddTask,
  onVoiceTasksAdded,
  showMoreOptions,
  onToggleMoreOptions
}) {
  return (
    <>
      {/* Header with date and greeting */}
      <div className="mb-6">
        <h1 className="text-lg text-gray-500 mb-1">{dateStr}</h1>
        <h2 className="text-2xl font-bold text-gray-800">{greeting}</h2>
      </div>

      {/* Streak Banner - Important but subtle */}
      {user?.uid && <StreakBanner userId={user.uid} />}

      {/* Emergency Mode Alert - Only show if active */}
      {emergencyModeActive && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">Emergency Mode Active</span>
          </div>
          <button
            onClick={onClearEmergencyMode}
            className="text-red-600 hover:text-red-800 text-sm transition-colors"
          >
            Exit
          </button>
        </div>
      )}

      {/* Smart Reminders - Only show when relevant */}
      {user?.uid && (
        <SmartReminders
          userId={user.uid}
          tasks={tasks}
          completionHistory={completionHistory}
          onReminderAction={onReminderAction}
        />
      )}

      {/* TODAY'S TASKS HEADER */}
      {!loading && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Today&apos;s Focus</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                title="Refresh all tasks"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onToggleMoreOptions}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                {showMoreOptions ? 'Less' : 'More options'}
              </button>
            </div>
          </div>

          {/* Quick Add - Simple and prominent */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={onAddTask}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Task</span>
            </button>
            
            {user?.uid && (
              <div className="flex-shrink-0">
                <VoiceTaskRecorder
                  userId={user.uid}
                  onTasksAdded={onVoiceTasksAdded}
                  compact={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
