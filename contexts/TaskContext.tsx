/**
 * TaskContext - Centralized Task State Management (TypeScript)
 * Replaces scattered useState calls with unified state
 * Provides optimistic updates and error handling
 */

'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useState, ReactNode } from 'react';
import { createTaskService, TaskStatus } from '@/lib/services/TaskService';
import { initializeFirebaseClient } from '@/lib/firebase-client';
import { handleFirebaseError, logError, ErrorTypes } from '@/lib/errorHandler';
import { Task, TaskId, UserId, User, CreateTaskData, UpdateTaskData } from '@/types/models';
import { Firestore } from 'firebase/firestore';

// =============================================
// TYPE DEFINITIONS
// =============================================

interface TaskState {
  allTasks: Task[];
  loading: boolean;
  error: string | null;
  _optimisticHistory?: Array<{
    id: TaskId;
    original: Task;
  }>;
}

interface TaskContextValue {
  // State
  allTasks: Task[];
  activeTasks: Task[];
  completedTasks: Task[];
  projects: Task[];
  pastPromises: Task[];
  loading: boolean;
  error: string | null;
  
  // Basic CRUD
  createTask: (taskData: CreateTaskData) => Promise<Task>;
  updateTask: (taskId: TaskId, updates: UpdateTaskData) => Promise<Task>;
  deleteTask: (taskId: TaskId) => Promise<void>;
  
  // Task actions
  completeTask: (taskId: TaskId) => Promise<Task>;
  uncompleteTask: (taskId: TaskId) => Promise<Task>;
  snoozeTask: (taskId: TaskId, until: Date) => Promise<Task>;
  
  // Bulk actions
  completeTasks: (taskIds: TaskId[]) => Promise<void>;
  archiveTasks: (taskIds: TaskId[]) => Promise<void>;
  
  // Project operations
  convertToProject: (taskId: TaskId, subtasks: any[]) => Promise<Task>;
  addSubtask: (projectId: TaskId, subtaskData: any) => Promise<Task>;
  updateSubtask: (projectId: TaskId, subtaskId: number, updates: any) => Promise<Task>;
  
  // Utility
  loadTasks: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  searchTasks: (query: string) => Promise<Task[]>;
  clearError: () => void;
}

interface TaskProviderProps {
  children: ReactNode;
  user: User | null;
}

// Action types
const TaskActionTypes = {
  // Loading states
  SET_LOADING: 'SET_LOADING' as const,
  SET_ERROR: 'SET_ERROR' as const,
  CLEAR_ERROR: 'CLEAR_ERROR' as const,
  
  // Data operations
  SET_TASKS: 'SET_TASKS' as const, 
  ADD_TASK: 'ADD_TASK' as const,
  UPDATE_TASK: 'UPDATE_TASK' as const,
  REMOVE_TASK: 'REMOVE_TASK' as const,
  
  // Bulk operations
  UPDATE_MULTIPLE_TASKS: 'UPDATE_MULTIPLE_TASKS' as const,
  REMOVE_MULTIPLE_TASKS: 'REMOVE_MULTIPLE_TASKS' as const,
  
  // Optimistic updates
  OPTIMISTIC_UPDATE: 'OPTIMISTIC_UPDATE' as const,
  REVERT_OPTIMISTIC: 'REVERT_OPTIMISTIC' as const
};

type TaskAction = 
  | { type: typeof TaskActionTypes.SET_LOADING; payload: boolean }
  | { type: typeof TaskActionTypes.SET_ERROR; payload: string }
  | { type: typeof TaskActionTypes.CLEAR_ERROR }
  | { type: typeof TaskActionTypes.SET_TASKS; payload: Task[] }
  | { type: typeof TaskActionTypes.ADD_TASK; payload: Task }
  | { type: typeof TaskActionTypes.UPDATE_TASK; payload: Task }
  | { type: typeof TaskActionTypes.REMOVE_TASK; payload: TaskId }
  | { type: typeof TaskActionTypes.UPDATE_MULTIPLE_TASKS; payload: Task[] }
  | { type: typeof TaskActionTypes.REMOVE_MULTIPLE_TASKS; payload: TaskId[] }
  | { type: typeof TaskActionTypes.OPTIMISTIC_UPDATE; payload: { id: TaskId; updates: Partial<Task> } }
  | { type: typeof TaskActionTypes.REVERT_OPTIMISTIC; payload: TaskId };

