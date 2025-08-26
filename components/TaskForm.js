'use client';

import { useState, useTransition } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export default function TaskForm({
  isOpen,
  onClose,
  onSubmit,
  initialTitle = '',
  initialDetail = '',
  initialCategory = 'household',
  initialPriority = 'medium'
}) {
  const [title, setTitle] = useState(initialTitle);
  const [detail, setDetail] = useState(initialDetail);
  const [category, setCategory] = useState(initialCategory);
  const [priority, setPriority] = useState(initialPriority);
  const [isPending, startTransition] = useTransition();
  const [validationErrors, setValidationErrors] = useState({});
  const { error, handleAsync, clearError } = useErrorHandler();

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};
    
    if (!title.trim()) {
      errors.title = 'Task title is required';
    } else if (title.trim().length > 100) {
      errors.title = 'Task title must be less than 100 characters';
    }
    
    if (detail.trim().length > 500) {
      errors.detail = 'Task detail must be less than 500 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    if (!validateForm()) return;

    startTransition(async () => {
      await handleAsync(async () => {
        await onSubmit({
          title: title.trim(),
          detail: detail.trim(),
          category,
          priority
        });
        
        // Reset form on success
        setTitle('');
        setDetail('');
        setCategory('household');
        setPriority('medium');
        setValidationErrors({});
        onClose();
      });
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setTitle('');
      setDetail('');
      setCategory('household');
      setPriority('medium');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h3 className="font-semibold text-gray-800 mb-4">Add New Task</h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationErrors.title) {
                  setValidationErrors(prev => ({ ...prev, title: null }));
                }
              }}
              autoFocus
              disabled={isPending}
              maxLength={100}
            />
            {validationErrors.title && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.title}</p>
            )}
          </div>
          
          <div>
            <textarea
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                validationErrors.detail ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              rows="3"
              placeholder="Any details? (optional)"
              value={detail}
              onChange={(e) => {
                setDetail(e.target.value);
                if (validationErrors.detail) {
                  setValidationErrors(prev => ({ ...prev, detail: null }));
                }
              }}
              disabled={isPending}
              maxLength={500}
            />
            {validationErrors.detail && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.detail}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">{detail.length}/500 characters</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isPending}
              >
                <option value="personal">🧘 Personal Time</option>
                <option value="household">🏠 Household</option>
                <option value="home_projects">🔨 Home Projects</option>
                <option value="baby">👶 Kids & Baby</option>
                <option value="relationship">❤️ Relationship</option>
                <option value="health">🏥 Health & Medical</option>
                <option value="events">🎉 Events & Celebrations</option>
                <option value="maintenance">⚙️ Maintenance & Annual</option>
                <option value="work">💼 Work</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={isPending}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isPending}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </>
              ) : (
                'Add Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
