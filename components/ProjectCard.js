'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, PauseIcon, CheckCircleIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { updateDoc, doc, Timestamp } from 'firebase/firestore';
import SidekickChat from './SidekickChat';

export default function ProjectCard({ project, db, onUpdate, onComplete, userTier, onUpgradeRequest }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const completedCount = project.subtasks?.filter(st => st.completed).length || 0;
  const totalCount = project.subtasks?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Calculate days since last activity
  const lastActivity = project.lastActivityAt?.toDate() || project.createdAt?.toDate();
  const daysSinceActivity = Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24));
  
  // Status colors
  const statusColor = daysSinceActivity > 7 ? 'text-red-500' : 
                     daysSinceActivity > 3 ? 'text-yellow-500' : 
                     'text-green-500';

  const handleSubtaskToggle = async (subtaskIndex) => {
    if (updating) return;
    setUpdating(true);

    try {
      const updatedSubtasks = [...project.subtasks];
      updatedSubtasks[subtaskIndex].completed = !updatedSubtasks[subtaskIndex].completed;
      updatedSubtasks[subtaskIndex].completedAt = updatedSubtasks[subtaskIndex].completed ? 
        Timestamp.now() : null;

      await updateDoc(doc(db, 'tasks', project.id), {
        subtasks: updatedSubtasks,
        lastActivityAt: Timestamp.now()
      });

      // Check if all subtasks are complete
      const allComplete = updatedSubtasks.every(st => st.completed);
      if (allComplete && onComplete) {
        onComplete(project.id);
      }

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating subtask:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePause = async () => {
    try {
      await updateDoc(doc(db, 'tasks', project.id), {
        projectStatus: project.projectStatus === 'paused' ? 'active' : 'paused',
        lastActivityAt: Timestamp.now()
      });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error pausing project:', error);
    }
  };

  return (
    <div className={`bg-white rounded-lg border ${project.projectStatus === 'paused' ? 'border-gray-200 opacity-60' : 'border-gray-300'} p-4 mb-3`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-grow">
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-gray-400 hover:text-gray-600"
          >
            {expanded ? 
              <ChevronDownIcon className="w-5 h-5" /> : 
              <ChevronRightIcon className="w-5 h-5" />
            }
          </button>
          
          <div className="flex-grow">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <h3 className="font-semibold text-gray-900">{project.title}</h3>
              <span className="text-sm text-gray-500">({completedCount}/{totalCount})</span>
              {daysSinceActivity > 0 && (
                <span className={`text-xs ${statusColor}`}>
                  {daysSinceActivity === 1 ? 'Yesterday' : `${daysSinceActivity}d ago`}
                </span>
              )}
              {project.projectStatus === 'paused' && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Paused</span>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowChat(true)}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Get AI help with this project"
          >
            <ChatBubbleLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handlePause}
            className="text-gray-400 hover:text-gray-600"
            title={project.projectStatus === 'paused' ? 'Resume' : 'Pause'}
          >
            <PauseIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {expanded && project.subtasks && (
        <div className="mt-4 ml-8 space-y-2">
          {project.subtasks.map((subtask, index) => (
            <div key={index} className="flex items-center gap-3">
              <button
                onClick={() => handleSubtaskToggle(index)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  subtask.completed 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'border-gray-300 hover:border-green-400'
                }`}
                disabled={updating}
              >
                {subtask.completed && <CheckIcon className="w-3 h-3" />}
              </button>
              <span className={`text-sm ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {subtask.title}
              </span>
            </div>
          ))}
          
          {completedCount === totalCount && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => onComplete(project.id)}
                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Mark Project Complete
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI Chat - TEMPORARILY DISABLED FOR DEBUGGING */}
      {false && (
        <SidekickChat
          task={{
            id: project.id,
            title: project.title,
            detail: `Project with ${totalCount} steps (${completedCount} completed)`,
            category: 'project',
            subtasks: project.subtasks
          }}
          isVisible={showChat}
          onClose={() => setShowChat(false)}
          userTier={userTier}
          onUpgradeRequest={onUpgradeRequest}
        />
      )}
    </div>
  );
}