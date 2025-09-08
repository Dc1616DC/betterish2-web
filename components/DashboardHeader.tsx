'use client';

import React, { useState } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, PlusIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import StreakBanner from '@/components/StreakBanner';
import SmartReminders from '@/components/SmartReminders';
import VoiceTaskRecorder from '@/components/VoiceTaskRecorder';
import { Task, User } from '@/types/models';
import { BaseProps } from '@/types/components';

export interface DashboardHeaderProps extends BaseProps {
  dateStr: string;
  greeting: string;
  user: User | null;
  emergencyModeActive?: boolean;
  onClearEmergencyMode?: () => void;
  tasks: Task[];
  completionHistory?: any[]; // Will be typed later when the structure is known
  onReminderAction?: (action: string, data?: any) => void;
  loading?: boolean;
  onRefresh: () => void;
  onAddTask: () => void;
  onVoiceTasksAdded?: (tasks: Task[]) => void;
  showMoreOptions?: boolean;
  onToggleMoreOptions: () => void;
  onLogout?: () => void;
  onCleanupTasks?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  dateStr,
  greeting,
  user,
  emergencyModeActive = false,
  onClearEmergencyMode,
  tasks,
  completionHistory,
  onReminderAction,
  loading = false,
  onRefresh,
  onAddTask,
  onVoiceTasksAdded,
  showMoreOptions = false,
  onToggleMoreOptions,
  onLogout,
  onCleanupTasks,
  className,
  children,
  'data-testid': testId
}) => {
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  const handleUserMenuToggle = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleBackdropClick = () => {
    setShowUserMenu(false);
  };

  const handleCleanupTasks = () => {
    setShowUserMenu(false);
    if (onCleanupTasks) {
      onCleanupTasks();
    }
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className={className} data-testid={testId}>
      {/* Header with date and greeting */}
      <div className="mb-6 relative">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg text-gray-500 mb-1">{dateStr}</h1>
            <h2 className="text-2xl font-bold text-gray-800">{greeting}</h2>
          </div>
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={handleUserMenuToggle}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="User menu"
              aria-label="User menu"
            >
              <UserCircleIcon className="w-8 h-8 text-gray-600" />
            </button>
            
            {showUserMenu && (
              <>
                {/* Backdrop to close menu */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={handleBackdropClick}
                  aria-label="Close menu"
                />
                
                {/* Menu dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  
                  {/* Temporary cleanup button */}
                  <button
                    onClick={handleCleanupTasks}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 text-orange-600 hover:text-orange-700"
                    title="Clean up corrupted template tasks that may be causing errors"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                    <span>🧹 Cleanup Tasks</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
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
          {onClearEmergencyMode && (
            <button
              onClick={onClearEmergencyMode}
              className="text-red-600 hover:text-red-800 text-sm transition-colors"
            >
              Exit
            </button>
          )}
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
                aria-label="Refresh all tasks"
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
                  onTasksAdded={(count: number) => onVoiceTasksAdded?.([])}
                  onTranscriptionComplete={() => {}}
                  onTaskCreate={(task: any) => Promise.resolve()}
                  compact={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
};

export default DashboardHeader;