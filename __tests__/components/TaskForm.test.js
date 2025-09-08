/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from '@/components/TaskForm';

// Mock the useTasks hook
const mockCreateTask = jest.fn();
const mockUpdateTask = jest.fn();

jest.mock('@/hooks/useTasks', () => ({
  useTasks: () => ({
    createTask: mockCreateTask,
    updateTask: mockUpdateTask,
  }),
}));

// Mock the TaskService constants
jest.mock('@/lib/services/TaskService', () => ({
  TaskCategory: {
    PERSONAL: 'personal',
    HOUSEHOLD: 'household',
    HOME_PROJECTS: 'home_projects',
    BABY: 'baby',
    RELATIONSHIP: 'relationship',
    HEALTH: 'health',
    EVENTS: 'events',
    MAINTENANCE: 'maintenance',
    WORK: 'work'
  },
  TaskPriority: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  }
}));

// Mock the feature discovery
jest.mock('@/lib/featureDiscovery', () => ({
  trackFeatureUsage: jest.fn(),
  FEATURES: {
    TASK_CREATION: 'task_creation',
  },
}));

describe('TaskForm', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form elements correctly', () => {
    render(
      <TaskForm 
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByPlaceholderText(/what needs to be done/i)).toBeInTheDocument();
    expect(screen.getByText(/add task/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
  });

  test('does not render when not open', () => {
    render(
      <TaskForm 
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByPlaceholderText(/what needs to be done/i)).not.toBeInTheDocument();
  });

  test('creates task with valid input', async () => {
    const user = userEvent.setup();
    mockCreateTask.mockResolvedValueOnce({ id: '1', title: 'Test task' });

    render(
      <TaskForm 
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const submitButton = screen.getByRole('button', { name: /add task/i });

    await user.type(input, 'Test task');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith({
        title: 'Test task',
        description: '',
        category: 'personal',
        priority: 'medium',
      });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('prevents submission with empty input', async () => {
    const user = userEvent.setup();

    render(
      <TaskForm 
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const submitButton = screen.getByRole('button', { name: /add task/i });

    await user.click(submitButton);

    expect(mockCreateTask).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('handles form submission with Enter key', async () => {
    const user = userEvent.setup();
    mockCreateTask.mockResolvedValueOnce({ id: '1', title: 'Test task' });

    render(
      <TaskForm 
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const input = screen.getByPlaceholderText(/what needs to be done/i);

    await user.type(input, 'Test task');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalled();
    });
  });

  test('closes form when cancel is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TaskForm 
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('handles task creation error gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockCreateTask.mockRejectedValueOnce(new Error('Failed to create task'));

    render(
      <TaskForm 
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const submitButton = screen.getByRole('button', { name: /add task/i });

    await user.type(input, 'Test task');
    await user.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Form submission error:', expect.any(Error));
    });

    // Form should not close on error
    expect(mockOnClose).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});