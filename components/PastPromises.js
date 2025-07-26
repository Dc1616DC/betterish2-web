'use client';

import { useState, useTransition } from 'react';

export default function PastPromises({ 
  pastPromises, 
  onRestoreTask, 
  onSnoozeTask, 
  onDismissTask 
}) {
  const [isPending, startTransition] = useTransition();
  const [processingTasks, setProcessingTasks] = useState(new Set());

  if (!pastPromises || pastPromises.length === 0) return null;

  const handleTaskAction = async (taskId, action) => {
    if (processingTasks.has(taskId)) return;
    
    setProcessingTasks(prev => new Set(prev).add(taskId));
    
    try {
      startTransition(async () => {
        switch (action) {
          case 'restore':
            await onRestoreTask(taskId);
            break;
          case 'snooze':
            await onSnoozeTask(taskId);
            break;
          case 'dismiss':
            await onDismissTask(taskId);
            break;
        }
      });
    } catch (error) {
      // Error handling for past promise action
    } finally {
      setProcessingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Yesterday&apos;s Promises</h3>
      <p className="text-sm text-gray-500 mb-4">
        Unfinished from yesterday
      </p>
      <ul className="space-y-3">
        {pastPromises.map((task) => (
          <li
            key={task.id}
            className={`p-3 rounded-lg border bg-yellow-50 border-yellow-200 transition-opacity ${
              processingTasks.has(task.id) ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <span className="font-medium text-gray-800">{task.title}</span>
                {task.detail && (
                  <span className="text-sm text-gray-600 block">{task.detail}</span>
                )}
                <span className="text-xs text-gray-400">{task.ageLabel}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleTaskAction(task.id, 'restore')}
                  disabled={processingTasks.has(task.id)}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {processingTasks.has(task.id) ? '...' : 'Today'}
                </button>
                <button
                  onClick={() => handleTaskAction(task.id, 'snooze')}
                  disabled={processingTasks.has(task.id)}
                  className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {processingTasks.has(task.id) ? '...' : 'Snooze'}
                </button>
                <button
                  onClick={() => handleTaskAction(task.id, 'dismiss')}
                  disabled={processingTasks.has(task.id)}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {processingTasks.has(task.id) ? '...' : 'Dismiss'}
                </button>
              </div>
            </div>
            
            {processingTasks.has(task.id) && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                <span>Processing...</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
