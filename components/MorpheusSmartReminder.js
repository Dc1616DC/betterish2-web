/**
 * Smart Reminder Component
 * Dad-friendly reminders that catch things before they become expensive problems
 */

/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect } from 'react';
import { SparklesIcon, LightBulbIcon, ClockIcon } from '@heroicons/react/24/outline';

// Smart reminder database - things dads commonly forget
const SMART_REMINDERS = {
  seasonal: {
    january: [
      {
        title: "Schedule tax prep appointment",
        why: "W-2s arrive by Jan 31 - beat the rush",
        effort: "5 min call",
        prevents: "Last-minute tax stress",
        category: "personal"
      },
      {
        title: "Check smoke detector batteries",
        why: "New Year = new batteries tradition",
        effort: "10 min",
        prevents: "3am chirping nightmare",
        category: "maintenance"
      }
    ],
    february: [
      {
        title: "Plan Valentine's Day",
        why: "Restaurants book up 2 weeks out",
        effort: "15 min planning",
        prevents: "Relationship stress",
        category: "relationship"
      }
    ],
    march: [
      {
        title: "Schedule AC service",
        why: "Beat the summer rush, get spring rates",
        effort: "10 min call",
        prevents: "$200+ emergency repair",
        category: "maintenance"
      }
    ],
    april: [
      {
        title: "Check car registration",
        why: "Most expire in spring",
        effort: "5 min online",
        prevents: "Late fees & tickets",
        category: "personal"
      }
    ],
    september: [
      {
        title: "Test heating system",
        why: "Find issues before first cold snap",
        effort: "5 min test",
        prevents: "Cold house emergency",
        category: "maintenance"
      },
      {
        title: "Schedule flu shots",
        why: "Before flu season starts",
        effort: "30 min appointment",
        prevents: "Family getting sick",
        category: "health"
      }
    ],
    october: [
      {
        title: "Winterize outdoor faucets",
        why: "First freeze can burst pipes",
        effort: "15 min",
        prevents: "$1000+ pipe repair",
        category: "home_projects"
      },
      {
        title: "Clean gutters",
        why: "Before leaves finish falling",
        effort: "2 hours",
        prevents: "Water damage",
        category: "home_projects"
      }
    ],
    november: [
      {
        title: "Plan holiday travel",
        why: "Flights double in price after Thanksgiving",
        effort: "30 min research",
        prevents: "Expensive last-minute travel",
        category: "events"
      }
    ],
    december: [
      {
        title: "Review insurance before year end",
        why: "Use FSA funds, check deductibles",
        effort: "20 min review",
        prevents: "Lost benefits",
        category: "personal"
      }
    ]
  },
  
  lifeStage: {
    newBaby: [
      {
        title: "Schedule 2-month checkup",
        why: "First vaccines due",
        effort: "1 hour visit",
        prevents: "Missing critical vaccines",
        category: "baby"
      },
      {
        title: "Baby-proof outlets",
        why: "They'll be crawling soon",
        effort: "30 min",
        prevents: "Emergency room visit",
        category: "baby"
      }
    ],
    toddler: [
      {
        title: "Research preschools",
        why: "Good ones have 6-month waitlists",
        effort: "2 hours research",
        prevents: "Scrambling for childcare",
        category: "baby"
      }
    ]
  },
  
  relationship: [
    {
      title: "Plan a date night",
      why: "It's been over 2 weeks",
      effort: "30 min planning",
      prevents: "Relationship drift",
      category: "relationship",
      frequency: 14 // days
    },
    {
      title: "Call your parents",
      why: "They won't always be around",
      effort: "20 min call",
      prevents: "Regret",
      category: "relationship",
      frequency: 7 // days
    }
  ],
  
  maintenance: [
    {
      title: "Change HVAC filter",
      why: "Every 3 months for efficiency",
      effort: "5 min",
      prevents: "High energy bills",
      category: "maintenance",
      frequency: 90 // days
    },
    {
      title: "Check water heater",
      why: "Look for rust or leaks",
      effort: "2 min visual check",
      prevents: "Flooding disaster",
      category: "maintenance",
      frequency: 180 // days
    }
  ]
};

