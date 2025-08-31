/**
 * AI Mentor Daily Check-In Component
 * Conversational interface for smart task guidance
 */

'use client';

import { useState, useEffect } from 'react';
import { SparklesIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

export default function AIMentorCheckIn({ onAddTasks, onEmergencyMode, currentTasks = [] }) {
  const [user] = useAuthState(auth);
  const [checkInResponse, setCheckInResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  // Check if user has already checked in today
  useEffect(() => {
    const lastCheckIn = localStorage.getItem('lastCheckIn');
    const today = new Date().toDateString();
    setHasCheckedInToday(lastCheckIn === today);
  }, []);

  const performCheckIn = async (action = 'check_in', taskTitle = null) => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          action,
          taskTitle
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCheckInResponse(data);
        setIsExpanded(true);
        
        // Mark as checked in today
        localStorage.setItem('lastCheckIn', new Date().toDateString());
        setHasCheckedInToday(true);
      } else {
        throw new Error('Check-in failed');
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      // Show fallback response
      setCheckInResponse({
        message: "Hey, things are a bit wonky on our end. How's it going?",
        type: 'fallback',
        suggestions: [],
        actions: [
          { type: 'manual_add', label: 'Add something myself' },
          { type: 'skip_checkin', label: 'I&apos;m good, thanks' }
        ]
      });
      setIsExpanded(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    switch (action.type) {
      case 'emergency_mode':
        onEmergencyMode();
        break;
      
      case 'add_suggestion':
        if (checkInResponse?.suggestions?.length > 0) {
          onAddTasks(checkInResponse.suggestions);
        }
        break;
      
      case 'manual_add':
        // Trigger task form
        break;
      
      case 'break_down':
        const taskToBreak = currentTasks.find(t => t.title.length > 50) || currentTasks[0];
        if (taskToBreak) {
          await performCheckIn('break_down', taskToBreak.title);
        }
        break;
      
      case 'skip_checkin':
        setIsExpanded(false);
        setCheckInResponse(null);
        break;
      
      default:
        console.log('Unhandled action:', action.type);
    }
  };

  if (!isExpanded && !hasCheckedInToday) {
    // Check-in trigger button
    return (
      <div className="mb-6">
        <button
          onClick={() => performCheckIn()}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 flex items-center justify-center gap-3 active:scale-98 transition-all hover:from-blue-100 hover:to-indigo-100"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          ) : (
            <>
              <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-blue-600" />
              <span className="text-blue-700 font-medium">What&apos;s up today?</span>
              <SparklesIcon className="w-4 h-4 text-blue-500" />
            </>
          )}
        </button>
      </div>
    );
  }

  if (!checkInResponse) return null;

  return (
    <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* AI Response */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">AI</span>
          </div>
          <div className="flex-1">
            <p className="text-gray-900 font-medium mb-2">
              {checkInResponse.message}
            </p>
            
            {/* Show suggestions if any */}
            {checkInResponse.suggestions && checkInResponse.suggestions.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600 font-medium">Suggestions:</p>
                {checkInResponse.suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{suggestion.title}</span>
                      {suggestion.isEssential && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          Essential
                        </span>
                      )}
                      {suggestion.isSeasonal && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                          Seasonal
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{suggestion.detail}</p>
                    {suggestion.timeEstimate && (
                      <p className="text-xs text-gray-500 mt-1">{suggestion.timeEstimate}</p>
                    )}
                    {suggestion.prevents && (
                      <p className="text-xs text-orange-600 mt-1">Prevents: {suggestion.prevents}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {checkInResponse.actions && checkInResponse.actions.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {checkInResponse.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collapse button */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setIsExpanded(false)}
          className="w-full text-center py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
        >
          Collapse
        </button>
      </div>
    </div>
  );
}

// Sub-component for task breakdown display
function TaskBreakdown({ breakdown, taskTitle }) {
  if (!breakdown) return null;

  return (
    <div className="bg-blue-50 rounded-lg p-4 mt-3">
      <h4 className="font-medium text-blue-900 mb-3">Breaking down: &quot;{taskTitle}&quot;</h4>
      
      {breakdown.today && (
        <div className="mb-3">
          <h5 className="text-sm font-medium text-blue-800 mb-2">Today:</h5>
          <div className="space-y-1">
            {breakdown.today.map((step, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-blue-900">{step.title}</span>
                <span className="text-blue-600">{step.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {breakdown.thisWeekend && (
        <div className="mb-3">
          <h5 className="text-sm font-medium text-blue-800 mb-2">This Weekend:</h5>
          <div className="space-y-1">
            {breakdown.thisWeekend.map((step, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-blue-900">{step.title}</span>
                <span className="text-blue-600">{step.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {breakdown.nextWeekend && (
        <div className="mb-3">
          <h5 className="text-sm font-medium text-blue-800 mb-2">Next Weekend:</h5>
          <div className="space-y-1">
            {breakdown.nextWeekend.map((step, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-blue-900">{step.title}</span>
                <span className="text-blue-600">{step.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {breakdown.suggestion && (
        <p className="text-blue-800 text-sm italic mt-3">{breakdown.suggestion}</p>
      )}
    </div>
  );
}