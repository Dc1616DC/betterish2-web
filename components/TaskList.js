'use client';

import { useState, useTransition, useMemo, useCallback, memo } from 'react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useDebounceCallback } from '@/hooks/useDebounce';
import { updateDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import TaskBreakdown from './TaskBreakdown';

const TaskList = memo(function TaskList({ 
  tasks, 
  db, 
  user, 
  onTaskUpdate,
  onTaskDelete,
  onTaskComplete,
  loading = false 
}) {
  const [isPending, startTransition] = useTransition();
  const [processingTasks, setProcessingTasks] = useState(new Set());
  const [breakdownTask, setBreakdownTask] = useState(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState(new Map()); // Track recently completed for undo

  const handleTaskAction = useCallback(async (taskId, action, taskData = null) => {
    if (processingTasks.has(taskId)) return; // Prevent double-clicks
    
    // Processing task action
    setProcessingTasks(prev => new Set(prev).add(taskId));
    
    try {
      // Use optimistic updates for immediate UI feedback
      switch (action) {
        case 'complete':
          // Auth and DB guard - crucial for Firebase v9
          if (!user || !user.uid || !db) {
            console.error('[TASK] Cannot complete task: missing auth or db', { 
              user: !!user, 
              uid: user?.uid, 
              db: !!db 
            });
            return;
          }
          
          console.log(`[TASK] Starting completion of task ${taskId} for user ${user.uid}`);
          
          // Debug logging
          // Attempting to complete task
          
          // FIRST: Check if document exists before trying to update
          const completeTaskRef = doc(db, 'tasks', taskId);
          const completeTaskDoc = await getDoc(completeTaskRef);
          
          if (!completeTaskDoc.exists()) {
            // Document doesn't exist - removing from UI
            // Document doesn't exist, just remove from UI via optimistic update
            if (onTaskComplete) {
              onTaskComplete(taskId);
            }
            break;
          }
          
          // Optimistic update first
          if (onTaskComplete) {
            onTaskComplete(taskId);
          }
          
          await updateDoc(completeTaskRef, {
            completed: true,
            completedAt: new Date()
          })
            .catch(error => {
              // Firestore update error
              throw error;
            });
          // Task marked as completed
          break;
          
        case 'snooze':
          // Auth guard
          if (!user || !user.uid) {
            // No authenticated user for snooze operation
            return;
          }
          
          // FIRST: Check if document exists before trying to update
          const snoozeTaskRef = doc(db, 'tasks', taskId);
          const snoozeTaskDoc = await getDoc(snoozeTaskRef);
          
          if (!snoozeTaskDoc.exists()) {
            console.log(`[TaskList] ⚠️ Document ${taskId} doesn't exist - cannot snooze non-existent task`);
            // Document doesn't exist, just remove from UI
            if (onTaskDelete) {
              onTaskDelete(taskId);
            }
            break;
          }
          
          const snoozeTime = new Date();
          snoozeTime.setHours(snoozeTime.getHours() + 1);
          await updateDoc(snoozeTaskRef, {
            snoozedUntil: Timestamp.fromDate(snoozeTime),
          });
          // Task snoozed successfully
          break;
          
        case 'delete':
          // Auth guard - crucial for Firebase v9
          if (!user || !user.uid) {
            // No authenticated user for delete operation
            return;
          }
          
          // Debug logging with full task data
          // Attempting to soft-delete task
          
          // FIRST: Check if document exists before trying to update
          const taskRef = doc(db, 'tasks', taskId);
          const taskDoc = await getDoc(taskRef);
          
          if (!taskDoc.exists()) {
            // Document doesn't exist - removing from UI
            // Document doesn't exist, just remove from UI
            if (onTaskDelete) {
              onTaskDelete(taskId);
            }
            break;
          }
          
          // SOFT DELETE: Mark as deleted instead of hard deleting
          await updateDoc(taskRef, {
            deleted: true,
            deletedAt: new Date()
          })
            .catch(error => {
              // Firestore update error
              throw error;
            });
          // Task soft-deleted successfully
          if (onTaskDelete) {
            onTaskDelete(taskId);
          }
          break;
      }
      
      // Only refresh for snooze actions, not for complete (handled by optimistic update)
      if (action === 'snooze' && onTaskUpdate) {
        startTransition(() => {
          setTimeout(() => {
            onTaskUpdate();
          }, 200);
        });
      }
    } catch (error) {
      // Error processing task action
    } finally {
      setProcessingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  }, [db, user, onTaskUpdate, onTaskDelete, onTaskComplete, processingTasks]);

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
            onAction={(taskId, action) => debouncedHandleTaskAction(taskId, action, task)}
            onBreakdown={(task) => setBreakdownTask(task)}
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
            debouncedHandleTaskAction(taskId, 'complete', breakdownTask);
          }}
          onClose={() => setBreakdownTask(null)}
        />
      )}
    </>
  );
});

const TaskItem = memo(function TaskItem({ task, onAction, onBreakdown, isProcessing }) {
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
                {task.category}
              </span>
            )}
            {task.priority && (
              <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                isCompleted ? 'bg-gray-100 text-gray-500' :
                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {task.priority}
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
