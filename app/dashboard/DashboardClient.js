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
import MorpheusCheckIn from '@/components/AIMentorCheckIn';
import AppWalkthrough from '@/components/AppWalkthrough';
import TaskBreakdown from '@/components/TaskBreakdown';

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
    createTask 
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
  
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Generate greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! 🌅';
    if (hour < 17) return 'Good Afternoon! ☀️';
    return 'Good Evening! 🌙';
  };

  const handleOpenChat = (task) => {
    setSelectedTask(task);
    setShowSidekickChat(true);
  };

  const handleOpenProjectBreakdown = (task) => {
    setSelectedProjectTask(task);
    setShowTaskBreakdown(true);
  };

  // AI Mentor handlers
  const handleAddTasks = async (tasks) => {
    for (const task of tasks) {
      try {
        // Normalize AI task to match TaskService validation
        const normalizedTask = {
          title: task.title,
          description: task.detail || task.description || '',
          category: task.category || 'personal', // Default to personal if missing
          priority: 'medium' // AI suggestions are generally medium priority
        };
        
        await createTask(normalizedTask);
      } catch (error) {
        console.error('Failed to add task:', error);
      }
    }
  };

  const handleEmergencyMode = () => {
    // Emergency mode could filter tasks or change view
    console.log('Emergency mode activated');
  };

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
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
                onClick={() => setShowWalkthrough(true)}
                className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
                title="View App Tour"
              >
                📖
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

      {/* Morpheus Check-In */}
      <div className="max-w-md mx-auto px-6 py-4">
        <MorpheusCheckIn
          onAddTasks={handleAddTasks}
          onEmergencyMode={handleEmergencyMode}
          currentTasks={activeTasks || []}
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
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        Project
                      </span>
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
        onClose={() => setShowWalkthrough(false)}
        onComplete={() => {
          setShowWalkthrough(false);
          console.log('Walkthrough completed!');
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
        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          className="absolute top-4 right-4 z-10 text-gray-600 hover:text-gray-900 text-sm"
        >
          Sign Out
        </button>
        
        <DashboardContent />
      </div>
    </TaskProvider>
  );
}