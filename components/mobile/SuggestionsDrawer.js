'use client';

import { PlusIcon } from '@heroicons/react/24/outline';

// Category color system for visual clarity
const CATEGORY_COLORS = {
  personal: { bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  relationship: { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  baby: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  household: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  home_projects: { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  health: { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  events: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  maintenance: { bg: 'bg-slate-500', light: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  work: { bg: 'bg-gray-500', light: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
};

export default function SuggestionsDrawer({ isOpen, onClose, suggestions, onAddTask, currentTaskCount }) {
  // Only show if user has < 3 tasks
  const shouldShowSuggestions = currentTaskCount < 3;
  
  if (!shouldShowSuggestions) return null;
  
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div className={`
        fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-xl z-50
        transform transition-transform duration-300
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      `}
      style={{ 
        maxHeight: 'calc(85vh - env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
      >
        <div className="flex flex-col h-full">
          {/* Handle bar */}
          <div className="flex justify-center py-3 flex-shrink-0">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
          
          <div className="px-5 flex-1 flex flex-col">
            <h3 className="font-semibold text-gray-900 mb-3 flex-shrink-0">Suggested for today</h3>
            
            <div className="space-y-3 flex-1 overflow-y-auto -webkit-overflow-scrolling-touch pb-4">
            {suggestions.map((task, index) => {
              const colors = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.work;
              return (
                <button
                  key={index}
                  onClick={() => {
                    onAddTask(task);
                    onClose();
                  }}
                  className="w-full text-left p-4 bg-gray-50 rounded-xl active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start">
                    <div className={`w-1 h-12 ${colors.bg} rounded-full mr-3 flex-shrink-0`} />
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        {task.isEssential && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                            Essential
                          </span>
                        )}
                        {task.isSeasonal && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                            Seasonal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{task.detail}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs font-medium ${colors.text}`}>
                          {task.category.replace('_', ' ')}
                        </span>
                        {task.timeEstimate && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{task.timeEstimate}</span>
                          </>
                        )}
                        {task.prevents && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-600">Prevents {task.prevents}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <PlusIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}