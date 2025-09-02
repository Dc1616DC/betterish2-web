'use client';

import { useState, useCallback, memo } from 'react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useDebounceCallback } from '@/hooks/useDebounce';
import { useTasks } from '@/hooks/useTasks';
import { TaskCategory, TaskPriority } from '@/lib/services/TaskService';
import TaskBreakdown from './TaskBreakdown';

// Helper functions for display labels
function getCategoryLabel(category) {
  const labels = {
    [TaskCategory.PERSONAL]: '🧘 Personal Time',
    [TaskCategory.HOUSEHOLD]: '🏠 Household', 
    [TaskCategory.HOME_PROJECTS]: '🔨 Home Projects',
    [TaskCategory.BABY]: '👶 Kids & Baby',
    [TaskCategory.RELATIONSHIP]: '❤️ Relationship',
    [TaskCategory.HEALTH]: '🏥 Health & Medical',
    [TaskCategory.EVENTS]: '🎉 Events & Celebrations',
    [TaskCategory.MAINTENANCE]: '⚙️ Maintenance & Annual',
    [TaskCategory.WORK]: '💼 Work'
  };
  return labels[category] || category;
}

function getPriorityLabel(priority) {
  const labels = {
    [TaskPriority.LOW]: '🟢 Low',
    [TaskPriority.MEDIUM]: '🟡 Medium', 
    [TaskPriority.HIGH]: '🔴 High'
  };
  return labels[priority] || priority;
}

const TaskList = memo(function TaskList({ 
  tasks, 
  onOpenChat = null,
  loading = false 
}) {
  const [processingTasks, setProcessingTasks] = useState(new Set());
  const [breakdownTask, setBreakdownTask] = useState(null);
  
  // Use our centralized task operations
  const { completeTask, deleteTask, snoozeTask } = useTasks();

  const handleTaskAction = useCallback(async (taskId, action) => {
    if (processingTasks.has(taskId)) return; // Prevent double-clicks
    
    setProcessingTasks(prev => new Set(prev).add(taskId));
    
    try {
      switch (action) {
        case 'complete':
          await completeTask(taskId);
          break;
          
        case 'snooze':
          const snoozeTime = new Date();
          snoozeTime.setHours(snoozeTime.getHours() + 1);
          await snoozeTask(taskId, snoozeTime);
          break;
          
        case 'delete':
          await deleteTask(taskId);
          break;
      }
    } catch (error) {
      console.error('Task action failed:', error);
    } finally {
      setProcessingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  }, [completeTask, deleteTask, snoozeTask, processingTasks]);

  // Debounce task actions to prevent rapid fire clicks
  const debouncedHandleTaskAction = useDebounceCallback(handleTaskAction, 300);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No tasks yet. Add your first task to get started!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {tasks.map(task => (
          <TaskItem 
            key={task.id}
            task={task}
            onAction={debouncedHandleTaskAction}
            onBreakdown={(task) => setBreakdownTask(task)}
            onOpenChat={onOpenChat}
            isProcessing={processingTasks.has(task.id)}
          />
        ))}
      </div>
      
      {/* Task Breakdown Modal */}
      {breakdownTask && (
        <TaskBreakdown
          task={breakdownTask}
          onSubtaskComplete={(taskId) => {
            setBreakdownTask(null);
            debouncedHandleTaskAction(taskId, 'complete');
          }}
          onClose={() => setBreakdownTask(null)}
        />
      )}
    </>
  );
});

const TaskItem = memo(function TaskItem({ task, onAction, onBreakdown, onOpenChat, isProcessing }) {
  const [swipeRevealed, setSwipeRevealed] = useState('');

  const swipeGesture = useSwipeGesture({
    onSwipeRight: () => {
      setSwipeRevealed('complete');
      setTimeout(() => onAction(task.id, 'complete'), 150);
    },
    onSwipeLeft: () => {
      setSwipeRevealed('snooze');
      setTimeout(() => onAction(task.id, 'snooze'), 150);
    },
    onSwipeFarLeft: () => {
      setSwipeRevealed('delete');
      setTimeout(() => onAction(task.id, 'delete'), 150);
    },
    isDisabled: isProcessing,
  });

  const getBackgroundColor = () => {
    if (swipeRevealed === 'complete') return 'bg-green-100 border-green-300';
    if (swipeRevealed === 'snooze') return 'bg-yellow-100 border-yellow-300';
    if (swipeRevealed === 'delete') return 'bg-red-100 border-red-300';
    return 'bg-white border-gray-200';
  };

  const getTaskAgeLabel = (createdAt) => {
    if (!createdAt) return '';
    
    const now = new Date();
    const taskDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const diffInHours = Math.floor((now - taskDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks === 1) return 'Last week';
    return `${diffInWeeks} weeks ago`;
  };

  const isCompleted = task.completed || task.completedAt;

  return (
    <div
      className={`relative rounded-lg border-2 transition-all duration-200 ${getBackgroundColor()} ${
        isProcessing ? 'opacity-50' : ''
      } ${isCompleted ? 'bg-gray-50 border-gray-300' : ''}`}
      style={{
        transform: `translateX(${swipeGesture.swipeDistance}px)`,
      }}
      {...swipeGesture.handlers}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className={`font-semibold text-lg ${
            isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
          }`}>
            {task.title}
          </h3>
          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
            {isCompleted ? '✅ Completed' : getTaskAgeLabel(task.createdAt)}
          </span>
        </div>
        
        {task.detail && (
          <p className={`text-sm mb-3 ${
            isCompleted ? 'text-gray-500 line-through' : 'text-gray-600'
          }`}>
            {task.detail}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {task.category && (
              <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                isCompleted 
                  ? 'bg-gray-100 text-gray-500' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {getCategoryLabel(task.category)}
              </span>
            )}
            {task.priority && (
              <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                isCompleted ? 'bg-gray-100 text-gray-500' :
                task.priority === TaskPriority.HIGH ? 'bg-red-100 text-red-800' :
                task.priority === TaskPriority.MEDIUM ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {getPriorityLabel(task.priority)}
              </span>
            )}
          </div>
          
          {!isCompleted && (
            <div className="flex space-x-2">
              <button
                onClick={() => onBreakdown(task)}
                disabled={isProcessing}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                title="Break down task into steps"
              >
                📋
              </button>
              {onOpenChat && (
                <button
                  onClick={() => onOpenChat(task)}
                  disabled={isProcessing}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                  title="Get AI help with this task"
                >
                  💭
                </button>
              )}
              <button
                onClick={() => onAction(task.id, 'complete')}
                disabled={isProcessing}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
              >
                ✓
              </button>
              <button
                onClick={() => onAction(task.id, 'snooze')}
                disabled={isProcessing}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
              >
                💤
              </button>
              <button
                onClick={() => onAction(task.id, 'delete')}
                disabled={isProcessing}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
              >
                🗑️
              </button>
            </div>
          )}
          
          {isCompleted && (
            <div className="flex space-x-2">
              <span className="text-green-600 text-sm font-medium">
                ✅ Done
              </span>
              <button
                onClick={() => onAction(task.id, 'delete')}
                disabled={isProcessing}
                className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </div>
      
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
});

export default TaskList;
