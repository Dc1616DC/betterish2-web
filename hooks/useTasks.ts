/**
 * useTasks - Main hook for task operations
 * Provides all task CRUD operations and state
 */

'use client';

import { useTaskContext } from '@/contexts/TaskContext';

export function useTasks() {
  const context = useTaskContext();
  
  if (!context) {
    throw new Error('useTasks must be used within TaskProvider');
  }
  
  return {
    // State
    tasks: context.activeTasks, // Deprecated - use activeTasks instead
    activeTasks: context.activeTasks,
    completedTasks: context.completedTasks,
    projects: context.projects,
    pastPromises: context.pastPromises,
    allTasks: context.allTasks,
    loading: context.loading,
    error: context.error,
    
    // Actions
    createTask: context.createTask,
    updateTask: context.updateTask,
    deleteTask: context.deleteTask,
    completeTask: context.completeTask,
    uncompleteTask: context.uncompleteTask,
    snoozeTask: context.snoozeTask,
    
    // Bulk actions
    completeTasks: context.completeTasks,
    archiveTasks: context.archiveTasks,
    
    // Project operations
    convertToProject: context.convertToProject,
    addSubtask: context.addSubtask,
    updateSubtask: context.updateSubtask,
    
    // Utility
    refreshTasks: context.refreshTasks,
    searchTasks: context.searchTasks,
    clearError: context.clearError
  };
}

export default useTasks;