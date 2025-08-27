'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { updateDoc, doc, Timestamp } from 'firebase/firestore';

export default function MobileProjectCard({ project, db, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Safe handling of subtasks
  const subtasks = project.subtasks || [];
  const completedCount = subtasks.filter(st => st && st.completed).length;
  const totalCount = subtasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleSubtaskToggle = async (subtaskIndex) => {
    if (updating || !db) return;
    setUpdating(true);

    try {
      const updatedSubtasks = [...subtasks];
      updatedSubtasks[subtaskIndex] = {
        ...updatedSubtasks[subtaskIndex],
        completed: !updatedSubtasks[subtaskIndex].completed,
        completedAt: !updatedSubtasks[subtaskIndex].completed ? Timestamp.now() : null
      };

      await updateDoc(doc(db, 'tasks', project.id), {
        subtasks: updatedSubtasks,
        lastActivityAt: Timestamp.now()
      });

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating subtask:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Project Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            )}
            <h3 className="font-semibold text-gray-900 flex-1">{project.title}</h3>
          </div>
          <span className="text-xs text-gray-500">{completedCount}/{totalCount}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </button>

      {/* Expandable Subtasks */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4">
          {subtasks.length > 0 ? (
            <div className="space-y-2 mt-3">
              {subtasks.map((subtask, index) => (
                <button
                  key={subtask.id || index}
                  onClick={() => handleSubtaskToggle(index)}
                  disabled={updating}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                >
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${subtask.completed 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-300 bg-white'
                    }
                  `}>
                    {subtask.completed && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={`
                    text-sm flex-1
                    ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'}
                  `}>
                    {subtask.title || `Subtask ${index + 1}`}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-3">No subtasks defined</p>
          )}
        </div>
      )}
    </div>
  );
}