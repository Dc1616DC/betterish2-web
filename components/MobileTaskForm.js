'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const CATEGORY_OPTIONS = [
  { value: 'personal', label: '🧘 Personal', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'household', label: '🏠 Household', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'baby', label: '👶 Kids', color: 'bg-amber-100 text-amber-700' },
  { value: 'relationship', label: '❤️ Partner', color: 'bg-rose-100 text-rose-700' },
  { value: 'home_projects', label: '🔨 Projects', color: 'bg-orange-100 text-orange-700' },
  { value: 'health', label: '🏥 Health', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'events', label: '🎉 Events', color: 'bg-purple-100 text-purple-700' },
  { value: 'maintenance', label: '⚙️ Maintenance', color: 'bg-slate-100 text-slate-700' },
];

export default function MobileTaskForm({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('personal');
  const [priority, setPriority] = useState('medium');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onSubmit({
      title: title.trim(),
      category,
      priority,
      createdAt: new Date()
    });
    
    // Reset form
    setTitle('');
    setCategory('personal');
    setPriority('medium');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />
      
      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-xl z-50 animate-slide-up max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between py-4 px-5 border-b flex-shrink-0">
            <h2 className="text-lg font-semibold">Quick add task</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 pb-8">
            {/* Task input */}
            <div className="py-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full text-lg px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>
            
            {/* Category selection - horizontal scroll */}
            <div className="pb-4">
              <p className="text-sm text-gray-600 mb-3">Category</p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
                {CATEGORY_OPTIONS.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                      transition-all flex-shrink-0
                      ${category === cat.value 
                        ? cat.color + ' ring-2 ring-offset-2 ring-blue-500' 
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Priority selection - simple */}
            <div className="pb-4">
              <p className="text-sm text-gray-600 mb-3">Priority</p>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`
                      flex-1 py-3 rounded-xl font-medium capitalize
                      transition-all
                      ${priority === p 
                        ? p === 'high' 
                          ? 'bg-red-100 text-red-700 ring-2 ring-red-500' 
                          : p === 'medium'
                          ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500'
                          : 'bg-green-100 text-green-700 ring-2 ring-green-500'
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Submit button - Fixed at bottom */}
          <div className="p-5 border-t bg-white flex-shrink-0">
            <button
              type="submit"
              disabled={!title.trim()}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition-transform"
            >
              Add task
            </button>
          </div>
        </form>
      </div>
    </>
  );
}