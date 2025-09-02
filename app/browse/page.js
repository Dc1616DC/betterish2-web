'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { initializeFirebaseClient } from '@/lib/firebase-client';
import { TaskProvider } from '@/contexts/TaskContext';
import { useTasks } from '@/hooks/useTasks';
import { SparklesIcon, ClockIcon, ExclamationTriangleIcon, LightBulbIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import DashboardLoading from '@/components/DashboardLoading';

function BrowseContent() {
  const { 
    createTask,
    activeTasks,
    loading,
    error
  } = useTasks();
  
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('seasonal');
  const [addedTasks, setAddedTasks] = useState(new Set());

  // Categories for browsing
  const categories = [
    { 
      id: 'seasonal', 
      name: 'Seasonal & Timely', 
      icon: ClockIcon,
      description: 'Time-sensitive tasks for this time of year'
    },
    { 
      id: 'quick-wins', 
      name: 'Quick Wins', 
      icon: LightBulbIcon,
      description: '5-minute tasks that make a difference'
    },
    { 
      id: 'personal', 
      name: 'Personal Care', 
      icon: SparklesIcon,
      description: 'Self-care and personal development'
    },
    { 
      id: 'household', 
      name: 'House & Home', 
      icon: ExclamationTriangleIcon,
      description: 'Maintenance and organization tasks'
    },
    { 
      id: 'projects', 
      name: 'Projects & Fixes', 
      icon: WrenchScrewdriverIcon,
      description: 'Bigger projects broken into manageable steps'
    },
    { 
      id: 'kids', 
      name: 'Kids & Family', 
      icon: SparklesIcon,
      description: 'Parenting and family activities'
    },
    { 
      id: 'relationships', 
      name: 'Relationships', 
      icon: SparklesIcon,
      description: 'Keep connections strong'
    }
  ];

  // Fetch AI suggestions based on category
  const fetchSuggestions = async (category) => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch('/api/ai-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'browse-user',
          action: 'browse_category',
          category,
          userTasks: activeTasks || []
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Fallback to default suggestions
      setSuggestions(getDefaultSuggestions(category));
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Get default suggestions if AI fails
  const getDefaultSuggestions = (category) => {
    const defaults = {
      'seasonal': [
        { title: 'Check holiday travel prices', description: 'Prices jump after October', category: 'personal', priority: 'high' },
        { title: 'Schedule flu shots', description: 'Before flu season peaks', category: 'personal', priority: 'medium' },
        { title: 'Test heating system', description: 'Before first cold snap', category: 'household', priority: 'medium' }
      ],
      'quick-wins': [
        { title: 'Clear phone photos', description: 'Free up storage space', category: 'personal', priority: 'low' },
        { title: 'Unsubscribe from 3 emails', description: 'Reduce inbox clutter', category: 'personal', priority: 'low' },
        { title: 'Water plants', description: 'They need you', category: 'household', priority: 'low' }
      ],
      'personal': [
        { title: 'Drink a glass of water', description: 'Stay hydrated', category: 'personal', priority: 'low' },
        { title: 'Take 5 deep breaths', description: 'Reset your mind', category: 'personal', priority: 'low' },
        { title: 'Schedule a checkup', description: 'Health first', category: 'personal', priority: 'medium' }
      ],
      'household': [
        { title: 'Make your bed', description: 'Start the day right', category: 'household', priority: 'low' },
        { title: 'Load the dishwasher', description: 'Clean as you go', category: 'household', priority: 'low' },
        { title: 'Take out trash', description: 'Before it overflows', category: 'household', priority: 'medium' }
      ],
      'kids': [
        { title: 'Read together', description: 'Quality bonding time', category: 'baby', priority: 'high' },
        { title: 'Plan weekend activity', description: 'Make memories', category: 'baby', priority: 'medium' },
        { title: 'Ask about their day', description: 'Show you care', category: 'baby', priority: 'high' }
      ],
      'relationships': [
        { title: 'Text an old friend', description: 'Just checking in', category: 'relationship', priority: 'low' },
        { title: 'Plan date night', description: 'Keep romance alive', category: 'relationship', priority: 'medium' },
        { title: 'Call parents', description: 'They miss your voice', category: 'relationship', priority: 'medium' }
      ],
      'projects': [
        { title: 'Organize garage', description: 'Break into weekend chunks', category: 'home_projects', priority: 'medium' },
        { title: 'Install closet shelving', description: 'Double your storage space', category: 'home_projects', priority: 'medium' },
        { title: 'Fix squeaky hinges', description: 'All the doors you keep meaning to fix', category: 'home_projects', priority: 'low' }
      ]
    };
    return defaults[category] || defaults['seasonal'];
  };

  // Handle category change
  useEffect(() => {
    fetchSuggestions(selectedCategory);
  }, [selectedCategory]);

  // Add task handler
  const handleAddTask = async (suggestion) => {
    try {
      const taskData = {
        title: suggestion.title,
        description: suggestion.description || suggestion.detail || '',
        category: suggestion.category || 'personal',
        priority: suggestion.priority || 'medium'
      };
      
      // Check if this is a project that should be broken down
      if (suggestion.isProject || suggestion.timeEstimate?.includes('weekend') || suggestion.timeEstimate?.includes('hours')) {
        // Offer to break down the project
        const breakdownConfirm = confirm(
          `"${suggestion.title}" looks like a bigger project. Would you like me to break it down into manageable steps?`
        );
        
        if (breakdownConfirm) {
          try {
            // Call the breakdown API
            const response = await fetch('/api/ai-checkin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: 'browse-user',
                action: 'break_down',
                taskTitle: suggestion.title
              })
            });

            if (response.ok) {
              const breakdown = await response.json();
              
              // Create multiple smaller tasks from the breakdown
              if (breakdown.thisWeekend) {
                for (const step of breakdown.thisWeekend) {
                  await createTask({
                    title: step.title,
                    description: `${step.time} - Part of: ${suggestion.title}`,
                    category: suggestion.category || 'personal',
                    priority: 'medium'
                  });
                }
              }
              
              if (breakdown.nextWeekend) {
                for (const step of breakdown.nextWeekend) {
                  await createTask({
                    title: step.title,
                    description: `${step.time} - Part of: ${suggestion.title}`,
                    category: suggestion.category || 'personal',
                    priority: 'low'
                  });
                }
              }
              
              setAddedTasks(prev => new Set([...prev, suggestion.title]));
              alert('Project broken down into manageable tasks!');
              return;
            }
          } catch (error) {
            console.error('Failed to break down project:', error);
            // Fall through to add as single task
          }
        }
      }
      
      // Add as single task
      await createTask(taskData);
      setAddedTasks(prev => new Set([...prev, suggestion.title]));
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Browse Tasks</h1>
          <p className="text-sm text-gray-600 mt-1">AI-powered suggestions based on what matters now</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCategory === cat.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 mx-auto ${
                  selectedCategory === cat.id ? 'text-blue-600' : 'text-gray-600'
                }`} />
                <div className="text-sm font-medium">
                  {cat.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Category Description */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-900">
            {categories.find(c => c.id === selectedCategory)?.description}
          </p>
        </div>

        {/* Suggestions Grid */}
        {loadingSuggestions ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Getting smart suggestions...</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {suggestions?.map((suggestion, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">
                    {suggestion.title}
                  </h3>
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
                
                <p className="text-sm text-gray-600 mb-3">
                  {suggestion.description || suggestion.detail}
                </p>
                
                {suggestion.timeEstimate && (
                  <p className="text-xs text-gray-500 mb-3">
                    ⏱ {suggestion.timeEstimate}
                  </p>
                )}
                
                {suggestion.prevents && (
                  <p className="text-xs text-orange-600 mb-3">
                    Prevents: {suggestion.prevents}
                  </p>
                )}
                
                <button
                  onClick={() => handleAddTask(suggestion)}
                  disabled={addedTasks.has(suggestion.title)}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    addedTasks.has(suggestion.title)
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {addedTasks.has(suggestion.title) ? '✓ Added' : 'Add to Tasks'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loadingSuggestions && (!suggestions || suggestions.length === 0) && (
          <div className="text-center py-12">
            <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No suggestions available right now.</p>
            <p className="text-sm text-gray-400 mt-2">Try another category!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { auth } = initializeFirebaseClient();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
      
      if (!user) {
        router.push('/login');
      }
    });

    return unsubscribe;
  }, [router]);

  if (authLoading || !user) {
    return <DashboardLoading />;
  }

  return (
    <TaskProvider user={user}>
      <BrowseContent />
    </TaskProvider>
  );
}