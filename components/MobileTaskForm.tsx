'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { TaskCategory, TaskPriority } from '@/types/models';

interface CategoryOption {
  value: TaskCategory;
  label: string;
  color: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: TaskCategory.PERSONAL, label: '🧘 Personal', color: 'bg-indigo-100 text-indigo-700' },
  { value: TaskCategory.HOUSEHOLD, label: '🏠 Household', color: 'bg-emerald-100 text-emerald-700' },
  { value: TaskCategory.BABY, label: '👶 Kids', color: 'bg-amber-100 text-amber-700' },
  { value: TaskCategory.RELATIONSHIP, label: '❤️ Partner', color: 'bg-rose-100 text-rose-700' },
  { value: TaskCategory.HOME_PROJECTS, label: '🔨 Projects', color: 'bg-orange-100 text-orange-700' },
  { value: TaskCategory.HEALTH, label: '🏥 Health', color: 'bg-cyan-100 text-cyan-700' },
  { value: TaskCategory.EVENTS, label: '🎉 Events', color: 'bg-purple-100 text-purple-700' },
  { value: TaskCategory.MAINTENANCE, label: '⚙️ Maintenance', color: 'bg-slate-100 text-slate-700' },
];

interface NewTaskData {
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  createdAt: Date;
}

interface BaseProps {
  className?: string;
}

interface MobileTaskFormProps extends BaseProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: NewTaskData) => void;
}

export default function MobileTaskForm({ isOpen, onClose, onSubmit }: MobileTaskFormProps) {
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<TaskCategory>(TaskCategory.PERSONAL);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
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
    setCategory(TaskCategory.PERSONAL);
    setPriority(TaskPriority.MEDIUM);
    onClose();
  };

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleCategorySelect = (selectedCategory: TaskCategory) => {
    setCategory(selectedCategory);
  };

  const handlePrioritySelect = (selectedPriority: TaskPriority) => {
    setPriority(selectedPriority);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-25"
        onClick={onClose}
      />
      
      {/* Form Panel - Better mobile positioning */}
      <div 
        className="relative w-full bg-white rounded-t-3xl shadow-xl animate-slide-up"
        style={{ 
          maxHeight: 'calc(90vh - env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <div 
          className="overflow-y-auto -webkit-overflow-scrolling-touch"
          style={{ 
            maxHeight: 'calc(90vh - env(safe-area-inset-bottom))'
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Quick add task</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4">
              {/* Task input */}
              <div className="mb-6">
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="What needs to be done?"
                  className="w-full text-lg px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
              
              {/* Category selection */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleCategorySelect(cat.value)}
                      className={`
                        px-3 py-2 rounded-full text-sm font-medium
                        transition-all
                        ${category === cat.value 
                          ? cat.color + ' ring-2 ring-offset-1 ring-blue-500' 
                          : 'bg-gray-100 text-gray-600'
                        }
                      `}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Priority selection */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">Priority</p>
                <div className="flex gap-2">
                  {[TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePrioritySelect(p)}
                      className={`
                        flex-1 py-3 rounded-xl font-medium capitalize
                        transition-all
                        ${priority === p 
                          ? p === TaskPriority.HIGH 
                            ? 'bg-red-100 text-red-700 ring-2 ring-red-500' 
                            : p === TaskPriority.MEDIUM
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
              
              {/* Submit button */}
              <button
                type="submit"
                disabled={!title.trim()}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition-transform"
              >
                Add task
              </button>
              
              {/* Extra padding for safe area */}
              <div className="h-8" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}