export default function SmartReminder({ onAddTask, currentTasks = [], userProfile = {} }) {
  const [todaysReminder, setTodaysReminder] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasActed, setHasActed] = useState(false);

  useEffect(() => {
    // Check if already shown today
    const lastShown = localStorage.getItem('morpheusLastShown');
    const today = new Date().toDateString();
    
    if (lastShown === today) {
      setIsDismissed(true);
      return;
    }

    // Get smart reminder for today  
    const reminder = getSmartReminder(currentTasks, userProfile);
    if (reminder) {
      setTodaysReminder(reminder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTasks, userProfile]);

  const getSmartReminder = (tasks, profile) => {
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long' }).toLowerCase();
    
    // Priority 1: Seasonal/time-sensitive reminders
    const seasonalReminders = SMART_REMINDERS.seasonal[month] || [];
    for (const reminder of seasonalReminders) {
      // Check if this task already exists
      const exists = tasks.some(t => 
        t.title.toLowerCase().includes(reminder.title.toLowerCase().substring(0, 10))
      );
      if (!exists) {
        return { ...reminder, type: 'seasonal', urgency: 'high' };
      }
    }
    
    // Priority 2: Life stage reminders (if applicable)
    if (profile.babyAge) {
      const stage = profile.babyAge < 12 ? 'newBaby' : 'toddler';
      const stageReminders = SMART_REMINDERS.lifeStage[stage] || [];
      for (const reminder of stageReminders) {
        const exists = tasks.some(t => 
          t.title.toLowerCase().includes(reminder.title.toLowerCase().substring(0, 10))
        );
        if (!exists) {
          return { ...reminder, type: 'lifeStage', urgency: 'medium' };
        }
      }
    }
    
    // Priority 3: Relationship maintenance
    const lastDateNight = localStorage.getItem('lastDateNight');
    if (!lastDateNight || daysSince(lastDateNight) > 14) {
      return { 
        ...SMART_REMINDERS.relationship[0], 
        type: 'relationship',
        urgency: 'medium'
      };
    }
    
    // Priority 4: Regular maintenance
    const lastFilterChange = localStorage.getItem('lastFilterChange');
    if (!lastFilterChange || daysSince(lastFilterChange) > 90) {
      return { 
        ...SMART_REMINDERS.maintenance[0], 
        type: 'maintenance',
        urgency: 'low'
      };
    }
    
    return null;
  };

  const daysSince = (dateString) => {
    if (!dateString) return 999;
    const then = new Date(dateString);
    const now = new Date();
    return Math.floor((now - then) / (1000 * 60 * 60 * 24));
  };

  const handleAddToTasks = () => {
    if (!todaysReminder) return;
    
    const task = {
      title: todaysReminder.title,
      description: todaysReminder.why,
      category: todaysReminder.category,
      priority: todaysReminder.urgency === 'high' ? 'high' : 'medium',
      source: 'morpheus'
    };
    
    onAddTask(task);
    setHasActed(true);
    
    // Track completion
    localStorage.setItem('morpheusLastShown', new Date().toDateString());
    
    // Track specific actions if needed
    if (todaysReminder.type === 'relationship' && todaysReminder.title.includes('date')) {
      localStorage.setItem('lastDateNight', new Date().toISOString());
    }
  };

  const handleAlreadyDone = () => {
    setHasActed(true);
    localStorage.setItem('morpheusLastShown', new Date().toDateString());
    
    // Learn from this
    if (todaysReminder) {
      const completed = JSON.parse(localStorage.getItem('morpheusCompleted') || '[]');
      completed.push({
        reminder: todaysReminder.title,
        date: new Date().toISOString()
      });
      localStorage.setItem('morpheusCompleted', JSON.stringify(completed));
    }
  };

  const handleRemindLater = () => {
    setIsDismissed(true);
    // Don't mark as shown today, so it can appear tomorrow
  };

  if (isDismissed || !todaysReminder || hasActed) {
    return null;
  }

  const urgencyColors = {
    high: 'border-orange-200 bg-orange-50',
    medium: 'border-blue-200 bg-blue-50',
    low: 'border-gray-200 bg-gray-50'
  };

  const urgencyIcons = {
    high: '🚨',
    medium: '💡',
    low: '📝'
  };

  return (
    <div className={`mb-6 rounded-xl border-2 ${urgencyColors[todaysReminder.urgency]} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-lg">{urgencyIcons[todaysReminder.urgency]}</span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900">
                Morpheus noticed something...
              </h3>
              <span className="text-xs text-gray-500">
                {todaysReminder.type === 'seasonal' && '🍂 Seasonal'}
                {todaysReminder.type === 'lifeStage' && '👶 Life Stage'}
                {todaysReminder.type === 'relationship' && '❤️ Relationship'}
                {todaysReminder.type === 'maintenance' && '🔧 Maintenance'}
              </span>
            </div>
            
            <p className="text-gray-800 font-medium mb-3">
              "{todaysReminder.title}"
            </p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-gray-500">Why now:</span>
                <span className="text-gray-700">{todaysReminder.why}</span>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="text-gray-500">Effort:</span>
                <span className="text-green-700 font-medium">{todaysReminder.effort}</span>
              </div>
              
              {todaysReminder.prevents && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">Prevents:</span>
                  <span className="text-orange-700 font-medium">{todaysReminder.prevents}</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddToTasks}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                📝 Add to Tasks
              </button>
              
              <button
                onClick={handleAlreadyDone}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                ✅ Already done
              </button>
              
              <button
                onClick={handleRemindLater}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}