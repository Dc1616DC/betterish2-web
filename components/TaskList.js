'use client';

import { useState, useTransition } from 'react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';

export default function TaskList({ 
  tasks, 
  db, 
  user, 
  onTaskUpdate,
  onTaskDelete,
  loading = false 
}) {
  const [isPending, startTransition] = useTransition();
  const [processingTasks, setProcessingTasks] = useState(new Set());

  const handleTaskAction = async (taskId, action) => {
    if (processingTasks.has(taskId)) return; // Prevent double-clicks
    
    setProcessingTasks(prev => new Set(prev).add(taskId));
    
    try {
      startTransition(async () => {
        switch (action) {
          case 'complete':
            await updateDoc(doc(db, 'tasks', taskId), {
              completed: true,
              completedAt: Timestamp.now(),
            });
            if (onTaskUpdate) onTaskUpdate();
            break;
            
          case 'snooze':
            const snoozeTime = new Date();
            snoozeTime.setHours(snoozeTime.getHours() + 1);
            await updateDoc(doc(db, 'tasks', taskId), {
              snoozedUntil: Timestamp.fromDate(snoozeTime),
            });
            if (onTaskUpdate) onTaskUpdate();
            break;
            
          case 'delete':
            await deleteDoc(doc(db, 'tasks', taskId));
            if (onTaskDelete) onTaskDelete(taskId);
            break;
        }
      });
    } catch (error) {
      console.error(`Error ${action}ing task:`, error);
    } finally {
      setProcessingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

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
    <div className="space-y-4">
      {tasks.map(task => (
        <TaskItem 
          key={task.id}
          task={task}
          onAction={handleTaskAction}
          isProcessing={processingTasks.has(task.id)}
        />
      ))}
    </div>
  );
}

function TaskItem({ task, onAction, isProcessing }) {
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

  return (
    <div
      className={`relative rounded-lg border-2 transition-all duration-200 ${getBackgroundColor()} ${
        isProcessing ? 'opacity-50' : ''
      }`}
      style={{
        transform: `translateX(${swipeGesture.swipeDistance}px)`,
      }}
      {...swipeGesture.handlers}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">
            {task.title}
          </h3>
          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
            {getTaskAgeLabel(task.createdAt)}
          </span>
        </div>
        
        {task.detail && (
          <p className="text-gray-600 text-sm mb-3">
            {task.detail}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {task.category && (
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {task.category}
              </span>
            )}
            {task.priority && (
              <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {task.priority}
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
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
        </div>
      </div>
      
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}
