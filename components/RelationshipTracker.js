'use client';

import { useState, useEffect } from 'react';
import { HeartIcon, ChatBubbleLeftIcon, GiftIcon, ClockIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import RelationshipSuggestionOptions from './RelationshipSuggestionOptions';

export default function RelationshipTracker({ userId, tasks, completionHistory, preferences, compact = false, onSuggestionClick, user, db, onTaskAdded }) {
  const [relationshipStats, setRelationshipStats] = useState({
    lastAppreciationText: null,
    lastDateNight: null,
    lastActOfService: null,
    weeklyScore: 0,
    streak: 0,
    suggestions: []
  });
  const [showSuggestionModal, setShowSuggestionModal] = useState(null);

  useEffect(() => {
    if (!completionHistory || !userId) return;
    
    const calculateRelationshipStats = () => {
      const now = new Date();
      
      // Debug: Log all completion data
      console.log('[RelationshipTracker] All completion history:', completionHistory);
      console.log('[RelationshipTracker] Filtering for relationship tasks...');
      
      const relationshipTasks = completionHistory.filter(task => {
        const isRelationship = task.category === 'relationship';
        const hasCompletion = task.completedAt || task.completed;
        
        console.log(`[RelationshipTracker] Task "${task.title}": category=${task.category}, completedAt=${!!task.completedAt}, completed=${!!task.completed}, isRelationship=${isRelationship}, hasCompletion=${hasCompletion}`);
        
        return isRelationship && hasCompletion;
      });
      
      console.log('[RelationshipTracker] Found relationship tasks:', relationshipTasks);

      // Find last appreciation text (not used anymore but kept for stats)
      const appreciationTasks = relationshipTasks.filter(task => 
        task.title.toLowerCase().includes('text') || 
        task.title.toLowerCase().includes('appreciation') ||
        task.title.toLowerCase().includes('tell') ||
        task.title.toLowerCase().includes('compliment')
      );
      const lastAppreciation = appreciationTasks.length > 0 ? 
        (appreciationTasks[0]?.completedAt?.toDate?.() || new Date(appreciationTasks[0]?.completedAt) || new Date()) : null;

      // Find last date-related task
      const dateTasks = relationshipTasks.filter(task => 
        task.title.toLowerCase().includes('date') || 
        task.title.toLowerCase().includes('plan') ||
        task.title.toLowerCase().includes('time') ||
        task.title.toLowerCase().includes('together') ||
        task.title.toLowerCase().includes('walk')
      );
      const lastDate = dateTasks.length > 0 ? 
        (dateTasks[0]?.completedAt?.toDate?.() || new Date(dateTasks[0]?.completedAt) || new Date()) : null;

      // Find last act of service
      const serviceTasks = relationshipTasks.filter(task => 
        task.title.toLowerCase().includes('clean') || 
        task.title.toLowerCase().includes('help') ||
        task.title.toLowerCase().includes('handle') ||
        task.title.toLowerCase().includes('coffee') ||
        task.title.toLowerCase().includes('dishes') ||
        task.title.toLowerCase().includes('dinner')
      );
      const lastService = serviceTasks.length > 0 ? 
        (serviceTasks[0]?.completedAt?.toDate?.() || new Date(serviceTasks[0]?.completedAt) || new Date()) : null;
      
      console.log('[RelationshipTracker] Last dates:', { lastAppreciation, lastDate, lastService });

      // Calculate weekly score (last 7 days)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklyRelationshipTasks = relationshipTasks.filter(task => {
        const taskDate = task.completedAt?.toDate?.() || new Date(task.completedAt) || null;
        return taskDate && taskDate >= weekAgo;
      });
      
      console.log('[RelationshipTracker] Weekly tasks:', weeklyRelationshipTasks.length, 'tasks since', weekAgo);

      // Calculate streak (consecutive days with relationship tasks)
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        checkDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(checkDate.getTime() + 24 * 60 * 60 * 1000);
        
        const dayTasks = relationshipTasks.filter(task => {
          const completedDate = task.completedAt?.toDate?.() || new Date(task.completedAt) || null;
          return completedDate && completedDate >= checkDate && completedDate < nextDay;
        });
        
        if (dayTasks.length > 0) {
          streak++;
        } else if (i > 0) {
          break; // Break streak if no tasks found and it's not today
        }
      }

      // Generate suggestions based on patterns
      const suggestions = generateRelationshipSuggestions(
        lastAppreciation, 
        lastDate, 
        lastService, 
        preferences
      );

      setRelationshipStats({
        lastAppreciationText: lastAppreciation,
        lastDateNight: lastDate,
        lastActOfService: lastService,
        weeklyScore: weeklyRelationshipTasks.length,
        streak,
        suggestions
      });
    };

    calculateRelationshipStats();
  }, [completionHistory, userId, preferences]);

  const generateRelationshipSuggestions = (lastText, lastDate, lastService, prefs) => {
    const now = new Date();
    const suggestions = [];
    const partnerName = prefs?.partnerName || 'your partner';


    // Date suggestions
    if (!lastDate || (now - lastDate) / (1000 * 60 * 60 * 24) >= 14) {
      suggestions.push({
        type: 'date',
        title: 'Plan quality time together',
        urgency: 'high',
        icon: HeartIcon
      });
    }

    // Service suggestions
    if (!lastService || (now - lastService) / (1000 * 60 * 60 * 24) >= 3) {
      suggestions.push({
        type: 'service',
        title: 'Do something helpful without being asked',
        urgency: 'medium',
        icon: GiftIcon
      });
    }

    return suggestions;
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return 'A while ago';
  };

  const getScoreColor = (score) => {
    if (score >= 5) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStreakMessage = (streak) => {
    if (streak >= 7) return `🔥 ${streak}-day streak! You're a relationship champion!`;
    if (streak >= 3) return `💪 ${streak} days strong! Keep it up!`;
    if (streak >= 1) return `🌱 ${streak} day streak started!`;
    return "💡 Start a relationship task streak today!";
  };

  return (
    <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <HeartIconSolid className="w-5 h-5 text-pink-600" />
        <h3 className="font-semibold text-pink-800">Relationship Dashboard</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white bg-opacity-50 rounded-lg p-3">
          <div className="text-xs text-pink-600 font-medium">Weekly Score</div>
          <div className={`text-lg font-bold ${getScoreColor(relationshipStats.weeklyScore)}`}>
            {relationshipStats.weeklyScore}/7
          </div>
        </div>
        <div className="bg-white bg-opacity-50 rounded-lg p-3">
          <div className="text-xs text-pink-600 font-medium">Streak</div>
          <div className="text-lg font-bold text-pink-700">
            {relationshipStats.streak} days
          </div>
        </div>
      </div>

      {/* Streak Message */}
      <div className="bg-white bg-opacity-50 rounded-lg p-3 mb-4">
        <p className="text-sm text-pink-700 font-medium">
          {getStreakMessage(relationshipStats.streak)}
        </p>
      </div>

      {/* Last Actions */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-pink-700">Last appreciation text:</span>
          <span className="text-pink-600 font-medium">
            {formatTimeAgo(relationshipStats.lastAppreciationText)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-pink-700">Last quality time:</span>
          <span className="text-pink-600 font-medium">
            {formatTimeAgo(relationshipStats.lastDateNight)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-pink-700">Last act of service:</span>
          <span className="text-pink-600 font-medium">
            {formatTimeAgo(relationshipStats.lastActOfService)}
          </span>
        </div>
      </div>

      {/* Suggestions */}
      {relationshipStats.suggestions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-pink-700 mb-2">Quick Actions:</h4>
          <div className="space-y-2">
            {relationshipStats.suggestions.map((suggestion, index) => {
              const IconComponent = suggestion.icon;
              return (
                <button
                  key={index}
                  onClick={() => setShowSuggestionModal(suggestion)}
                  className={`flex items-center gap-2 text-sm p-2 rounded-lg w-full text-left transition-colors hover:opacity-80 ${
                    suggestion.urgency === 'high' 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-white bg-opacity-50 text-pink-700 hover:bg-white hover:bg-opacity-70'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{suggestion.title}</span>
                  <span className="ml-auto text-xs opacity-70">⚡</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {relationshipStats.suggestions.length === 0 && relationshipStats.weeklyScore === 0 && (
        <div className="text-center py-4">
          <HeartIcon className="w-8 h-8 text-pink-400 mx-auto mb-2" />
          <p className="text-sm text-pink-600 mb-2">No relationship tasks completed yet</p>
          <p className="text-xs text-pink-500">Complete some relationship tasks to see your stats!</p>
        </div>
      )}

      {/* Suggestion Options Modal */}
      {showSuggestionModal && (
        <RelationshipSuggestionOptions
          suggestion={showSuggestionModal}
          user={user}
          db={db}
          partnerName={preferences?.partnerName}
          onClose={() => setShowSuggestionModal(null)}
          onTaskAdded={(customData) => {
            if (customData?.type === 'custom') {
              // Handle custom task addition through parent
              if (onSuggestionClick) {
                onSuggestionClick({
                  title: customData.title,
                  category: customData.category,
                  priority: customData.priority
                });
              }
            } else {
              // Handle quick-add task refresh
              if (onTaskAdded) onTaskAdded();
            }
          }}
        />
      )}
    </div>
  );
}