// =============================================
// CONTEXT SETUP
// =============================================

const TaskContext = createContext<TaskContextValue | null>(null);

export function useTaskContext(): TaskContextValue {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within TaskProvider');
  }
  return context;
}

// =============================================
// STATE REDUCER
// =============================================

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case TaskActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case TaskActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
      
    case TaskActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
      
    case TaskActionTypes.SET_TASKS:
      return { ...state, allTasks: action.payload, loading: false, error: null };
      
    case TaskActionTypes.ADD_TASK:
      return { 
        ...state, 
        allTasks: [action.payload, ...state.allTasks],
        error: null 
      };
      
    case TaskActionTypes.UPDATE_TASK: {
      const updatedTasks = state.allTasks.map(task =>
        task.id === action.payload.id ? { ...task, ...action.payload } : task
      );
      return { ...state, allTasks: updatedTasks };
    }
    
    case TaskActionTypes.REMOVE_TASK: {
      const filteredTasks = state.allTasks.filter(task => task.id !== action.payload);
      return { ...state, allTasks: filteredTasks };
    }
    
    case TaskActionTypes.UPDATE_MULTIPLE_TASKS: {
      const taskUpdates = new Map(action.payload.map(task => [task.id, task]));
      const updatedTasks = state.allTasks.map(task =>
        taskUpdates.has(task.id) ? { ...task, ...taskUpdates.get(task.id)! } : task
      );
      return { ...state, allTasks: updatedTasks };
    }
    
    case TaskActionTypes.REMOVE_MULTIPLE_TASKS: {
      const idsToRemove = new Set(action.payload);
      const filteredTasks = state.allTasks.filter(task => !idsToRemove.has(task.id));
      return { ...state, allTasks: filteredTasks };
    }
    
    case TaskActionTypes.OPTIMISTIC_UPDATE: {
      return {
        ...state,
        allTasks: state.allTasks.map(task =>
          task.id === action.payload.id 
            ? { ...task, ...action.payload.updates, _optimistic: true } as Task
            : task
        ),
        _optimisticHistory: [
          ...(state._optimisticHistory || []),
          { id: action.payload.id, original: state.allTasks.find(t => t.id === action.payload.id)! }
        ]
      };
    }
    
    case TaskActionTypes.REVERT_OPTIMISTIC: {
      const history = state._optimisticHistory || [];
      const revertData = history.find(h => h.id === action.payload);
      if (!revertData) return state;
      
      return {
        ...state,
        allTasks: state.allTasks.map(task =>
          task.id === action.payload ? revertData.original : task
        ),
        _optimisticHistory: history.filter(h => h.id !== action.payload)
      };
    }
    
    default:
      return state;
  }
}

// Initial state
const initialState: TaskState = {
  allTasks: [],
  loading: true,
  error: null,
  _optimisticHistory: []
};

// =============================================
// TASK PROVIDER COMPONENT
// =============================================

