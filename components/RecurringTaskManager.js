'use client';

import { useState } from 'react';
import { PlusIcon, XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { 
  RECURRENCE_TYPES, 
  DAYS_OF_WEEK, 
  DAY_NAMES, 
  DAY_ABBREVIATIONS,
  getRecurrenceDescription,
  SAMPLE_RECURRING_TASKS 
} from '@/lib/recurringTasks';

export default function RecurringTaskManager({ onSave, onClose }) {
  const [task, setTask] = useState({
    title: '',
    detail: '',
    category: 'household',
    priority: 'medium',
    recurrenceType: RECURRENCE_TYPES.WEEKLY,
    weekDay: DAYS_OF_WEEK.MONDAY,
    specificDays: []
  });

  const [showSamples, setShowSamples] = useState(true);

  const handleSave = () => {
    if (!task.title.trim()) return;
    onSave(task);
    setTask({
      title: '',
      detail: '',
      category: 'household',
      priority: 'medium',
      recurrenceType: RECURRENCE_TYPES.WEEKLY,
      weekDay: DAYS_OF_WEEK.MONDAY,
      specificDays: []
    });
  };

  const handleSpecificDayToggle = (day) => {
    setTask(prev => ({
      ...prev,
      specificDays: prev.specificDays.includes(day)
        ? prev.specificDays.filter(d => d !== day)
        : [...prev.specificDays, day].sort()
    }));
  };

  const loadSampleTask = (sampleTask) => {
    setTask({ ...sampleTask });
    setShowSamples(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
              Recurring Task
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {showSamples && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Quick Start Templates</h3>
              <div className="space-y-2">
                {Object.entries(SAMPLE_RECURRING_TASKS).map(([category, tasks]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-blue-700 capitalize mb-1">{category}</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {tasks.map((sampleTask, index) => (
                        <button
                          key={index}
                          onClick={() => loadSampleTask(sampleTask)}
                          className="text-left p-2 bg-white rounded border hover:bg-blue-50 transition-colors"
                        >
                          <div className="font-medium text-sm">{sampleTask.title}</div>
                          <div className="text-xs text-gray-500">{getRecurrenceDescription(sampleTask)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowSamples(false)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                Create custom task instead →
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="What recurring task?"
                value={task.title}
                onChange={(e) => setTask(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <textarea
                placeholder="Add details (optional)"
                value={task.detail}
                onChange={(e) => setTask(prev => ({ ...prev, detail: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={task.category}
                  onChange={(e) => setTask(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="relationship">❤️ Relationship</option>
                  <option value="baby">👶 Baby/Kids</option>
                  <option value="household">🏠 Household</option>
                  <option value="personal">🙋‍♂️ Personal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Needed
                </label>
                <select
                  value={task.priority}
                  onChange={(e) => setTask(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">⚡ Quick (2 min)</option>
                  <option value="medium">⏱️ Medium (10 min)</option>
                  <option value="high">⏳ Longer (20+ min)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                When should this repeat?
              </label>
              <select
                value={task.recurrenceType}
                onChange={(e) => setTask(prev => ({ 
                  ...prev, 
                  recurrenceType: e.target.value,
                  specificDays: [] // Reset specific days when changing type
                }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={RECURRENCE_TYPES.DAILY}>Every day</option>
                <option value={RECURRENCE_TYPES.WEEKDAYS}>Weekdays (Mon-Fri)</option>
                <option value={RECURRENCE_TYPES.WEEKENDS}>Weekends (Sat-Sun)</option>
                <option value={RECURRENCE_TYPES.WEEKLY}>Same day each week</option>
                <option value={RECURRENCE_TYPES.SPECIFIC_DAYS}>Custom days</option>
              </select>
            </div>

            {task.recurrenceType === RECURRENCE_TYPES.WEEKLY && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which day of the week?
                </label>
                <select
                  value={task.weekDay}
                  onChange={(e) => setTask(prev => ({ ...prev, weekDay: parseInt(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(DAY_NAMES).map(([value, name]) => (
                    <option key={value} value={value}>{name}</option>
                  ))}
                </select>
              </div>
            )}

            {task.recurrenceType === RECURRENCE_TYPES.SPECIFIC_DAYS && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select days of the week
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {Object.entries(DAY_ABBREVIATIONS).map(([day, abbr]) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSpecificDayToggle(parseInt(day))}
                      className={`p-2 text-xs rounded border transition-colors ${
                        task.specificDays.includes(parseInt(day))
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {abbr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">
                <strong>This will repeat:</strong> {getRecurrenceDescription(task)}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!task.title.trim()}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save Recurring Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
