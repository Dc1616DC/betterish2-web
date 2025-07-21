'use client';

import { useState, useTransition } from 'react';

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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      try {
        await onSubmit({
          title: title.trim(),
          detail: detail.trim(),
          category,
          priority
        });
        
        // Reset form
        setTitle('');
        setDetail('');
        setCategory('household');
        setPriority('medium');
        onClose();
      } catch (error) {
        console.error('Error submitting task:', error);
        // Don't close form on error so user can retry
      }
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            type="text"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            disabled={isPending}
            required
          />
          
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows="3"
            placeholder="Any details? (optional)"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            disabled={isPending}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isPending}
              >
                <option value="household">🏠 Household</option>
                <option value="relationship">❤️ Relationship</option>
                <option value="kids">👶 Kids</option>
                <option value="personal">🧘 Personal</option>
                <option value="work">💼 Work</option>
                <option value="health">🏃 Health</option>
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