export function TaskProvider({ children, user }: TaskProviderProps) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  
  // Initialize Firebase and TaskService
  const [taskService, setTaskService] = useState<any>(null);
  
  useEffect(() => {
    if (user) {
      try {
        const { db } = initializeFirebaseClient();
        const service = createTaskService(db as Firestore);
        setTaskService(service);
      } catch (error) {
        handleFirebaseError(error, {
          operation: 'initializeTaskService',
          component: 'TaskContext'
        });
        dispatch({ type: TaskActionTypes.SET_ERROR, payload: 'Failed to initialize task service' });
      }
    }
  }, [user]);

  // =============================================
  // DERIVED STATE (COMPUTED VALUES)
  // =============================================

  const activeTasks = state.allTasks.filter(task => 
    task.status === TaskStatus.ACTIVE && 
    !task.deleted && 
    !task.dismissed &&
    (!task.snoozedUntil || task.snoozedUntil <= new Date())
  );

  const completedTasks = state.allTasks.filter(task => 
    task.status === TaskStatus.COMPLETED && 
    !task.deleted
  );

  const projects = state.allTasks.filter(task => 
    task.isProject && 
    task.status !== TaskStatus.ARCHIVED && 
    task.status !== TaskStatus.COMPLETED &&
    !task.deleted
  );

  const pastPromises = state.allTasks.filter(task => {
    if (task.status !== TaskStatus.ACTIVE || task.deleted) return false;
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const taskDate = new Date(task.createdAt);
    
    return taskDate < oneDayAgo && taskDate > fourteenDaysAgo;
  });

  // =============================================
  // ACTION CREATORS
  // =============================================

  // Load all tasks
  const loadTasks = useCallback(async (): Promise<void> => {
    if (!taskService || !user) return;

    dispatch({ type: TaskActionTypes.SET_LOADING, payload: true });
    
    try {
      const tasks = await taskService.getTasks(user.uid);
      dispatch({ type: TaskActionTypes.SET_TASKS, payload: tasks });
    } catch (error: any) {
      handleFirebaseError(error, {
        operation: 'loadTasks',
        component: 'TaskContext',
        userId: user.uid
      });
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
    }
  }, [taskService, user]);

  // Create task
  const createTask = useCallback(async (taskData: CreateTaskData): Promise<Task> => {
    if (!taskService || !user) throw new Error('Service not ready');

    try {
      const newTask = await taskService.createTask(user.uid, taskData);
      dispatch({ type: TaskActionTypes.ADD_TASK, payload: newTask });
      return newTask;
    } catch (error: any) {
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [taskService, user]);

  // Update task with optimistic updates
  const updateTask = useCallback(async (taskId: TaskId, updates: UpdateTaskData): Promise<Task> => {
    if (!taskService) throw new Error('Service not ready');

    // Optimistic update
    dispatch({ 
      type: TaskActionTypes.OPTIMISTIC_UPDATE, 
      payload: { id: taskId, updates } 
    });

    try {
      const updatedTask = await taskService.updateTask(taskId, updates);
      dispatch({ type: TaskActionTypes.UPDATE_TASK, payload: updatedTask });
      return updatedTask;
    } catch (error: any) {
      // Revert optimistic update on error
      dispatch({ type: TaskActionTypes.REVERT_OPTIMISTIC, payload: taskId });
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [taskService]);

  // Complete task
  const completeTask = useCallback(async (taskId: TaskId): Promise<Task> => {
    const task = state.allTasks.find(t => t.id === taskId);
    
    // If this is a project with subtasks, preserve the subtask states
    const updateData: UpdateTaskData = {
      status: TaskStatus.COMPLETED,
      completed: true,
      completedAt: new Date()
    };
    
    // Preserve subtasks if they exist (for projects)
    if (task?.subtasks) {
      updateData.subtasks = task.subtasks;
    }
    
    const updatedTask = await updateTask(taskId, updateData);
    
    // Trigger dynamic refresh system for task completion
    try {
      const { dynamicRefresh } = await import('@/lib/dynamicTaskRefresh');
      await dynamicRefresh.handleTaskCompletion(user?.uid || '', task, {
        onTaskCompletionRefresh: (data: any) => {
          // Notify registered callbacks (like Browse section)
          if ((window as any).taskCompletionCallbacks) {
            (window as any).taskCompletionCallbacks.forEach((callback: Function) => callback(data));
          }
        },
        onPatternLearningRefresh: (data: any) => {
          // Show achievement notifications
          console.log('Achievement unlocked:', data.message);
          // Could show toast notification here
        }
      });
    } catch (refreshError) {
      console.error('Error triggering refresh after completion:', refreshError);
    }
    
    return updatedTask;
  }, [updateTask, state.allTasks, user]);

  // Uncomplete task
  const uncompleteTask = useCallback(async (taskId: TaskId): Promise<Task> => {
    return updateTask(taskId, {
      status: TaskStatus.ACTIVE,
      completed: false,
      completedAt: null
    });
  }, [updateTask]);

  // Delete task (archive)
  const deleteTask = useCallback(async (taskId: TaskId): Promise<void> => {
    if (!taskService) throw new Error('Service not ready');

    // Optimistic removal
    dispatch({ type: TaskActionTypes.REMOVE_TASK, payload: taskId });

    try {
      await taskService.deleteTask(taskId);
    } catch (error: any) {
      // Revert by reloading tasks
      await loadTasks();
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [taskService, loadTasks]);

  // Snooze task
  const snoozeTask = useCallback(async (taskId: TaskId, until: Date): Promise<Task> => {
    return updateTask(taskId, {
      status: TaskStatus.SNOOZED,
      snoozedUntil: until
    });
  }, [updateTask]);

  // Bulk complete tasks
  const completeTasks = useCallback(async (taskIds: TaskId[]): Promise<void> => {
    if (!taskService) throw new Error('Service not ready');

    // Optimistic updates
    const updates = taskIds.map(id => ({
      id,
      status: TaskStatus.COMPLETED,
      completed: true,
      completedAt: new Date()
    } as Task));
    dispatch({ type: TaskActionTypes.UPDATE_MULTIPLE_TASKS, payload: updates });

    try {
      await taskService.completeTasks(taskIds);
    } catch (error: any) {
      // Revert by reloading
      await loadTasks();
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [taskService, loadTasks]);

  // Bulk archive tasks  
  const archiveTasks = useCallback(async (taskIds: TaskId[]): Promise<void> => {
    if (!taskService) throw new Error('Service not ready');

    // Optimistic removal
    dispatch({ type: TaskActionTypes.REMOVE_MULTIPLE_TASKS, payload: taskIds });

    try {
      await taskService.archiveTasks(taskIds);
    } catch (error: any) {
      // Revert by reloading
      await loadTasks();
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [taskService, loadTasks]);

  // Project operations
  const convertToProject = useCallback(async (taskId: TaskId, subtasks: any[]): Promise<Task> => {
    if (!taskService) throw new Error('Service not ready');

    try {
      const project = await taskService.convertToProject(taskId, subtasks);
      dispatch({ type: TaskActionTypes.UPDATE_TASK, payload: project });
      return project;
    } catch (error: any) {
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [taskService]);

  const addSubtask = useCallback(async (projectId: TaskId, subtaskData: any): Promise<Task> => {
    if (!taskService) throw new Error('Service not ready');

    try {
      const updatedProject = await taskService.addSubtask(projectId, subtaskData);
      dispatch({ type: TaskActionTypes.UPDATE_TASK, payload: updatedProject });
      return updatedProject;
    } catch (error: any) {
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [taskService]);

  const updateSubtask = useCallback(async (projectId: TaskId, subtaskId: number, updates: any): Promise<Task> => {
    if (!taskService) throw new Error('Service not ready');

    try {
      const updatedProject = await taskService.updateSubtask(projectId, subtaskId, updates);
      dispatch({ type: TaskActionTypes.UPDATE_TASK, payload: updatedProject });
      return updatedProject;
    } catch (error: any) {
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [taskService]);

  // Utility functions
  const clearError = useCallback((): void => {
    dispatch({ type: TaskActionTypes.CLEAR_ERROR });
  }, []);

  const refreshTasks = useCallback(async (): Promise<void> => {
    await loadTasks();
  }, [loadTasks]);

  // Search tasks
  const searchTasks = useCallback(async (query: string): Promise<Task[]> => {
    if (!taskService || !user) return [];

    try {
      return await taskService.searchTasks(user.uid, query);
    } catch (error: any) {
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      return [];
    }
  }, [taskService, user]);

  // Initial load
  useEffect(() => {
    if (taskService && user) {
      loadTasks();
    }
  }, [taskService, user, loadTasks]);

  // =============================================
  // CONTEXT VALUE
  // =============================================

  const contextValue: TaskContextValue = {
    // State
    allTasks: state.allTasks,
    activeTasks,
    completedTasks,
    projects,
    pastPromises,
    loading: state.loading,
    error: state.error,
    
    // Basic CRUD
    createTask,
    updateTask,
    deleteTask,
    
    // Task actions
    completeTask,
    uncompleteTask,
    snoozeTask,
    
    // Bulk actions
    completeTasks,
    archiveTasks,
    
    // Project operations
    convertToProject,
    addSubtask,
    updateSubtask,
    
    // Utility
    loadTasks,
    refreshTasks,
    searchTasks,
    clearError
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
}

export { TaskContext };