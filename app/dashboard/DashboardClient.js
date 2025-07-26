'use client';

import { useEffect, useState, useMemo, useCallback, memo, lazy, Suspense } from 'react';
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
  onSnapshot,
} from 'firebase/firestore';
import { initializeFirebaseClient } from '@/lib/firebase-client';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { generateSmartDailyTasks } from '@/constants/tasks';
import UserPreferences from '@/components/UserPreferences';
import PullToRefresh from '@/components/PullToRefresh';
import RelationshipTracker from '@/components/RelationshipTracker';

// Lazy load heavy components for better performance
const LazyRecurringTaskManager = lazy(() => import('@/components/RecurringTaskManager'));
const LazyEmergencyModeSelector = lazy(() => import('@/components/EmergencyModeSelector'));
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
import NotificationPermission from '@/components/NotificationPermission';

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
  const [firebaseInstances, setFirebaseInstances] = useState({ auth: null, db: null, messaging: null });

  // Initialize Firebase on client side only with proper error handling
  useEffect(() => {
    let mounted = true;
    
    const initFirebase = async () => {
      try {
        const { auth, db, messaging } = initializeFirebaseClient();
        if (mounted && auth && db) {
          setFirebaseInstances({ auth, db, messaging });
        }
      } catch (error) {
        if (mounted) {
          // Firebase initialization failed - redirect to login
          router.push('/login');
        }
      }
    };
    
    initFirebase();
    
    return () => {
      mounted = false;
    };
  }, [router]);

  // Extract auth, db, and messaging for easier access
  const { auth, db, messaging } = firebaseInstances;

  // Sort tasks with 3+ day old incomplete tasks first (nudged), then show completed tasks at bottom
  const sortedTasks = useMemo(() => {
    const incomplete = tasks
      .filter((t) => !t.completedAt && !t.completed)
      .map(task => ({
        ...task,
        ageInDays: task.createdAt ? Math.floor((Date.now() - task.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24)) : 0
      }))
      .sort((a, b) => (b.ageInDays >= 3 ? 1 : 0) - (a.ageInDays >= 3 ? 1 : 0));
    
    const completed = tasks
      .filter((t) => t.completedAt || t.completed)
      .sort((a, b) => {
        const aTime = a.completedAt ? (a.completedAt.toDate ? a.completedAt.toDate().getTime() : a.completedAt.getTime()) : Date.now();
        const bTime = b.completedAt ? (b.completedAt.toDate ? b.completedAt.toDate().getTime() : b.completedAt.getTime()) : Date.now();
        return bTime - aTime;
      });
    
    return [...incomplete, ...completed];
  }, [tasks]);

  const completedTaskCount = useMemo(() => tasks.filter((t) => t.completedAt).length, [tasks]);

  // One-time field migration for old tasks (only runs once per user session)
  const [hasRunFieldMigration, setHasRunFieldMigration] = useState(false);
  const [hasRunTemplateCleanup, setHasRunTemplateCleanup] = useState(false);
  
  const runFieldMigrationOnce = useCallback(async () => {
    if (!user || !db) return;
    // In development, always run migration to catch issues
    if (process.env.NODE_ENV === 'production' && hasRunFieldMigration) return;
    
    setHasRunFieldMigration(true);
    
    try {
      const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      const tasksToUpdate = [];
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const needsUpdate = (
          typeof data.dismissed === 'undefined' ||
          typeof data.deleted === 'undefined'
        );
        
        if (needsUpdate) {
          const updates = {};
          if (typeof data.dismissed === 'undefined') updates.dismissed = false;
          if (typeof data.deleted === 'undefined') updates.deleted = false;
          
          tasksToUpdate.push({ id: docSnap.id, updates });
        }
      });
      
      // Batch update all tasks that need field migration
      if (tasksToUpdate.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[MIGRATION] Updating ${tasksToUpdate.length} tasks with missing fields`);
        }
        await Promise.all(
          tasksToUpdate.map(({ id, updates }) => 
            updateDoc(doc(db, 'tasks', id), updates)
          )
        );
        if (process.env.NODE_ENV === 'development') {
          console.log(`[MIGRATION] Field migration completed successfully`);
        }
      }
    } catch (error) {
      // Field migration failed - will retry on next session
      setHasRunFieldMigration(false);
      if (process.env.NODE_ENV === 'development') {
        console.error('[MIGRATION] Field migration failed:', error);
      }
    }
  }, [user, db, hasRunFieldMigration]);

  // One-time cleanup of orphaned template tasks
  const cleanupOrphanedTemplateTasks = useCallback(async () => {
    if (!user || !db) return;
    // In development, always run cleanup to ensure it works
    if (process.env.NODE_ENV === 'production' && hasRunTemplateCleanup) return;
    
    setHasRunTemplateCleanup(true);
    
    try {
      const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      const templateTasksToDelete = [];
      
      snapshot.docs.forEach(docSnap => {
        const taskId = docSnap.id;
        const taskData = docSnap.data();
        const isTemplateTask = (
          taskId.startsWith('rel_') ||
          taskId.startsWith('baby_') ||
          taskId.startsWith('house_') ||
          taskId.startsWith('self_') ||
          taskId.startsWith('admin_') ||
          taskId.startsWith('seas_')
        );
        
        
        if (isTemplateTask) {
          templateTasksToDelete.push({ id: taskId, title: taskData.title });
        }
      });
      
      // Delete orphaned template tasks
      if (templateTasksToDelete.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[CLEANUP] Found ${templateTasksToDelete.length} template tasks to delete:`, templateTasksToDelete);
        }
        
        const deletePromises = templateTasksToDelete.map(async (task) => {
          try {
            await updateDoc(doc(db, 'tasks', task.id), {
              deleted: true,
              deletedAt: Timestamp.now()
            });
          } catch (error) {
            // Template cleanup error - ignore
          }
        });
        
        await Promise.all(deletePromises);
        
        // Template cleanup completed
      }
    } catch (error) {
      // Template cleanup failed - will retry on next session
      setHasRunTemplateCleanup(false);
      if (process.env.NODE_ENV === 'development') {
        console.error('[CLEANUP] Template cleanup failed:', error);
      }
    }
  }, [user, db, hasRunTemplateCleanup]);

  // Helper to refresh all data (simplified since we have real-time listeners)
  const refreshAllData = useCallback(async () => {
    if (!user || !userPreferences) return;
    
    // Real-time listeners handle data updates automatically
    setLoading(false);
  }, [user, userPreferences]);

  // Load today's tasks with OPTIMIZED SERVER-SIDE FILTERING
  const loadTasksRealTime = useCallback(() => {
    if (!user?.uid || !db) return null;

    // Calculate date ranges for server-side filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // FIXED QUERY: Use single inequality filter + client-side filtering
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      where('createdAt', '>=', Timestamp.fromDate(threeDaysAgo)), // Only recent tasks
      orderBy('createdAt', 'desc') // Sort server-side
    );

    // REAL-TIME LISTENER with minimal client-side processing
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
      // Received pre-filtered tasks from Firestore
      
      const relevantTasks = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(task => {
          // Client-side filtering for complex conditions
          if (task.deleted === true) return false;
          if (task.dismissed === true) return false;
          
          const taskDate = task.createdAt?.toDate();
          if (!taskDate) return false;
          
          // Include today's tasks (completed or not)
          if (taskDate >= today) return true;
          
          // Include incomplete tasks from last 3 days
          if (!task.completedAt && !task.completed && taskDate >= threeDaysAgo) return true;
          
          return false;
        });
      
        // Tasks already sorted by Firestore orderBy
        setTasks(relevantTasks);
      },
      (error) => {
        // Handle Firestore errors gracefully
        if (error.code === 'permission-denied') {
          router.push('/login');
        } else if (error.code === 'failed-precondition') {
          // Fallback to simpler query if composite index doesn't exist
          console.warn('Composite index needed for optimal query performance');
          const fallbackQuery = query(
            collection(db, 'tasks'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          // Set up fallback listener with client-side filtering
          return onSnapshot(fallbackQuery, (snapshot) => {
            const allTasks = snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(task => {
                if (task.deleted === true || task.dismissed === true) return false;
                const taskDate = task.createdAt?.toDate();
                if (!taskDate || taskDate < threeDaysAgo) return false;
                return true;
              });
            setTasks(allTasks);
          });
        }
      }
    );

    return unsubscribe;
  }, [user?.uid, db, router]);

  // Load past promises with OPTIMIZED SERVER-SIDE FILTERING
  const loadPastPromisesRealTime = useCallback(() => {
    if (!user?.uid || !db) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // FIXED QUERY: Simple date range + client-side filtering
    const q = query(
      collection(db, 'tasks'), 
      where('userId', '==', user.uid),
      where('source', '==', 'manual'), // Only manual tasks
      where('createdAt', '>=', Timestamp.fromDate(fourteenDaysAgo)), // 14-day window
      where('createdAt', '<', Timestamp.fromDate(today)), // Before today
      orderBy('createdAt', 'desc') // Most recent first
    );

    // OPTIMIZED REAL-TIME LISTENER with minimal client-side processing
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
      // Received pre-filtered tasks from Firestore - much faster!
      
      const pastPromisesReady = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          const createdDate = data.createdAt?.toDate();
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
        .filter(task => {
          // Client-side filtering for complex conditions
          if (task.deleted === true) return false; // Exclude deleted
          if (task.dismissed === true) return false; // Exclude dismissed
          if (task.completedAt) return false; // Exclude completed
          if (task.snoozedUntil && task.snoozedUntil.toDate() > new Date()) return false; // Exclude snoozed
          if (task.lastRestored) {
            const restoredDate = task.lastRestored.toDate();
            const restoredToday = restoredDate >= today && restoredDate < new Date(today.getTime() + 24*60*60*1000);
            if (restoredToday) return false; // Exclude recently restored
          }
          
          // Exclude template task IDs (safety net)
          const isTemplateId = (
            task.id.startsWith('rel_') ||
            task.id.startsWith('baby_') ||
            task.id.startsWith('house_') ||
            task.id.startsWith('self_') ||
            task.id.startsWith('admin_') ||
            task.id.startsWith('seas_')
          );
          
          return !isTemplateId;
        })
        .slice(0, 3); // Limit to 3 most recent (already sorted by server)

        setPastPromises(pastPromisesReady);
      },
      (error) => {
        // Handle Firestore errors gracefully with fallback
        if (error.code === 'permission-denied') {
          router.push('/login');
        } else if (error.code === 'failed-precondition') {
          // Fallback query if composite index doesn't exist yet
          console.warn('Composite index needed for optimal past promises performance');
          const fallbackQuery = query(
            collection(db, 'tasks'),
            where('userId', '==', user.uid),
            where('source', '==', 'manual'),
            orderBy('createdAt', 'desc')
          );
          return onSnapshot(fallbackQuery, (snapshot) => {
            const allTasks = snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(task => {
                if (task.deleted === true || task.dismissed === true) return false;
                const taskDate = task.createdAt?.toDate();
                if (!taskDate || taskDate >= today || taskDate < fourteenDaysAgo) return false;
                if (task.completedAt) return false;
                return true;
              })
              .slice(0, 3);
            setPastPromises(allTasks);
          });
        }
      }
    );

    return unsubscribe;
  }, [user?.uid, db, router]);

  // Handle voice tasks added
  const handleVoiceTasksAdded = useCallback(() => {
    setVoiceSuccess(true);
    setTimeout(() => setVoiceSuccess(false), 3000);
    refreshAllData();
  }, [refreshAllData]);

  // Clear emergency mode
  const clearEmergencyMode = useCallback(() => {
    setEmergencyModeActive(false);
    setActiveModeTemplates([]);
  }, []);

  // Handle emergency mode selection
  const handleEmergencyMode = useCallback((mode) => {
    setEmergencyModeActive(true);
    setActiveModeTemplates(mode.tasks || []);
    setShowEmergencyMode(false);
    refreshAllData();
  }, [refreshAllData]);

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
    if (!db || !user || !user.uid) {
      console.error('[Dashboard] No authenticated user or db for snooze operation', { user: !!user, db: !!db });
      return;
    }
    
    // Snoozing task
    
    const snoozeTime = new Date();
    snoozeTime.setHours(snoozeTime.getHours() + 1);
    
    try {
      // FIRST: Check if document exists
      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (!taskDoc.exists()) {
        // Document doesn't exist - removing from UI
        setPastPromises(prev => prev.filter(t => t.id !== taskId));
        return;
      }
      
      await updateDoc(taskRef, {
        snoozedUntil: Timestamp.fromDate(snoozeTime),
      })
        .catch(error => {
          // Firestore update error
          throw error;
        });
      
      // Task snoozed successfully
      setPastPromises(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      // Failed to snooze task
      // Optionally show user feedback here
    }
  };

  // Track dismissing tasks to prevent double-clicks
  const [dismissingTasks, setDismissingTasks] = useState(new Set());
  
  // Dismiss task
  const dismissTask = async (taskId) => {
    if (!db || !user || !user.uid) {
      return;
    }
    
    // Prevent double-clicks
    if (dismissingTasks.has(taskId)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG] Task ${taskId} already being dismissed - ignoring`);
      }
      return;
    }
    
    setDismissingTasks(prev => new Set(prev).add(taskId));
    
    if (process.env.NODE_ENV === 'development') {
      const isTemplateId = (
        taskId.startsWith('rel_') ||
        taskId.startsWith('baby_') ||
        taskId.startsWith('house_') ||
        taskId.startsWith('self_') ||
        taskId.startsWith('admin_') ||
        taskId.startsWith('seas_')
      );
      console.log(`[DEBUG] Dismissing task ${taskId} (isTemplate: ${isTemplateId})`);
    }
    
    try {
      // FIRST: Check if document exists and isn't already dismissed
      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (!taskDoc.exists()) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEBUG] Task ${taskId} doesn't exist - removing from UI`);
        }
        setPastPromises(prev => prev.filter(t => t.id !== taskId));
        return;
      }
      
      const taskData = taskDoc.data();
      if (taskData.dismissed) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEBUG] Task ${taskId} already dismissed - removing from UI`);
        }
        setPastPromises(prev => prev.filter(t => t.id !== taskId));
        return;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG] Updating task ${taskId} in Firestore with dismissed: true`);
      }
      
      await updateDoc(taskRef, {
        dismissed: true,
        dismissedAt: Timestamp.now(),
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG] ✅ Task ${taskId} dismissed successfully in Firestore`);
      }
      
      // Task dismissed successfully - remove from UI
      setPastPromises(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[DEBUG] ❌ Failed to dismiss task ${taskId}:`, error);
      }
      // Don't remove from UI if there was an error
    } finally {
      // Always remove from dismissing set
      setDismissingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
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

  // Improved auth state management with better race condition handling
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;
    let stabilizationTimer;

    const handleAuthStateChange = (currentUser) => {
      if (!mounted) return;
      
      if (currentUser) {
        setUser(currentUser);
        setAuthLoading(false);
        if (stabilizationTimer) {
          clearTimeout(stabilizationTimer);
          stabilizationTimer = null;
        }
      } else {
        setUser(null);
        // Only redirect if we've given auth time to initialize
        stabilizationTimer = setTimeout(() => {
          if (mounted && !currentUser) {
            router.push('/login');
          }
        }, 1000);
        setAuthLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);

    return () => {
      mounted = false;
      if (stabilizationTimer) {
        clearTimeout(stabilizationTimer);
      }
      unsubscribe();
    };
  }, [auth, router]);

  // Load user data and tasks with proper error handling
  useEffect(() => {
    if (!user?.uid || !db) return;

    let mounted = true;

    const loadUserData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!mounted) return;
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          
          if (data.preferences?.hasSetup) {
            setUserPreferences(data.preferences);
          } else {
            setShowPreferences(true);
          }
        } else {
          await setDoc(userRef, {
            streakCount: 0,
            lastTaskCompletionDate: null,
          });
          if (mounted) {
            setShowPreferences(true);
          }
        }
      } catch (error) {
        if (mounted && error.code === 'permission-denied') {
          router.push('/login');
        }
      }
    };

    loadUserData();
    
    return () => {
      mounted = false;
    };
  }, [user?.uid, db, router]);

  // Load tasks and promises when ready (with real-time listeners + auto-cleanup)
  useEffect(() => {
    if (!user || showPreferences || !userPreferences || !db) return;

    // Setting up real-time listeners and one-time field migration
    
    const initializeDashboard = async () => {
      // Run field migration and ensure it completes
      await runFieldMigrationOnce();
      
      // Clean up orphaned template tasks
      await cleanupOrphanedTemplateTasks();
      
      // Small delay to ensure all writes are committed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set up real-time listeners
      const tasksUnsubscribe = loadTasksRealTime();
      const pastPromisesUnsubscribe = loadPastPromisesRealTime();
      
      setLoading(false);
      
      return { tasksUnsubscribe, pastPromisesUnsubscribe };
    };
    
    const cleanup = initializeDashboard();
    
    // Return cleanup function with proper error handling
    return () => {
      cleanup.then(({ tasksUnsubscribe, pastPromisesUnsubscribe }) => {
        // Unsubscribing from real-time listeners
        try {
          if (tasksUnsubscribe) tasksUnsubscribe();
          if (pastPromisesUnsubscribe) pastPromisesUnsubscribe();
        } catch (error) {
          // Ignore cleanup errors
        }
      }).catch(() => {
        // Ignore initialization errors during cleanup
      });
    };
  }, [user, userPreferences, showPreferences, loadTasksRealTime, loadPastPromisesRealTime, runFieldMigrationOnce, cleanupOrphanedTemplateTasks, db]);

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

          {/* Notification Permission Request */}
          {user && messaging && (
            <NotificationPermission
              messaging={messaging}
              user={user}
              db={db}
            />
          )}

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
              onTaskComplete={(taskId) => {
                // Optimistic update: immediately mark task as completed
                setTasks(prev => {
                  const updated = prev.map(task => 
                    task.id === taskId 
                      ? { ...task, completed: true, completedAt: Timestamp.now() }
                      : task
                  );
                  return updated;
                });
                
                // DON'T refresh immediately - let optimistic update show first
                // setTimeout(() => refreshAllData(), 2000); // Wait 2 seconds instead of 500ms
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
                // Add task error
                setTasks(prev => prev.filter(t => !t.id.startsWith('temp-')));
                throw error;
              }
            }}
            initialTitle={newTaskTitle}
            initialDetail={newTaskDetail}
            initialCategory={newTaskCategory}
            initialPriority={newTaskPriority}
          />

          {/* Recurring Task Manager - Lazy Loaded */}
          {showRecurringForm && (
            <Suspense fallback={<DashboardLoading message="Loading recurring tasks..." />}>
              <LazyRecurringTaskManager
                isVisible={showRecurringForm}
                onSave={saveRecurringTask}
                onClose={() => setShowRecurringForm(false)}
              />
            </Suspense>
          )}

          {/* Emergency Mode Selector - Lazy Loaded */}
          {showEmergencyMode && (
            <Suspense fallback={<DashboardLoading message="Loading emergency mode..." />}>
              <LazyEmergencyModeSelector
                isVisible={showEmergencyMode}
                onModeSelect={handleEmergencyMode}
                onClose={() => setShowEmergencyMode(false)}
              />
            </Suspense>
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
