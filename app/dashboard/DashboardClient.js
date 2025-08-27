'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { PlusIcon, SparklesIcon, CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
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
  deleteDoc,
} from 'firebase/firestore';
import { initializeFirebaseClient } from '@/lib/firebase-client';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { generateSmartDailyTasks } from '@/constants/tasks';
import UserPreferences from '@/components/UserPreferences';
import PullToRefresh from '@/components/PullToRefresh';
import RecurringTaskManager from '@/components/RecurringTaskManager';
import EmergencyModeSelector from '@/components/EmergencyModeSelector';
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
import DailyTaskSuggestions from '@/components/DailyTaskSuggestions';
import EventReminder from '@/components/EventReminder';

// Mobile components
import MobileDashboard from '@/components/MobileDashboard';
import MobileTaskForm from '@/components/MobileTaskForm';

// Project components
import ProjectCard from '@/components/ProjectCard';
import ProjectBreakdown from '@/components/ProjectBreakdown';

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
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileTaskForm, setShowMobileTaskForm] = useState(false);
  const [showSuggestionsSection, setShowSuggestionsSection] = useState(false);
  const [showPlanningSection, setShowPlanningSection] = useState(false);
  const [showProjectBreakdown, setShowProjectBreakdown] = useState(false);
  const [projectBreakdownTask, setProjectBreakdownTask] = useState('');

  // Initialize Firebase on client side only
  useEffect(() => {
    const { auth, db } = initializeFirebaseClient();
    setFirebaseInstances({ auth, db });
    
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Extract auth and db for easier access
  const { auth, db } = firebaseInstances;

  // Separate tasks from projects and sort them
  const { regularTasks, projects } = useMemo(() => {
    const regular = [];
    const proj = [];
    
    tasks.forEach(task => {
      if (task.isProject) {
        proj.push(task);
      } else {
        regular.push(task);
      }
    });
    
    // Sort regular tasks
    const incompleteRegular = regular
      .filter((t) => !t.completedAt && !t.completed)
      .map(task => ({
        ...task,
        ageInDays: task.createdAt ? Math.floor((Date.now() - task.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24)) : 0
      }))
      .sort((a, b) => (b.ageInDays >= 3 ? 1 : 0) - (a.ageInDays >= 3 ? 1 : 0));
    
    const completedRegular = regular
      .filter((t) => t.completedAt || t.completed)
      .sort((a, b) => {
        const aTime = a.completedAt ? (a.completedAt.toDate ? a.completedAt.toDate().getTime() : a.completedAt.getTime()) : Date.now();
        const bTime = b.completedAt ? (b.completedAt.toDate ? b.completedAt.toDate().getTime() : b.completedAt.getTime()) : Date.now();
        return bTime - aTime;
      });
    
    const sortedRegular = [...incompleteRegular, ...completedRegular];
    
    // Sort projects by last activity
    const sortedProjects = proj
      .filter(p => !p.completedAt && !p.completed) // Only show active projects
      .sort((a, b) => {
        const aActivity = a.lastActivityAt?.toDate() || a.createdAt?.toDate() || new Date(0);
        const bActivity = b.lastActivityAt?.toDate() || b.createdAt?.toDate() || new Date(0);
        return bActivity - aActivity;
      });
    
    return {
      regularTasks: sortedRegular,
      projects: sortedProjects
    };
  }, [tasks]);

  const sortedTasks = regularTasks; // Keep this for backward compatibility

  const completedTaskCount = useMemo(() => tasks.filter((t) => t.completedAt).length, [tasks]);

  // Project detection keywords
  const PROJECT_KEYWORDS = [
    'organize', 'clean', 'build', 'plan', 'prepare', 'renovate', 'setup', 'create',
    'install', 'design', 'research', 'develop', 'implement', 'fix', 'repair'
  ];

  const mightBeProject = (title) => {
    return PROJECT_KEYWORDS.some(word => 
      title.toLowerCase().includes(word)
    );
  };

  const handleProjectComplete = async (projectId) => {
    if (!db) return;
    
    const confirmComplete = confirm('Mark this entire project as complete?');
    if (!confirmComplete) return;

    try {
      await updateDoc(doc(db, 'tasks', projectId), {
        completed: true,
        completedAt: Timestamp.now(),
        projectStatus: 'completed'
      });
      
      await refreshAllData();
    } catch (error) {
      console.error('Error completing project:', error);
    }
  };

  const handleCreateProject = async (projectData) => {
    if (!user || !db) return;

    try {
      const newProject = {
        title: projectData.title,
        isProject: true,
        subtasks: projectData.subtasks,
        userId: user.uid,
        createdAt: Timestamp.now(),
        lastActivityAt: Timestamp.now(),
        projectStatus: 'active',
        source: 'manual',
        dismissed: false,
        deleted: false,
      };

      await addDoc(collection(db, 'tasks'), newProject);
      await refreshAllData();
      
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleCreateSimpleTask = async (taskData) => {
    if (!user || !db) return;

    try {
      const newTask = {
        title: taskData.title,
        detail: taskData.detail || '',
        category: taskData.category || 'household',
        priority: taskData.priority || 'medium',
        isProject: false,
        userId: user.uid,
        createdAt: Timestamp.now(),
        source: 'manual',
        dismissed: false,
        deleted: false,
      };

      await addDoc(collection(db, 'tasks'), newTask);
      await refreshAllData();
      
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

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

    // Simplest possible query - just fetch user's tasks
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid)
    );

    const snapshot = await getDocs(q);
    const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter and sort everything client-side - ONLY TODAY'S TASKS + recent incomplete
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const relevantTasks = allTasks
      .filter(task => {
        // EXCLUDE TEMPLATE TASKS FROM MAIN TASK LIST
        const isTemplateId = (
          task.id.startsWith('rel_') ||
          task.id.startsWith('baby_') ||
          task.id.startsWith('house_') ||
          task.id.startsWith('self_') ||
          task.id.startsWith('admin_') ||
          task.id.startsWith('seas_')
        );
        if (isTemplateId) {
          return false;
        }
        
        // EXCLUDE DISMISSED AND DELETED TASKS
        if (task.dismissed === true || task.deleted === true) return false;
        
        if (!task.createdAt) return false;
        const taskDate = task.createdAt.toDate();
        
        // Include today's incomplete tasks
        if (taskDate >= today && !task.completedAt && !task.completed) return true;
        
        // Include today's completed tasks (but we'll sort them to bottom)
        if (taskDate >= today && (task.completedAt || task.completed)) return true;
        
        // Include incomplete tasks from last 3 days 
        if (!task.completedAt && !task.completed && taskDate >= threeDaysAgo && taskDate < today) return true;
        
        return false;
      })
      .sort((a, b) => {
        // Sort by creation date, newest first
        const aDate = a.createdAt?.toDate?.() || new Date(0);
        const bDate = b.createdAt?.toDate?.() || new Date(0);
        return bDate.getTime() - aDate.getTime();
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

    // Clean up legacy data that might be missing fields
    const cleanupPromises = [];
    
    const eligibleTasks = snapshot.docs.filter((docSnap) => {
      const data = docSnap.data();
      const createdDate = data.createdAt?.toDate();
      
      // Clean up missing fields on legacy tasks
      if (data.dismissed === undefined || data.deleted === undefined) {
        cleanupPromises.push(
          updateDoc(docSnap.ref, {
            dismissed: data.dismissed || false,
            deleted: data.deleted || false,
          })
        );
      }
      
      // EXCLUDE TEMPLATE TASKS COMPLETELY
      const isTemplateId = (
        docSnap.id.startsWith('rel_') ||
        docSnap.id.startsWith('baby_') ||
        docSnap.id.startsWith('house_') ||
        docSnap.id.startsWith('self_') ||
        docSnap.id.startsWith('admin_') ||
        docSnap.id.startsWith('seas_')
      );
      if (isTemplateId) {
        return false;
      }
      
      // EXCLUDE DISMISSED TASKS
      if (data.dismissed === true) {
        return false;
      }
      
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

    // Execute cleanup of legacy fields
    if (cleanupPromises.length > 0) {
      try {
        await Promise.all(cleanupPromises);
      } catch (error) {
        console.error('Error updating legacy fields:', error);
      }
    }

    // FINAL SAFETY NET: Filter out any template tasks that somehow made it through
    const safePastPromises = past.filter(task => {
      const isTemplateId = (
        task.id.startsWith('rel_') ||
        task.id.startsWith('baby_') ||
        task.id.startsWith('house_') ||
        task.id.startsWith('self_') ||
        task.id.startsWith('admin_') ||
        task.id.startsWith('seas_')
      );
      return !isTemplateId;
    });
    
    setPastPromises(safePastPromises);
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

  // Cleanup template tasks from database
  const cleanupTemplateTasks = async () => {
    if (!db || !user?.uid) {
      console.error('Cannot cleanup: missing db or user');
      return;
    }
    
    try {
      console.log('🧹 Starting template task cleanup...');
      
      const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      console.log(`📊 Checking ${snapshot.docs.length} total tasks for templates...`);
      
      const templateTasks = [];
      const templatePrefixes = ['rel_', 'baby_', 'house_', 'self_', 'admin_', 'seas_'];
      
      // Template task titles to search for
      const templateTitles = [
        'Ask how her day was',
        'Put your phone away at dinner',
        'Text her something appreciative',
        'Clean up after dinner',
        'Sit and talk for 5 mins',
        'Tell her one thing she\'s great at',
        'Wipe kitchen counters',
        'Quick toy pickup',
        'Take out trash',
        'Ask how she slept'
      ];
      
      snapshot.docs.forEach((docSnap) => {
        const taskId = docSnap.id;
        const taskData = docSnap.data();
        
        // Check by ID prefix OR by matching template content
        const isTemplateById = templatePrefixes.some(prefix => taskId.startsWith(prefix));
        const isTemplateByTitle = templateTitles.some(title => 
          taskData.title && taskData.title.toLowerCase().includes(title.toLowerCase())
        );
        
        if (isTemplateById || isTemplateByTitle) {
          console.log(`🎯 Found template task: ${taskId} - ${taskData.title} (byId: ${isTemplateById}, byTitle: ${isTemplateByTitle})`);
          templateTasks.push({
            id: taskId,
            title: taskData.title,
            ref: docSnap.ref
          });
        }
      });
      
      console.log(`Found ${templateTasks.length} template tasks:`, templateTasks);
      
      if (templateTasks.length === 0) {
        alert('✅ No template tasks found. Database is clean!');
        return;
      }
      
      const confirmed = confirm(`⚠️ Delete ${templateTasks.length} template tasks from database?\n\nTasks to delete:\n${templateTasks.map(t => `- ${t.id}: ${t.title}`).join('\n')}`);
      if (!confirmed) return;
      
      console.log('🗑️ Deleting template tasks...');
      await Promise.all(templateTasks.map(task => {
        console.log(`   Deleting: ${task.id}`);
        return deleteDoc(task.ref);
      }));
      
      console.log('✅ Deleted all template tasks!');
      alert('✅ Template tasks deleted! Refreshing dashboard...');
      
      await refreshAllData();
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      alert('❌ Cleanup failed. Check console for details.');
    }
  };

  // Dismiss task
  const dismissTask = async (taskId) => {
    if (!db || !user?.uid) {
      return;
    }
    
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        dismissed: true,
        dismissedAt: Timestamp.now(),
      });
      
      // Refresh data to ensure dismissed task doesn't reappear
      await loadPastPromises();
    } catch (error) {
      console.error('Error dismissing task:', error);
      
      // Check for various not-found error patterns
      const isNotFound = error.code === 'not-found' || 
                        error.message?.includes('No document to update') ||
                        error.message?.includes('not found');
      
      if (isNotFound) {
        // Remove from pastPromises state since it doesn't exist in database
        setPastPromises(prev => prev.filter(t => t.id !== taskId));
        setTasks(prev => prev.filter(t => t.id !== taskId));
      } else if (error.code === 'permission-denied') {
        router.push('/login');
      }
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

  // Mobile-optimized dashboard - check EARLY before any other rendering
  if (isMobile) {
    // Create mobile-specific handlers
    const handleMobileTaskComplete = async (taskId) => {
      if (!user || !db) return;
      try {
        await updateDoc(doc(db, 'tasks', taskId), {
          completed: true,
          completedAt: Timestamp.now()
        });
        await refreshAllData();
      } catch (error) {
        console.error('Error completing task:', error);
      }
    };

    const handleMobileTaskAdd = async (taskData) => {
      if (!user || !db) return;
      try {
        const newTask = {
          ...taskData,
          userId: user.uid,
          createdAt: Timestamp.now(),
          dismissed: false,
          deleted: false
        };
        await addDoc(collection(db, 'tasks'), newTask);
        await refreshAllData();
      } catch (error) {
        console.error('Error adding task:', error);
      }
    };

    // Show mobile loading state
    if (loading && !tasks.length) {
      return <DashboardLoading showSkeleton={true} />;
    }

    return (
      <TaskErrorBoundary>
        <MobileDashboard
          tasks={sortedTasks}
          suggestions={generateSmartDailyTasks(userPreferences, user?.homeId)}
          onTaskComplete={handleMobileTaskComplete}
          onTaskAdd={handleMobileTaskAdd}
          onShowTaskForm={() => setShowMobileTaskForm(true)}
          streak={streakCount}
          upcomingEvents={[]} // You can integrate personal events here
        />
        
        <MobileTaskForm
          isOpen={showMobileTaskForm}
          onClose={() => setShowMobileTaskForm(false)}
          onSubmit={handleMobileTaskAdd}
        />
      </TaskErrorBoundary>
    );
  }

  // Desktop loading check
  if (loading && !tasks.length) {
    return <DashboardLoading showSkeleton={true} />;
  }

  // Desktop dashboard with mobile-first design principles
  return (
    <TaskErrorBoundary>
      <PullToRefresh onRefresh={refreshAllData}>
        <main className="max-w-2xl mx-auto p-4">
          
          {/* Simplified Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{greeting}</h1>
            <p className="text-gray-600">{dateStr}</p>
            {streakCount > 0 && (
              <p className="text-sm text-green-600 mt-1">🔥 {streakCount} day streak</p>
            )}
          </div>

          {/* TODAY'S TASKS - PRIMARY FOCUS (70% of visual importance) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Today&apos;s Focus</h2>
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Add Task
              </button>
            </div>
            
            {/* Projects Section */}
            {!loading && projects.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                  🎯 Active Projects ({projects.length})
                </h3>
                {projects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    db={db}
                    onUpdate={refreshAllData}
                    onComplete={handleProjectComplete}
                  />
                ))}
              </div>
            )}

            {/* Regular Tasks Section */}
            {!loading && regularTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                  ✓ Quick Tasks ({regularTasks.filter(t => !t.completed && !t.completedAt).length})
                </h3>
                <TaskList
                  tasks={regularTasks}
                  db={db}
                  user={user}
                  onTaskUpdate={refreshAllData}
                  onTaskDelete={(taskId) => {
                    setTasks(prev => prev.filter(t => t.id !== taskId));
                  }}
                  onTaskComplete={(taskId) => {
                    // Optimistic update: immediately mark task as completed
                    setTasks(prev => 
                      prev.map(task => 
                        task.id === taskId 
                          ? { ...task, completed: true, completedAt: Timestamp.now() }
                          : task
                      )
                    );
                  }}
                  loading={loading}
                />
              </div>
            )}

            {/* Empty state */}
            {!loading && projects.length === 0 && regularTasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No tasks yet today!</p>
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Your First Task
                </button>
              </div>
            )}
          </div>

          {/* COLLAPSIBLE SECTIONS - Secondary */}
          <div className="space-y-4">
            {/* Suggestions Dropdown */}
            <div className="bg-gray-50 rounded-xl p-4">
              <button
                onClick={() => setShowSuggestionsSection(!showSuggestionsSection)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-800">Get Suggestions</span>
                  {tasks.length < 3 && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Add more tasks</span>
                  )}
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${showSuggestionsSection ? 'rotate-180' : ''}`} />
              </button>
              
              {showSuggestionsSection && (
                <div className="mt-4 space-y-2">
                  {generateSmartDailyTasks(userPreferences, user?.homeId).slice(0, 5).map((suggestion, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex-grow">
                        <div className="font-medium text-gray-900">{suggestion.title}</div>
                        {suggestion.detail && (
                          <div className="text-sm text-gray-600 mt-1">{suggestion.detail}</div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            suggestion.category === 'personal' ? 'bg-indigo-100 text-indigo-700' :
                            suggestion.category === 'relationship' ? 'bg-rose-100 text-rose-700' :
                            suggestion.category === 'household' ? 'bg-emerald-100 text-emerald-700' :
                            suggestion.category === 'baby' ? 'bg-amber-100 text-amber-700' :
                            suggestion.category === 'home_projects' ? 'bg-orange-100 text-orange-700' :
                            suggestion.category === 'health' ? 'bg-cyan-100 text-cyan-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {suggestion.category.replace('_', ' ')}
                          </span>
                          {suggestion.priority === 'high' && (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">urgent</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const newTask = {
                              ...suggestion,
                              userId: user.uid,
                              createdAt: Timestamp.now(),
                              source: 'suggestion',
                              dismissed: false,
                              deleted: false,
                            };
                            await addDoc(collection(db, 'tasks'), newTask);
                            await refreshAllData();
                            // Haptic feedback
                            if ('vibrate' in navigator) {
                              navigator.vibrate(10);
                            }
                          } catch (error) {
                            console.error('Error adding task:', error);
                          }
                        }}
                        className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Planning & Events Dropdown */}
            <div className="bg-gray-50 rounded-xl p-4">
              <button
                onClick={() => setShowPlanningSection(!showPlanningSection)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-800">Planning & Events</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${showPlanningSection ? 'rotate-180' : ''}`} />
              </button>
              
              {showPlanningSection && (
                <div className="mt-4">
                  <EventReminder
                    user={user}
                    db={db}
                    onTaskAdded={refreshAllData}
                  />
                </div>
              )}
            </div>

            {/* Past Promises - Collapsible */}
            {pastPromises.length > 0 && (
              <PastPromises
                pastPromises={pastPromises}
                onRestoreTask={restoreToToday}
                onSnoozeTask={snoozeTask}
                onDismissTask={dismissTask}
              />
            )}
          </div>

          {/* Task Form Modal */}
          <TaskForm
            isOpen={showTaskForm}
            onClose={() => setShowTaskForm(false)}
            onSubmit={async (taskData) => {
              setShowTaskForm(false);
              
              // Check if this might be a project
              if (mightBeProject(taskData.title)) {
                setProjectBreakdownTask(taskData.title);
                setShowProjectBreakdown(true);
                return;
              }

              // Create simple task
              await handleCreateSimpleTask({
                ...taskData,
                isProject: false
              });
            }}
            initialTitle={newTaskTitle}
            initialDetail={newTaskDetail}
            initialCategory={newTaskCategory}
            initialPriority={newTaskPriority}
          />

          {/* Project Breakdown Modal */}
          <ProjectBreakdown
            isOpen={showProjectBreakdown}
            onClose={() => setShowProjectBreakdown(false)}
            taskTitle={projectBreakdownTask}
            onCreateProject={handleCreateProject}
            onCreateSimpleTask={handleCreateSimpleTask}
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
