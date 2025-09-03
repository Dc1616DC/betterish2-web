/**
 * Tutorial Menu - Allows users to access feature tutorials at any time
 * Shows available tutorials, completion status, and provides quick access
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  AcademicCapIcon,
  XMarkIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  SparklesIcon,
  MicrophoneIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

const AVAILABLE_TUTORIALS = {
  'voice-input': {
    title: 'Voice Input Tutorial',
    description: 'Learn to add tasks and ask questions using voice commands',
    icon: MicrophoneIcon,
    duration: '2 min',
    difficulty: 'Easy'
  },
  'project-breakdown': {
    title: 'Project Breakdown Tutorial',
    description: 'Break complex projects into manageable, actionable steps',
    icon: WrenchScrewdriverIcon,
    duration: '3 min',
    difficulty: 'Easy'
  },
  'morpheus-chat': {
    title: 'AI Mentor Tutorial',
    description: 'Get the most from Morpheus, your proactive dad mentor',
    icon: SparklesIcon,
    duration: '4 min',
    difficulty: 'Easy'
  }
};

export default function TutorialMenu({ isVisible, onClose, onStartTutorial }) {
  const [completedTutorials, setCompletedTutorials] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('completedTutorials') || '[]');
    }
    return [];
  });
  
  const tutorialMenuRef = useRef(null);

  // Auto-scroll to tutorial menu when it opens
  useEffect(() => {
    if (isVisible && tutorialMenuRef.current) {
      tutorialMenuRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [isVisible]);

  const handleStartTutorial = (tutorialKey) => {
    onStartTutorial?.(tutorialKey);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div ref={tutorialMenuRef} className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Feature Tutorials</h2>
              <p className="text-sm text-gray-600">Get better-ish at using these features</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tutorial List */}
        <div className="p-6 space-y-4">
          {Object.entries(AVAILABLE_TUTORIALS).map(([key, tutorial]) => {
            const isCompleted = completedTutorials.includes(key);
            const IconComponent = tutorial.icon;
            
            return (
              <div
                key={key}
                className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200 hover:border-green-300' 
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                {/* Completion badge */}
                {isCompleted && (
                  <div className="absolute top-2 right-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  </div>
                )}

                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <IconComponent className={`w-5 h-5 ${
                      isCompleted ? 'text-green-600' : 'text-blue-600'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{tutorial.title}</h3>
                      {isCompleted && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{tutorial.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span>⏱️ {tutorial.duration}</span>
                      <span>📊 {tutorial.difficulty}</span>
                    </div>

                    <button
                      onClick={() => handleStartTutorial(key)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isCompleted
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <PlayCircleIcon className="w-4 h-4" />
                      {isCompleted ? 'Review Tutorial' : 'Start Tutorial'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 rounded-b-xl">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Master these features to get better-ish at dad life! 🏆
            </p>
            <div className="flex justify-center gap-1">
              {Object.keys(AVAILABLE_TUTORIALS).map((key) => (
                <div
                  key={key}
                  className={`w-2 h-2 rounded-full ${
                    completedTutorials.includes(key) ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {completedTutorials.length} of {Object.keys(AVAILABLE_TUTORIALS).length} completed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}