'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { initializeFirebaseClient } from '@/lib/firebase-client';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { generateSmartDailyTasks } from '@/constants/tasks';
import UserPreferences from '@/components/UserPreferences';
import PullToRefresh from '@/components/PullToRefresh';
import RecurringTaskManager from '@/components/RecurringTaskManager';
import EmergencyModeSelector from '@/components/EmergencyModeSelector';
import RelationshipTracker from '@/components/RelationshipTracker';
import { shouldCreateToday } from '@/lib/recurringTasks';
import { generateSmartContextualTasks } from '@/lib/contextualTasks';

// Import our new modular components
import DashboardHeader from '@/components/DashboardHeader';
import TaskList from '@/components/TaskList';
import TaskActions from '@/components/TaskActions';
import PastPromises from '@/components/PastPromises';
import TaskForm from '@/components/TaskForm';
import TaskErrorBoundary from '@/components/TaskErrorBoundary';
import DashboardLoading from '@/components/DashboardLoading';

export default function DashboardClient() {
  // State variables
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [pastPromises, setPastPromises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDetail, setNewTaskDetail] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('household');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [showEmergencyMode, setShowEmergencyMode] = useState(false);
  const [currentEnergyLevel, setCurrentEnergyLevel] = useState('medium');
  const [completionHistory, setCompletionHistory] = useState([]);
  const [emergencyModeActive, setEmergencyModeActive] = useState(false);
  const [activeModeTemplates, setActiveModeTemplates] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [voiceSuccess, setVoiceSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dateStr, setDateStr] = useState("");
  const [greeting, setGreeting] = useState("Hello 👋");
  const [firebaseInstances, setFirebaseInstances] = useState({ auth: null, db: null });

  // Initialize Firebase on client side only
  useEffect(() => {
    const { auth, db } = initializeFirebaseClient();
    setFirebaseInstances({ auth, db });
  }, []);

  // Extract auth and db for easier access
  const { auth, db } = firebaseInstances;

  // Sort tasks with 3+ day old incomplete tasks first (nudged), then show completed tasks at bottom
  const sortedTasks = useMemo(() => {
    const incomplete = tasks
      .filter((t) => !t.completedAt)
      .map(task => ({
        ...task,
        ageInDays: task.createdAt ? Math.floor((Date.now() - task.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24)) : 0
      }))
      .sort((a, b) => (b.ageInDays >= 3 ? 1 : 0) - (a.ageInDays >= 3 ? 1 : 0));
    
    const completed = tasks
      .filter((t) => t.completedAt)
      .sort((a, b) => b.completedAt.toDate().getTime() - a.completedAt.toDate().getTime());
    
    return [...incomplete, ...completed];
  }, [tasks]);

  const completedTaskCount = useMemo(() => tasks.filter((t) => t.completedAt).length, [tasks]);

  // Helper to refresh all data
  const refreshAllData = async () => {
    if (!user || !userPreferences) return;
    
    try {
      setLoading(true);
      await loadTasks();
      await loadPastPromises();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load today's tasks
  const loadTasks = useCallback(async () => {
    if (!user || !db) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get recent tasks (last 30 days) to include today's and older incomplete tasks
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startOfPeriod = Timestamp.fromDate(thirtyDaysAgo);

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      where('createdAt', '>=', startOfPeriod),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter for today's tasks and recent incomplete tasks
    const relevantTasks = allTasks.filter(task => {
      if (!task.createdAt) return false;
      const taskDate = task.createdAt.toDate();
      
      // Include today's tasks
      if (taskDate >= today) return true;
      
      // Include incomplete tasks from the last few days (for past promises)
      if (!task.completedAt && taskDate >= thirtyDaysAgo) return true;
      
      return false;
    });
    
    setTasks(relevantTasks);
  }, [user, db]);

  // Load past promises
  const loadPastPromises = useCallback(async () => {
    if (!user || !db) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    const eligibleTasks = snapshot.docs.filter((docSnap) => {
      const data = docSnap.data();
      const createdDate = data.createdAt?.toDate();
      
      if (data.lastRestored) {
        const restoredDate = data.lastRestored.toDate();
        const restoredToday = restoredDate >= today && restoredDate < new Date(today.getTime() + 24*60*60*1000);
        if (restoredToday) return false;
      }
      
      if (!createdDate) return false;
      if (data.completedAt) return false;
      if (data.snoozedUntil && data.snoozedUntil.toDate() > new Date()) return false;
      
      const daysSinceCreated = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
      return daysSinceCreated >= 1 && daysSinceCreated <= 14 && data.source === 'manual';
    });

    const past = eligibleTasks
      .map((docSnap) => {
        const data = docSnap.data();
        const createdDate = data.createdAt.toDate();
        const daysSinceCreated = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
        
        let ageLabel = '';
        if (daysSinceCreated === 1) ageLabel = 'Yesterday';
        else if (daysSinceCreated <= 7) ageLabel = `${daysSinceCreated} days ago`;
        else ageLabel = 'Over a week ago';
        
        return {
          id: docSnap.id,
          ...data,
          ageLabel,
          daysSinceCreated
        };
      })
      .sort((a, b) => b.ageLabel.localeCompare(a.ageLabel))
      .slice(0, 3);

    setPastPromises(past);
  }, [user, db]);

  // Handle voice tasks added
  const handleVoiceTasksAdded = () => {
    setVoiceSuccess(true);
    setTimeout(() => setVoiceSuccess(false), 3000);
    refreshAllData();
  };

  // Clear emergency mode
  const clearEmergencyMode = () => {
    setEmergencyModeActive(false);
    setActiveModeTemplates([]);
    loadTasks();
  };

  // Handle emergency mode selection
  const handleEmergencyMode = (mode) => {
    setEmergencyModeActive(true);
    setActiveModeTemplates(mode.tasks || []);
    setShowEmergencyMode(false);
    refreshAllData();
  };

  // Restore task to today
  const restoreToToday = async (taskId) => {
    if (!db) return;
    
    try {
      const taskDoc = await getDoc(doc(db, 'tasks', taskId));
      if (taskDoc.exists()) {
        const data = taskDoc.data();
        const now = Timestamp.now();
        
        await updateDoc(doc(db, 'tasks', taskId), {
          createdAt: now,
          lastRestored: now,
          restoreCount: (data.restoreCount || 0) + 1,
        });
        
        // Move to today's tasks
        const restored = {
          id: taskId,
          ...data,
          createdAt: now,
          lastRestored: now,
        };
        
        setTasks(prev => [...prev, restored]);
        setPastPromises(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (error) {
      console.error('Error restoring task:', error);
    }
  };

  // Snooze task
  const snoozeTask = async (taskId) => {
    if (!db) return;
    
    const snoozeTime = new Date();
    snoozeTime.setHours(snoozeTime.getHours() + 1);
    
    await updateDoc(doc(db, 'tasks', taskId), {
      snoozedUntil: Timestamp.fromDate(snoozeTime),
    });
    
    setPastPromises(prev => prev.filter(t => t.id !== taskId));
  };

  // Dismiss task
  const dismissTask = async (taskId) => {
    if (!db) return;
    
    await updateDoc(doc(db, 'tasks', taskId), {
      dismissed: true,
      dismissedAt: Timestamp.now(),
    });
    
    setPastPromises(prev => prev.filter(t => t.id !== taskId));
  };

  // Save recurring task
  const saveRecurringTask = async (recurringTask) => {
    try {
      const newRecurringTask = {
        ...recurringTask,
        userId: user.uid,
        createdAt: Timestamp.now(),
        isActive: true
      };

      await addDoc(collection(db, 'recurringTasks'), newRecurringTask);
      
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }

      await loadTasks();
    } catch (error) {
      console.error('Error saving recurring task:', error);
    }
  };

  // Handle preferences complete
  const handlePreferencesComplete = async (prefs) => {
    setUserPreferences(prefs);
    setShowPreferences(false);
    setLoading(false);
  };

  // Set up date and greeting
  useEffect(() => {
    setMounted(true);
    const today = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    setDateStr(today.toLocaleDateString('en-US', options));
    
    const hour = today.getHours();
    const name = user?.displayName?.split(' ')[0] || 'there';
    
    if (hour < 12) setGreeting(`Morning, ${name} ☀️`);
    else if (hour < 17) setGreeting(`Afternoon, ${name} 👋`);
    else setGreeting(`Evening, ${name} 👋`);
  }, [user]);

  // Auth state management
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    let authStabilized = false;
    const stabilizationTimer = setTimeout(() => {
      authStabilized = true;
      if (!user) {
        router.push('/login');
      }
    }, 1500);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        clearTimeout(stabilizationTimer);
      } else if (authStabilized) {
        router.push('/login');
      }
      setAuthLoading(false);
    });

    return () => {
      clearTimeout(stabilizationTimer);
      unsubscribe();
    };
  }, [auth, router, user]);

  // Load user data and tasks
  useEffect(() => {
    if (!user || !db) return;

    const loadUserData = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        if (data.preferences && data.preferences.hasSetup) {
          setUserPreferences(data.preferences);
        } else {
          setShowPreferences(true);
        }
      } else {
        await setDoc(userRef, {
          streakCount: 0,
          lastTaskCompletionDate: null,
        });
        setShowPreferences(true);
      }
    };

    loadUserData().catch(console.error);
  }, [user, db]);

  // Load tasks and promises when ready
  useEffect(() => {
    if (!user || showPreferences || !userPreferences || !db) return;

    const run = async () => {
      try {
        await loadTasks();
        await loadPastPromises();
      } catch (err) {
        console.error('[Dashboard] loadTasks error:', err);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [user, userPreferences, showPreferences, loadTasks, loadPastPromises, db]);

  // Loading states
  if (!mounted) {
    return <DashboardLoading message="Setting up your dashboard..." />;
  }

  if (authLoading) {
    return <DashboardLoading message="Checking your authentication..." />;
  }

  if (showPreferences) {
    return (
      <UserPreferences
        userId={user?.uid}
        onComplete={handlePreferencesComplete}
      />
    );
  }

  if (loading && !tasks.length) {
    return <DashboardLoading showSkeleton={true} />;
  }

  // Main dashboard render
  return (
    <TaskErrorBoundary>
      <PullToRefresh onRefresh={refreshAllData}>
        <main className="max-w-2xl mx-auto p-4">
          
          {/* Dashboard Header Component */}
          <DashboardHeader
            dateStr={dateStr}
            greeting={greeting}
            user={user}
            emergencyModeActive={emergencyModeActive}
            onClearEmergencyMode={clearEmergencyMode}
            tasks={tasks}
            completionHistory={completionHistory}
            onReminderAction={(action, data) => {
              if (action === 'add_relationship_task') {
                setNewTaskTitle(data.title);
                setNewTaskDetail(data.detail);
                setNewTaskCategory('relationship');
                setShowTaskForm(true);
              }
            }}
            loading={loading}
            onRefresh={refreshAllData}
            onAddTask={() => setShowTaskForm(!showTaskForm)}
            onVoiceTasksAdded={handleVoiceTasksAdded}
            showMoreOptions={showMoreOptions}
            onToggleMoreOptions={() => setShowMoreOptions(!showMoreOptions)}
          />

          {/* Task Actions Component */}
          <TaskActions
            showMoreOptions={showMoreOptions}
            onToggleRecurringForm={() => setShowRecurringForm(!showRecurringForm)}
            showRecurringForm={showRecurringForm}
            emergencyModeActive={emergencyModeActive}
            onShowEmergencyMode={() => setShowEmergencyMode(true)}
            currentEnergyLevel={currentEnergyLevel}
            onEnergyLevelChange={setCurrentEnergyLevel}
          />

          {/* Main Task List Component */}
          {!loading && (
            <TaskList
              tasks={sortedTasks}
              db={db}
              user={user}
              onTaskUpdate={refreshAllData}
              onTaskDelete={(taskId) => {
                setTasks(prev => prev.filter(t => t.id !== taskId));
              }}
              loading={loading}
            />
          )}

          {/* Past Promises Component */}
          <PastPromises
            pastPromises={pastPromises}
            onRestoreTask={restoreToToday}
            onSnoozeTask={snoozeTask}
            onDismissTask={dismissTask}
          />

          {/* Task Form Modal */}
          <TaskForm
            isOpen={showTaskForm}
            onClose={() => setShowTaskForm(false)}
            onSubmit={async (taskData) => {
              const newTask = {
                ...taskData,
                userId: user.uid,
                createdAt: Timestamp.now(),
                source: 'manual',
              };

              // Optimistic update
              const tempId = 'temp-' + Date.now();
              setTasks(prev => [...prev, { ...newTask, id: tempId }]);

              try {
                const docRef = await addDoc(collection(db, 'tasks'), newTask);
                setTasks(prev => prev.map(t => t.id === tempId ? { ...newTask, id: docRef.id } : t));
                
                // Haptic feedback
                if ('vibrate' in navigator) {
                  navigator.vibrate(10);
                }
              } catch (error) {
                console.error("❌ Add task error:", error);
                setTasks(prev => prev.filter(t => !t.id.startsWith('temp-')));
                throw error;
              }
            }}
            initialTitle={newTaskTitle}
            initialDetail={newTaskDetail}
            initialCategory={newTaskCategory}
            initialPriority={newTaskPriority}
          />

          {/* Recurring Task Manager */}
          {showRecurringForm && (
            <RecurringTaskManager
              isVisible={showRecurringForm}
              onSave={saveRecurringTask}
              onClose={() => setShowRecurringForm(false)}
            />
          )}

          {/* Emergency Mode Selector */}
          {showEmergencyMode && (
            <EmergencyModeSelector
              isVisible={showEmergencyMode}
              onModeSelect={handleEmergencyMode}
              onClose={() => setShowEmergencyMode(false)}
            />
          )}

          {/* Relationship Tracker */}
          {user?.uid && userPreferences && (
            <RelationshipTracker userId={user.uid} />
          )}

          {/* Success Messages */}
          {voiceSuccess && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
              Voice tasks added!
            </div>
          )}
          
        </main>
      </PullToRefresh>
    </TaskErrorBoundary>
  );
}
