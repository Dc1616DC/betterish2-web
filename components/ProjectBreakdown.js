'use client';

import { useState } from 'react';
import { SparklesIcon, XMarkIcon, CheckIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

export default function ProjectBreakdown({ 
  isOpen, 
  onClose, 
  taskTitle, 
  onCreateProject, 
  onCreateSimpleTask 
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customSubtasks, setCustomSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [mode, setMode] = useState('suggest'); // 'suggest' | 'custom' | 'review'

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle })
      });
      
      const data = await response.json();
      setSuggestions(data.subtasks || []);
      setMode('review');
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      setMode('custom');
    } finally {
      setLoading(false);
    }
  };

  const addCustomSubtask = () => {
    if (newSubtask.trim()) {
      setCustomSubtasks([...customSubtasks, newSubtask.trim()]);
      setNewSubtask('');
    }
  };

  const removeCustomSubtask = (index) => {
    setCustomSubtasks(customSubtasks.filter((_, i) => i !== index));
  };

  const handleCreateProject = () => {
    const subtasks = mode === 'review' ? suggestions : customSubtasks;
    if (subtasks.length > 0) {
      onCreateProject({
        title: taskTitle,
        subtasks: subtasks.map(title => ({ 
          id: Date.now() + Math.random(),
          title, 
          completed: false,
          completedAt: null
        }))
      });
      onClose();
    }
  };

  const handleCreateSimple = () => {
    onCreateSimpleTask({ title: taskTitle });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Create Task or Project?</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="font-medium text-blue-900">"{taskTitle}"</p>
          <p className="text-sm text-blue-700 mt-1">
            This looks like it might be a multi-step project. Would you like to break it down?
          </p>
        </div>

        {mode === 'suggest' && (
          <div className="space-y-4">
            <button
              onClick={generateSuggestions}
              disabled={loading}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Getting AI suggestions...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Get AI Breakdown Suggestions
                </>
              )}
            </button>

            <button
              onClick={() => setMode('custom')}
              className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              I'll create my own steps
            </button>

            <button
              onClick={handleCreateSimple}
              className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Just create a simple task
            </button>
          </div>
        )}

        {mode === 'custom' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Add the steps for this project:</p>
            
            <div className="space-y-2">
              {customSubtasks.map((subtask, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="flex-grow text-sm">{subtask}</span>
                  <button
                    onClick={() => removeCustomSubtask(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <MinusIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a step..."
                className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addCustomSubtask()}
              />
              <button
                onClick={addCustomSubtask}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreateProject}
                disabled={customSubtasks.length === 0}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Project ({customSubtasks.length} steps)
              </button>
              <button
                onClick={() => setMode('suggest')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {mode === 'review' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">AI suggested these steps:</p>
            
            <div className="space-y-2">
              {suggestions.map((subtask, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{subtask}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateProject}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Project ({suggestions.length} steps)
              </button>
              <button
                onClick={() => setMode('custom')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Customize
              </button>
            </div>

            <button
              onClick={handleCreateSimple}
              className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              Actually, just create a simple task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}