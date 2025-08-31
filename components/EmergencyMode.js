'use client';

import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { trackEmergencyMode } from '@/lib/patternTracking';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

const EMERGENCY_TASKS = [
  {
    id: 'emergency_001',
    title: 'Kids fed and safe',
    detail: 'That\'s enough for today',
    category: 'survival',
    completed: false
  },
  {
    id: 'emergency_002', 
    title: 'Order pizza',
    detail: 'No cooking tonight',
    category: 'survival',
    completed: false
  },
  {
    id: 'emergency_003',
    title: 'Early bedtime for everyone',
    detail: 'Including you',
    category: 'survival',
    completed: false
  },
  {
    id: 'emergency_004',
    title: 'Try again tomorrow',
    detail: 'Today was hard, tomorrow is fresh',
    category: 'survival',
    completed: false
  }
];

export default function EmergencyMode({ isOpen, onClose }) {
  const [tasks, setTasks] = useState(EMERGENCY_TASKS);
  const [user] = useAuthState(auth);

  // 🧠 Track when emergency mode is opened
  useEffect(() => {
    if (isOpen && user?.uid) {
      trackEmergencyMode(user.uid);
    }
  }, [isOpen, user?.uid]);

  const toggleTask = (taskId) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    ));
  };

  const completedCount = tasks.filter(t => t.completed).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Emergency Mode</h2>
              <p className="text-sm text-gray-600">Survival mode activated</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Message */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-orange-800 text-sm font-medium mb-2">
            It's okay to have overwhelming days.
          </p>
          <p className="text-orange-700 text-sm">
            Focus only on the essentials below. Everything else can wait.
          </p>
        </div>

        {/* Emergency Tasks */}
        <div className="space-y-3 mb-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`
                flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                ${task.completed 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-white hover:border-orange-200'
                }
              `}
              onClick={() => toggleTask(task.id)}
            >
              <div className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                ${task.completed 
                  ? 'border-green-500 bg-green-500' 
                  : 'border-gray-300 hover:border-orange-400'
                }
              `}>
                {task.completed && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${task.completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                  {task.title}
                </h3>
                <p className={`text-sm ${task.completed ? 'text-green-600' : 'text-gray-600'}`}>
                  {task.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">{completedCount}/4</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Encouragement */}
        {completedCount === 4 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-medium mb-1">🎉 You did it!</p>
            <p className="text-green-700 text-sm">
              That's enough for today. Rest well, tomorrow is a new day.
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-gray-700 text-sm">
              One step at a time. You've got this. 💪
            </p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Close Emergency Mode
        </button>
      </div>
    </div>
  );
}