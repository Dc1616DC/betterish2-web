'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { initializeFirebaseClient } from '@/lib/firebase-client';

// Our new architecture components
import { TaskProvider } from '@/contexts/TaskContext';
import { useTasks } from '@/hooks/useTasks';
import TaskList from '@/components/TaskList';
import TaskForm from '@/components/TaskForm';
import DashboardLoading from '@/components/DashboardLoading';
import SidekickChat from '@/components/SidekickChat';
import MorpheusSmartReminder from '@/components/MorpheusSmartReminder';
import AppWalkthrough from '@/components/AppWalkthrough';
import TaskBreakdown from '@/components/TaskBreakdown';
import VoiceTaskRecorder from '@/components/VoiceTaskRecorder';
import FeatureTutorial from '@/components/FeatureTutorial';
import OnboardingTips from '@/components/OnboardingTips';
import TutorialMenu from '@/components/TutorialMenu';
import { trackFeatureUsage, FEATURES } from '@/lib/featureDiscovery';

// Mobile detection hook
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    const listener = (e) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  
  return matches;
}

function DashboardContent() {
  const { 
    tasks, 
    activeTasks, 
    completedTasks, 
    loading, 
    error,
    clearError,
    createTask,
    deleteTask 
  } = useTasks();

  // Helper function to identify project tasks (tasks that would benefit from breakdown)
  const isProjectTask = (task) => {
    if (!task || !task.title) return false;
    const title = task.title.toLowerCase();
    
    // Common project keywords
    const projectKeywords = [
      'install', 'organize', 'clean', 'paint', 'fix', 'repair', 
      'build', 'setup', 'replace', 'renovate', 'caulk', 'mount',
      'closet', 'garage', 'bathroom', 'kitchen', 'basement',
      'shelving', 'threshold', 'door', 'window', 'wall'
    ];
    
    return projectKeywords.some(keyword => title.includes(keyword)) && 
           task.title.length > 15; // Longer titles are more likely to be projects
  };
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSidekickChat, setShowSidekickChat] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showTaskBreakdown, setShowTaskBreakdown] = useState(false);
  const [selectedProjectTask, setSelectedProjectTask] = useState(null);
  const [showTutorialMenu, setShowTutorialMenu] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState(null);
  
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Auto-open walkthrough for new users (no tasks)
  useEffect(() => {
    if (!loading && (!tasks || tasks.length === 0)) {
      // Check if user has seen walkthrough before
      const hasSeenWalkthrough = localStorage.getItem('hasSeenWalkthrough');
      if (!hasSeenWalkthrough) {
        trackFeatureUsage(FEATURES.WALKTHROUGH, { context: 'auto_open_new_user' });
        setShowWalkthrough(true);
      }
    }
  }, [loading, tasks]);

  // Generate greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! 🌅';
    if (hour < 17) return 'Good Afternoon! ☀️';
    return 'Good Evening! 🌙';
  };

  const handleOpenChat = (task) => {
    // Track Morpheus chat usage
    trackFeatureUsage(FEATURES.MORPHEUS_CHAT, {
      context: 'task_specific',
      taskTitle: task?.title,
      taskCategory: task?.category
    });
    
    setSelectedTask(task);
    setShowSidekickChat(true);
  };

  const handleOpenProjectBreakdown = (task) => {
    setSelectedProjectTask(task);
    setShowTaskBreakdown(true);
  };

  // Smart reminder handler - single task at a time
  const handleAddSmartTask = async (task) => {
    // Track smart reminder usage
    trackFeatureUsage(FEATURES.MORPHEUS_CHAT, {
      context: 'smart_reminder',
      category: task.category
    });
    
    try {
      await createTask(task);
    } catch (error) {
      console.error('Failed to add smart reminder task:', error);
    }
  };

  // Tutorial handlers
  const handleTutorialRequest = (tutorialType) => {
    setCurrentTutorial(tutorialType);
  };

  const handleStartTutorial = (tutorialType) => {
    // Track tutorial usage
    trackFeatureUsage(FEATURES.TUTORIALS, {
      tutorialType,
      context: 'manual_start'
    });
    
    setCurrentTutorial(tutorialType);
  };

  const closeTutorial = () => {
    setCurrentTutorial(null);
  };

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-safe-nav">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-6 py-4">
          {/* Desktop layout */}
          <div className="hidden sm:flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {getGreeting()}
              </h1>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  trackFeatureUsage(FEATURES.WALKTHROUGH, { context: 'manual_open' });
                  setShowWalkthrough(true);
                }}
                className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
                title="View App Tour"
              >
                📖
              </button>
              <button
                onClick={() => {
                  trackFeatureUsage(FEATURES.TUTORIALS, { context: 'menu_open' });
                  setShowTutorialMenu(true);
                }}
                className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                title="Feature Tutorials"
              >
                🎓
              </button>
              <button
                onClick={() => setShowTaskForm(true)}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                title="Add new task"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile layout - stacked to avoid sign out conflict */}
          <div className="sm:hidden">
            <div className="text-center mb-3">
              <h1 className="text-xl font-bold text-gray-900">
                {getGreeting()}
              </h1>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  trackFeatureUsage(FEATURES.WALKTHROUGH, { context: 'manual_open_mobile' });
                  setShowWalkthrough(true);
                }}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
                title="View App Tour"
              >
                📖 Tour
              </button>
              <button
                onClick={() => {
                  trackFeatureUsage(FEATURES.TUTORIALS, { context: 'menu_open_mobile' });
                  setShowTutorialMenu(true);
                }}
                className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-1"
                title="Feature Tutorials"
              >
                🎓 Learn
              </button>
              <button
                onClick={() => setShowTaskForm(true)}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                title="Add new task"
              >
                <PlusIcon className="w-4 h-4" /> Add Task
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
            {error.includes('index') && (
              <div className="mt-2 text-xs text-red-700">
                <p>📋 <strong>Database Setup Required:</strong> Please create the missing Firestore index via Firebase Console.</p>
              </div>
            )}
            <button 
              onClick={clearError}
              className="text-red-600 text-sm underline mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Morpheus Smart Reminder */}
      <div className="max-w-md mx-auto px-6 py-4">
        <MorpheusSmartReminder
          onAddTask={handleAddSmartTask}
          currentTasks={activeTasks || []}
          userProfile={{
            // Add user profile data here if available
            babyAge: null // Could be calculated from user data
          }}
        />
      </div>

      {/* Onboarding Tips */}
      <OnboardingTips onTutorialRequest={handleTutorialRequest} />

      {/* Voice Task Recorder */}
      <div className="max-w-md mx-auto px-6 pb-4">
        <VoiceTaskRecorder 
          onTaskCreate={createTask}
          onTasksAdded={(count) => {
            console.log(`Added ${count} tasks via voice`);
          }}
          compact={false}
          mode="tasks"
        />
      </div>

      {/* Main content */}
      <div className="max-w-md mx-auto px-6 py-6">
        {/* Active Projects section - tasks with breakdowns */}
        {activeTasks && activeTasks.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Active Projects
              </h2>
              {activeTasks.filter(task => isProjectTask(task)).length > 0 && (
                <span className="bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded-full">
                  {activeTasks.filter(task => isProjectTask(task)).length}
                </span>
              )}
            </div>
            
            {activeTasks.filter(task => isProjectTask(task)).length === 0 ? (
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <p className="text-purple-700 text-sm text-center">
                  Multi-step projects will appear here when you break them down
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {activeTasks.filter(task => isProjectTask(task)).map(task => (
                  <div key={task.id} className="bg-white border border-purple-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          Project
                        </span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                          title="Dismiss project"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenProjectBreakdown(task)}
                        className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        View Project Steps
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Regular Active tasks section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Active Tasks
            </h2>
            {activeTasks && activeTasks.filter(task => !isProjectTask(task)).length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                {activeTasks.filter(task => !isProjectTask(task)).length}
              </span>
            )}
          </div>
          
          {!activeTasks || activeTasks.filter(task => !isProjectTask(task)).length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-blue-50 rounded-lg p-6">
                <p className="text-gray-600 mb-4">No simple tasks yet!</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowWalkthrough(true)}
                    className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors mb-2"
                  >
                    📖 View App Walkthrough
                  </button>
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Your First Task
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <TaskList 
              tasks={activeTasks.filter(task => !isProjectTask(task))} 
              onOpenChat={handleOpenChat}
            />
          )}
        </div>

        {/* Completed tasks section */}
        {completedTasks && completedTasks.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recently Completed
              </h2>
              <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
                {completedTasks?.length || 0}
              </span>
            </div>
            <TaskList 
              tasks={completedTasks?.slice(0, 5) || []} 
              onOpenChat={handleOpenChat}
            />
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      <TaskForm 
        isOpen={showTaskForm}
        onClose={() => setShowTaskForm(false)}
      />

      {/* Sidekick Chat Modal */}
      {showSidekickChat && (
        <SidekickChat
          task={selectedTask}
          isVisible={showSidekickChat}
          onClose={() => {
            setShowSidekickChat(false);
            setSelectedTask(null);
          }}
        />
      )}

      {/* Task Breakdown Modal */}
      {showTaskBreakdown && selectedProjectTask && (
        <TaskBreakdown
          task={selectedProjectTask}
          onClose={() => {
            setShowTaskBreakdown(false);
            setSelectedProjectTask(null);
          }}
          onSubtaskComplete={(taskId) => {
            // Handle subtask completion if needed
            console.log('Subtask completed:', taskId);
          }}
        />
      )}

      <AppWalkthrough
        isVisible={showWalkthrough}
        onClose={() => {
          setShowWalkthrough(false);
          localStorage.setItem('hasSeenWalkthrough', 'true');
        }}
        onComplete={() => {
          setShowWalkthrough(false);
          localStorage.setItem('hasSeenWalkthrough', 'true');
          console.log('Walkthrough completed!');
        }}
      />

      {/* Tutorial Menu */}
      <TutorialMenu
        isVisible={showTutorialMenu}
        onClose={() => setShowTutorialMenu(false)}
        onStartTutorial={handleStartTutorial}
      />

      {/* Feature Tutorial */}
      <FeatureTutorial
        feature={currentTutorial}
        isVisible={!!currentTutorial}
        onClose={closeTutorial}
        onComplete={(feature) => {
          console.log(`Completed tutorial: ${feature}`);
          closeTutorial();
        }}
      />
    </div>
  );
}

export default function DashboardClient() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseAuth, setFirebaseAuth] = useState(null);
  const router = useRouter();

  // Initialize Firebase and auth
  useEffect(() => {
    try {
      const { auth } = initializeFirebaseClient();
      setFirebaseAuth(auth);
      
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setAuthLoading(false);
        
        if (!user) {
          router.push('/login');
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      setAuthLoading(false);
    }
  }, [router]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      if (firebaseAuth) {
        await signOut(firebaseAuth);
      }
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (authLoading) {
    return <DashboardLoading />;
  }

  if (!user) {
    return <DashboardLoading />;
  }

  return (
    <TaskProvider user={user}>
      <div className="relative">
        {/* Sign out button - moved to avoid mobile button conflicts */}
        <button
          onClick={handleSignOut}
          className="absolute top-4 right-4 z-20 text-gray-600 hover:text-gray-900 text-sm bg-white px-2 py-1 rounded shadow-sm border md:bg-transparent md:shadow-none md:border-none"
        >
          Sign Out
        </button>
        
        <DashboardContent />
      </div>
    </TaskProvider>
  );
}