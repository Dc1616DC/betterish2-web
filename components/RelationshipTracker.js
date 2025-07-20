'use client';

import { useState, useEffect } from 'react';
import { HeartIcon, ChatBubbleLeftIcon, GiftIcon, ClockIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

export default function RelationshipTracker({ userId, tasks, completionHistory, preferences, compact = false }) {
  const [relationshipStats, setRelationshipStats] = useState({
    lastAppreciationText: null,
    lastDateNight: null,
    lastActOfService: null,
    weeklyScore: 0,
    streak: 0,
    suggestions: []
  });

  useEffect(() => {
    if (!completionHistory || !userId) return;
    
    const calculateRelationshipStats = () => {
      const now = new Date();
      const relationshipTasks = completionHistory.filter(task => 
        task.category === 'relationship' && task.completedAt
      );

      // Find last appreciation text
      const appreciationTasks = relationshipTasks.filter(task => 
        task.title.toLowerCase().includes('text') || 
        task.title.toLowerCase().includes('appreciation')
      );
      const lastAppreciation = appreciationTasks[0]?.completedAt?.toDate();

      // Find last date-related task
      const dateTasks = relationshipTasks.filter(task => 
        task.title.toLowerCase().includes('date') || 
        task.title.toLowerCase().includes('plan')
      );
      const lastDate = dateTasks[0]?.completedAt?.toDate();

      // Find last act of service
      const serviceTasks = relationshipTasks.filter(task => 
        task.title.toLowerCase().includes('clean') || 
        task.title.toLowerCase().includes('help') ||
        task.title.toLowerCase().includes('handle')
      );
      const lastService = serviceTasks[0]?.completedAt?.toDate();

      // Calculate weekly score (last 7 days)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklyRelationshipTasks = relationshipTasks.filter(task => 
        task.completedAt.toDate() >= weekAgo
      );

      // Calculate streak (consecutive days with relationship tasks)
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        checkDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(checkDate.getTime() + 24 * 60 * 60 * 1000);
        
        const dayTasks = relationshipTasks.filter(task => {
          const completedDate = task.completedAt.toDate();
          return completedDate >= checkDate && completedDate < nextDay;
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

    // Text suggestions
    if (!lastText || (now - lastText) / (1000 * 60 * 60 * 24) >= 2) {
      suggestions.push({
        type: 'appreciation',
        title: `Text ${partnerName} something specific`,
        urgency: 'medium',
        icon: ChatBubbleLeftIcon
      });
    }

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
          <h4 className="text-xs font-semibold text-pink-700 mb-2">Suggestions:</h4>
          <div className="space-y-2">
            {relationshipStats.suggestions.map((suggestion, index) => {
              const IconComponent = suggestion.icon;
              return (
                <div 
                  key={index}
                  className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                    suggestion.urgency === 'high' ? 'bg-red-100 text-red-700' : 'bg-white bg-opacity-50 text-pink-700'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{suggestion.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
