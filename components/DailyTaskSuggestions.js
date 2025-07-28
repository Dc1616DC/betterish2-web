'use client';

import { useState, useEffect } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { getSmartDailySuggestions } from '@/lib/smartSuggestions';

export default function DailyTaskSuggestions({ 
  user, 
  db, 
  userHistory, 
  userPreferences, 
  onTaskAdded 
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addingTasks, setAddingTasks] = useState(new Set());

  // Check if this is first visit today
  useEffect(() => {
    if (!user) return;

    const lastVisit = localStorage.getItem(`lastVisit_${user.uid}`);
    const today = new Date().toDateString();
    const isFirstVisitToday = lastVisit !== today;

    if (isFirstVisitToday) {
      // Generate smart suggestions
      const smartSuggestions = getSmartDailySuggestions(userHistory, userPreferences);
      setSuggestions(smartSuggestions);
      setShowSuggestions(true);
      
      // Mark today as visited
      localStorage.setItem(`lastVisit_${user.uid}`, today);
    }
  }, [user, userHistory, userPreferences]);

  const handleAddTask = async (suggestion, index) => {
    if (!db || addingTasks.has(index)) return;

    setAddingTasks(prev => new Set(prev).add(index));

    try {
      const newTask = {
        title: suggestion.title,
        detail: suggestion.detail,
        category: suggestion.category,
        userId: user.uid,
        createdAt: Timestamp.now(),
        source: 'suggestion',
        dismissed: false,
        deleted: false,
      };

      await addDoc(collection(db, 'tasks'), newTask);
      
      // Remove suggestion from list
      setSuggestions(prev => prev.filter((_, i) => i !== index));
      
      // Notify parent component
      if (onTaskAdded) onTaskAdded();
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch (error) {
      console.error('Error adding suggested task:', error);
    } finally {
      setAddingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const handleDismiss = () => {
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleShowMore = () => {
    // Generate 3 more suggestions
    const moreSuggestions = getSmartDailySuggestions(userHistory, userPreferences);
    setSuggestions(moreSuggestions);
  };

  if (!showSuggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-blue-900">
            🌅 Start Your Day Strong
          </h3>
          <p className="text-sm text-blue-700">
            Smart suggestions based on your patterns
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-blue-400 hover:text-blue-600 text-sm"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="flex items-start justify-between p-3 bg-white border border-blue-100 rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-800">
                  {suggestion.title}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {suggestion.category}
                </span>
              </div>
              
              {suggestion.detail && (
                <p className="text-sm text-gray-600 mb-2">
                  {suggestion.detail}
                </p>
              )}
              
              {suggestion.reason && (
                <p className="text-xs text-blue-600 italic">
                  {suggestion.reason}
                </p>
              )}
            </div>

            <button
              onClick={() => handleAddTask(suggestion, index)}
              disabled={addingTasks.has(index)}
              className="ml-3 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingTasks.has(index) ? '...' : 'Add'}
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4 pt-3 border-t border-blue-100">
        <button
          onClick={handleShowMore}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          🔄 Show different suggestions
        </button>
        <span className="text-blue-300">•</span>
        <button
          onClick={handleDismiss}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          I&apos;m good for today
        </button>
      </div>
    </div>
  );
}