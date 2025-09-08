/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { TaskProvider, useTaskContext } from '@/contexts/TaskContext';
import { TaskStatus } from '@/lib/services/TaskService';

// Mock Firebase
jest.mock('@/lib/firebase-client', () => ({
  initializeFirebaseClient: jest.fn(() => ({
    app: {},
    auth: {},
    db: { collection: jest.fn(), doc: jest.fn() },
    functions: {},
  })),
}));

// Mock the TaskService
jest.mock('@/lib/services/TaskService', () => ({
  createTaskService: jest.fn(() => ({
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    completeTask: jest.fn(),
  })),
  TaskStatus: {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    SNOOZED: 'snoozed',
    ARCHIVED: 'archived',
  },
}));

// Test component to access the context
const TestComponent = ({ onStateChange }) => {
  const context = useTaskContext();
  
  React.useEffect(() => {
    if (onStateChange) {
      onStateChange(context);
    }
  }, [context, onStateChange]);
  
  return (
    <div data-testid="test-component">
      <span data-testid="task-count">{context.allTasks.length}</span>
      <span data-testid="active-count">{context.activeTasks.length}</span>
      <span data-testid="completed-count">{context.completedTasks.length}</span>
      <span data-testid="loading">{context.loading.toString()}</span>
      <span data-testid="error">{context.error || 'none'}</span>
    </div>
  );
};

const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
};

describe('TaskContext', () => {
  let mockTaskService;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create a fresh mock service for each test
    mockTaskService = {
      getTasks: jest.fn().mockResolvedValue([]),
      createTask: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
      completeTask: jest.fn(),
    };
    
    require('@/lib/services/TaskService').createTaskService.mockReturnValue(mockTaskService);
  });

  test('provides initial state correctly', () => {
    let capturedContext = null;
    
    render(
      <TaskProvider user={mockUser}>
        <TestComponent onStateChange={(ctx) => { capturedContext = ctx; }} />
      </TaskProvider>
    );
    
    expect(capturedContext).not.toBeNull();
    expect(capturedContext.allTasks).toEqual([]);
    expect(capturedContext.activeTasks).toEqual([]);
    expect(capturedContext.completedTasks).toEqual([]);
    expect(capturedContext.loading).toBe(true);
    expect(capturedContext.error).toBeNull();
  });

  test('loads tasks on mount', async () => {
    const mockTasks = [
      { 
        id: '1', 
        title: 'Test Task', 
        status: TaskStatus.ACTIVE,
        completed: false,
        deleted: false,
        dismissed: false,
        createdAt: new Date(),
      },
    ];
    
    mockTaskService.getTasks.mockResolvedValue(mockTasks);
    
    let capturedContext = null;
    
    render(
      <TaskProvider user={mockUser}>
        <TestComponent onStateChange={(ctx) => { capturedContext = ctx; }} />
      </TaskProvider>
    );
    
    await waitFor(() => {
      expect(capturedContext.loading).toBe(false);
    });
    
    expect(mockTaskService.getTasks).toHaveBeenCalledWith('test-user-123');
    expect(capturedContext.allTasks).toEqual(mockTasks);
    expect(capturedContext.activeTasks).toEqual(mockTasks);
  });

  test('filters active tasks correctly', async () => {
    const mockTasks = [
      { 
        id: '1', 
        title: 'Active Task', 
        status: TaskStatus.ACTIVE,
        completed: false,
        deleted: false,
        dismissed: false,
      },
      { 
        id: '2', 
        title: 'Completed Task', 
        status: TaskStatus.COMPLETED,
        completed: true,
        deleted: false,
        dismissed: false,
      },
      { 
        id: '3', 
        title: 'Deleted Task', 
        status: TaskStatus.ACTIVE,
        completed: false,
        deleted: true,
        dismissed: false,
      },
    ];
    
    mockTaskService.getTasks.mockResolvedValue(mockTasks);
    
    let capturedContext = null;
    
    render(
      <TaskProvider user={mockUser}>
        <TestComponent onStateChange={(ctx) => { capturedContext = ctx; }} />
      </TaskProvider>
    );
    
    await waitFor(() => {
      expect(capturedContext.loading).toBe(false);
    });
    
    expect(capturedContext.allTasks).toHaveLength(3);
    expect(capturedContext.activeTasks).toHaveLength(1);
    expect(capturedContext.activeTasks[0].title).toBe('Active Task');
    expect(capturedContext.completedTasks).toHaveLength(1);
    expect(capturedContext.completedTasks[0].title).toBe('Completed Task');
  });

  test('filters projects correctly', async () => {
    const mockTasks = [
      { 
        id: '1', 
        title: 'Regular Task', 
        status: TaskStatus.ACTIVE,
        isProject: false,
        deleted: false,
      },
      { 
        id: '2', 
        title: 'Active Project', 
        status: TaskStatus.ACTIVE,
        isProject: true,
        deleted: false,
      },
      { 
        id: '3', 
        title: 'Completed Project', 
        status: TaskStatus.COMPLETED,
        isProject: true,
        deleted: false,
      },
    ];
    
    mockTaskService.getTasks.mockResolvedValue(mockTasks);
    
    let capturedContext = null;
    
    render(
      <TaskProvider user={mockUser}>
        <TestComponent onStateChange={(ctx) => { capturedContext = ctx; }} />
      </TaskProvider>
    );
    
    await waitFor(() => {
      expect(capturedContext.loading).toBe(false);
    });
    
    // Projects should exclude completed and archived projects
    expect(capturedContext.projects).toHaveLength(1);
    expect(capturedContext.projects[0].title).toBe('Active Project');
  });

  test('creates task successfully', async () => {
    const newTask = {
      id: 'new-task',
      title: 'New Task',
      status: TaskStatus.ACTIVE,
    };
    
    mockTaskService.createTask.mockResolvedValue(newTask);
    
    let capturedContext = null;
    
    render(
      <TaskProvider user={mockUser}>
        <TestComponent onStateChange={(ctx) => { capturedContext = ctx; }} />
      </TaskProvider>
    );
    
    await waitFor(() => {
      expect(capturedContext.loading).toBe(false);
    });
    
    // Create a task
    await act(async () => {
      await capturedContext.createTask({ title: 'New Task' });
    });
    
    expect(mockTaskService.createTask).toHaveBeenCalledWith(
      'test-user-123',
      { title: 'New Task' }
    );
  });

  test('handles errors gracefully', async () => {
    const error = new Error('Failed to load tasks');
    mockTaskService.getTasks.mockRejectedValue(error);
    
    let capturedContext = null;
    
    render(
      <TaskProvider user={mockUser}>
        <TestComponent onStateChange={(ctx) => { capturedContext = ctx; }} />
      </TaskProvider>
    );
    
    await waitFor(() => {
      expect(capturedContext.loading).toBe(false);
    });
    
    expect(capturedContext.error).toBe('Failed to load tasks');
    expect(capturedContext.allTasks).toEqual([]);
  });

  test('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTaskContext must be used within TaskProvider');
    
    console.error = originalError;
  });
});