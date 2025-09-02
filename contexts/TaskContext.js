/**
 * TaskContext - Centralized Task State Management
 * Replaces scattered useState calls with unified state
 * Provides optimistic updates and error handling
 */

'use client';

import { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import { createTaskService, TaskStatus } from '@/lib/services/TaskService';
import { initializeFirebaseClient } from '@/lib/firebase-client';

// =============================================
// CONTEXT SETUP
// =============================================

const TaskContext = createContext(null);

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within TaskProvider');
  }
  return context;
}

// =============================================
// STATE REDUCER
// =============================================

const TaskActionTypes = {
  // Loading states
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Data operations
  SET_TASKS: 'SET_TASKS', 
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  REMOVE_TASK: 'REMOVE_TASK',
  
  // Bulk operations
  UPDATE_MULTIPLE_TASKS: 'UPDATE_MULTIPLE_TASKS',
  REMOVE_MULTIPLE_TASKS: 'REMOVE_MULTIPLE_TASKS',
  
  // Optimistic updates
  OPTIMISTIC_UPDATE: 'OPTIMISTIC_UPDATE',
  REVERT_OPTIMISTIC: 'REVERT_OPTIMISTIC'
};

function taskReducer(state, action) {
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
        taskUpdates.has(task.id) ? { ...task, ...taskUpdates.get(task.id) } : task
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
            ? { ...task, ...action.payload.updates, _optimistic: true }
            : task
        ),
        _optimisticHistory: [
          ...(state._optimisticHistory || []),
          { id: action.payload.id, original: state.allTasks.find(t => t.id === action.payload.id) }
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
const initialState = {
  allTasks: [],
  loading: true,
  error: null,
  _optimisticHistory: []
};

// =============================================
// TASK PROVIDER COMPONENT
// =============================================

export function TaskProvider({ children, user }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  
  // Initialize Firebase and TaskService
  const [taskService, setTaskService] = useState(null);
  
  useEffect(() => {
    if (user) {
      try {
        const { db } = initializeFirebaseClient();
        const service = createTaskService(db);
        setTaskService(service);
      } catch (error) {
        console.error('Failed to initialize TaskService:', error);
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
  const loadTasks = useCallback(async () => {
    if (!taskService || !user) return;

    dispatch({ type: TaskActionTypes.SET_LOADING, payload: true });
    
    try {
      const tasks = await taskService.getTasks(user.uid);
      dispatch({ type: TaskActionTypes.SET_TASKS, payload: tasks });
    } catch (error) {
      console.error('Error loading tasks:', error);
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
    }
  }, [taskService, user]);

  // Create task
  const createTask = useCallback(async (taskData) => {
    if (!taskService || !user) throw new Error('Service not ready');

    try {
      const newTask = await taskService.createTask(user.uid, taskData);
      dispatch({ type: TaskActionTypes.ADD_TASK, payload: newTask });
      return newTask;
    } catch (error) {
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [taskService, user]);

  // Update task with optimistic updates
  const updateTask = useCallback(async (taskId, updates) => {
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
    } catch (error) {
      // Revert optimistic update on error
      dispatch({ type: TaskActionTypes.REVERT_OPTIMISTIC, payload: taskId });
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [taskService]);

  // Complete task
  const completeTask = useCallback(async (taskId) => {
    return updateTask(taskId, {
      status: TaskStatus.COMPLETED,
      completed: true,
      completedAt: new Date()
    });
  }, [updateTask]);

  // Uncomplete task
  const uncompleteTask = useCallback(async (taskId) => {
    return updateTask(taskId, {
      status: TaskStatus.ACTIVE,
      completed: false,
      completedAt: null
    });
  }, [updateTask]);

  // Delete task (archive)
  const deleteTask = useCallback(async (taskId) => {
    if (!taskService) throw new Error('Service not ready');

    // Optimistic removal
    dispatch({ type: TaskActionTypes.REMOVE_TASK, payload: taskId });

    try {
      await taskService.deleteTask(taskId);
    } catch (error) {
      // Revert by reloading tasks
      await loadTasks();
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [taskService, loadTasks]);

  // Snooze task
  const snoozeTask = useCallback(async (taskId, until) => {
    return updateTask(taskId, {
      status: TaskStatus.SNOOZED,
      snoozedUntil: until
    });
  }, [updateTask]);

  // Bulk complete tasks
  const completeTasks = useCallback(async (taskIds) => {
    if (!taskService) throw new Error('Service not ready');

    // Optimistic updates
    const updates = taskIds.map(id => ({
      id,
      status: TaskStatus.COMPLETED,
      completed: true,
      completedAt: new Date()
    }));
    dispatch({ type: TaskActionTypes.UPDATE_MULTIPLE_TASKS, payload: updates });

    try {
      await taskService.completeTasks(taskIds);
    } catch (error) {
      // Revert by reloading
      await loadTasks();
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [taskService, loadTasks]);

  // Bulk archive tasks  
  const archiveTasks = useCallback(async (taskIds) => {
    if (!taskService) throw new Error('Service not ready');

    // Optimistic removal
    dispatch({ type: TaskActionTypes.REMOVE_MULTIPLE_TASKS, payload: taskIds });

    try {
      await taskService.archiveTasks(taskIds);
    } catch (error) {
      // Revert by reloading
      await loadTasks();
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [taskService, loadTasks]);

  // Project operations
  const convertToProject = useCallback(async (taskId, subtasks) => {
    if (!taskService) throw new Error('Service not ready');

    try {
      const project = await taskService.convertToProject(taskId, subtasks);
      dispatch({ type: TaskActionTypes.UPDATE_TASK, payload: project });
      return project;
    } catch (error) {
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [taskService]);

  const addSubtask = useCallback(async (projectId, subtaskData) => {
    if (!taskService) throw new Error('Service not ready');

    try {
      const updatedProject = await taskService.addSubtask(projectId, subtaskData);
      dispatch({ type: TaskActionTypes.UPDATE_TASK, payload: updatedProject });
      return updatedProject;
    } catch (error) {
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [taskService]);

  const updateSubtask = useCallback(async (projectId, subtaskId, updates) => {
    if (!taskService) throw new Error('Service not ready');

    try {
      const updatedProject = await taskService.updateSubtask(projectId, subtaskId, updates);
      dispatch({ type: TaskActionTypes.UPDATE_TASK, payload: updatedProject });
      return updatedProject;
    } catch (error) {
      dispatch({ type: TaskActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [taskService]);

  // Utility functions
  const clearError = useCallback(() => {
    dispatch({ type: TaskActionTypes.CLEAR_ERROR });
  }, []);

  const refreshTasks = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  // Search tasks
  const searchTasks = useCallback(async (query) => {
    if (!taskService || !user) return [];

    try {
      return await taskService.searchTasks(user.uid, query);
    } catch (error) {
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

  const contextValue = {
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