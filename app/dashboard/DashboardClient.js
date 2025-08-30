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
import SidekickChat from '@/components/SidekickChat';

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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userTier, setUserTier] = useState('free');
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
  
  // AI Helper and Undo functionality
  const [showSidekickChat, setShowSidekickChat] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState([]);

  // Initialize Firebase on client side only
  useEffect(() => {
    const { auth, db, functions } = initializeFirebaseClient();
    setFirebaseInstances({ auth, db, functions });
    
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Extract auth, db, and functions for easier access
  const { auth, db, functions } = firebaseInstances;

  // Separate tasks from projects and sort them
  const { regularTasks, projects } = useMemo(() => {
    const regular = [];
    const proj = [];
    
    tasks.forEach(task => {
      try {
        if (task.isProject) {
          // Validate project has required fields
          if (task.subtasks && Array.isArray(task.subtasks)) {
            proj.push(task);
          } else {
            console.warn('Project missing subtasks:', task.id);
            // Convert to regular task if project is malformed
            regular.push({ ...task, isProject: false });
          }
        } else {
          regular.push(task);
        }
      } catch (error) {
        console.error('Error processing task:', task.id, error);
      }
    });
    
    // Sort regular tasks with error handling
    const incompleteRegular = regular
      .filter((t) => {
        // Filter out completed tasks
        if (t.completedAt || t.completed) return false;
        
        // Filter out snoozed tasks that haven't reached their snooze time yet
        if (t.snoozedUntil) {
          try {
            const snoozeTime = typeof t.snoozedUntil.toDate === 'function' 
              ? t.snoozedUntil.toDate() 
              : new Date(t.snoozedUntil);
            const now = new Date();
            if (now < snoozeTime) {
              return false; // Task is still snoozed
            }
          } catch (error) {
            console.warn('Error processing snooze time for task:', t.id, error);
            // If there's an error processing the snooze time, show the task anyway
          }
        }
        
        return true;
      })
      .map(task => {
        try {
          const ageInDays = task.createdAt && typeof task.createdAt.toDate === 'function'
            ? Math.floor((Date.now() - task.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          return { ...task, ageInDays };
        } catch (error) {
          console.error('Error calculating age for task:', task.id, error);
          return { ...task, ageInDays: 0 };
        }
      })
      .sort((a, b) => (b.ageInDays >= 3 ? 1 : 0) - (a.ageInDays >= 3 ? 1 : 0));
    
    const completedRegular = regular
      .filter((t) => t.completedAt || t.completed)
      .sort((a, b) => {
        try {
          const aTime = a.completedAt 
            ? (typeof a.completedAt.toDate === 'function' ? a.completedAt.toDate().getTime() : Date.now())
            : Date.now();
          const bTime = b.completedAt 
            ? (typeof b.completedAt.toDate === 'function' ? b.completedAt.toDate().getTime() : Date.now())
            : Date.now();
          return bTime - aTime;
        } catch (error) {
          console.error('Error sorting completed tasks:', error);
          return 0;
        }
      });
    
    const sortedRegular = [...incompleteRegular, ...completedRegular];
    
    // Sort projects by last activity with error handling
    const sortedProjects = proj
      .filter(p => !p.completedAt && !p.completed) // Only show active projects
      .sort((a, b) => {
        try {
          const getActivityDate = (project) => {
            if (project.lastActivityAt && typeof project.lastActivityAt.toDate === 'function') {
              return project.lastActivityAt.toDate();
            }
            if (project.createdAt && typeof project.createdAt.toDate === 'function') {
              return project.createdAt.toDate();
            }
            return new Date(0);
          };
          
          const aActivity = getActivityDate(a);
          const bActivity = getActivityDate(b);
          return bActivity - aActivity;
        } catch (error) {
          console.error('Error sorting projects:', error);
          return 0;
        }
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
      // Check for recent duplicate tasks (same title in last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentDuplicate = tasks.find(task => 
        task.title.toLowerCase() === taskData.title.toLowerCase() &&
        task.createdAt?.toDate?.() > oneHourAgo
      );
      
      if (recentDuplicate) {
        console.warn('Preventing duplicate task creation:', taskData.title);
        alert('You just created a similar task recently. Skipping duplicate.');
        return;
      }

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

  // AI Helper handlers
  const handleOpenChat = (task) => {
    setSelectedTask(task);
    setShowSidekickChat(true);
  };

  const handleCloseChat = () => {
    setShowSidekickChat(false);
    setSelectedTask(null);
  };

  // Undo functionality
  const handleTaskUndo = async (taskId) => {
    if (!db) return;
    
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        completed: false,
        completedAt: null
      });
      
      // Remove from recently completed
      setRecentlyCompleted(prev => prev.filter(t => t.id !== taskId));
      
      await refreshAllData();
    } catch (error) {
      console.error('Error undoing task:', error);
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

    try {
      // Simplest possible query - just fetch user's tasks
      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid)
      );

      const snapshot = await getDocs(q);
      console.log(`[LoadTasks] Found ${snapshot.docs.length} tasks for user ${user.uid}`);
      
      const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter and sort everything client-side - ONLY TODAY'S TASKS + recent incomplete
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const relevantTasks = allTasks
        .filter(task => {
          try {
            // EXCLUDE TEMPLATE TASKS FROM MAIN TASK LIST - More comprehensive check
            const isTemplateId = (
              task.id.startsWith('rel_') ||
              task.id.startsWith('baby_') ||
              task.id.startsWith('house_') ||
              task.id.startsWith('self_') ||
              task.id.startsWith('admin_') ||
              task.id.startsWith('seas_') ||
              // Additional template patterns that might slip through
              task.id.length < 10 || // Template IDs are usually short
              /^[a-z]+_\d+$/.test(task.id) // Pattern like "rel_014"
            );
            if (isTemplateId) {
              return false;
            }
            
            // EXCLUDE DISMISSED AND DELETED TASKS
            if (task.dismissed === true || task.deleted === true) return false;
            
            // Safe date handling
            if (!task.createdAt || typeof task.createdAt.toDate !== 'function') return false;
            const taskDate = task.createdAt.toDate();
            
            // Skip tasks with future dates (likely corrupted data)
            if (taskDate > new Date()) {
              console.warn('Skipping future-dated task:', task.id, taskDate);
              return false;
            }
            
            // Include today's incomplete tasks
            if (taskDate >= today && !task.completedAt && !task.completed) return true;
            
            // Include today's completed tasks (but we'll sort them to bottom)
            if (taskDate >= today && (task.completedAt || task.completed)) return true;
            
            // Include incomplete tasks from last 7 days (more permissive)
            if (!task.completedAt && !task.completed && taskDate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) return true;
            
            // Temporarily show ALL incomplete tasks to help recover your tasks
            if (!task.completedAt && !task.completed) return true;
            
            return false;
          } catch (error) {
            console.error('Error filtering task:', task.id, error);
            return false; // Skip problematic tasks
          }
        })
        .sort((a, b) => {
          try {
            // Sort by creation date, newest first
            const aDate = a.createdAt?.toDate?.() || new Date(0);
            const bDate = b.createdAt?.toDate?.() || new Date(0);
            return bDate.getTime() - aDate.getTime();
          } catch (error) {
            console.error('Error sorting tasks:', error);
            return 0;
          }
        });
      
      console.log(`[LoadTasks] Filtered to ${relevantTasks.length} relevant tasks`);
      setTasks(relevantTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      // Set empty tasks array to prevent infinite loading
      setTasks([]);
      throw error; // Let TaskErrorBoundary handle this
    }
  }, [user, db]);

  // Load past promises
  const loadPastPromises = useCallback(async () => {
    if (!user || !db) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      // Clean up legacy data that might be missing fields
      const cleanupPromises = [];
      
      const eligibleTasks = snapshot.docs.filter((docSnap) => {
        try {
          const data = docSnap.data();
          
          // Safe date handling
          if (!data.createdAt || typeof data.createdAt.toDate !== 'function') return false;
          const createdDate = data.createdAt.toDate();
          
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
            docSnap.id.startsWith('seas_') ||
            // Additional template patterns
            docSnap.id.length < 10 ||
            /^[a-z]+_\d+$/.test(docSnap.id)
          );
          if (isTemplateId) {
            return false;
          }
          
          // EXCLUDE DISMISSED TASKS
          if (data.dismissed === true) {
            return false;
          }
          
          if (data.lastRestored && typeof data.lastRestored.toDate === 'function') {
            const restoredDate = data.lastRestored.toDate();
            const restoredToday = restoredDate >= today && restoredDate < new Date(today.getTime() + 24*60*60*1000);
            if (restoredToday) return false;
          }
          
          if (data.completedAt) return false;
          if (data.snoozedUntil && typeof data.snoozedUntil.toDate === 'function' && data.snoozedUntil.toDate() > new Date()) return false;
          
          const daysSinceCreated = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
          return daysSinceCreated >= 1 && daysSinceCreated <= 14 && data.source === 'manual';
        } catch (error) {
          console.error('Error filtering past promise:', docSnap.id, error);
          return false; // Skip problematic tasks
        }
      });

      const past = eligibleTasks
        .map((docSnap) => {
          try {
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
          } catch (error) {
            console.error('Error mapping past promise:', docSnap.id, error);
            return null;
          }
        })
        .filter(task => task !== null) // Remove any null tasks from errors
        .sort((a, b) => {
          try {
            return b.ageLabel.localeCompare(a.ageLabel);
          } catch (error) {
            console.error('Error sorting past promises:', error);
            return 0;
          }
        })
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
        try {
          const isTemplateId = (
            task.id.startsWith('rel_') ||
            task.id.startsWith('baby_') ||
            task.id.startsWith('house_') ||
            task.id.startsWith('self_') ||
            task.id.startsWith('admin_') ||
            task.id.startsWith('seas_')
          );
          return !isTemplateId;
        } catch (error) {
          console.error('Error filtering template task:', task.id, error);
          return false;
        }
      });
      
      setPastPromises(safePastPromises);
    } catch (error) {
      console.error('Error loading past promises:', error);
      // Set empty array to prevent crashes
      setPastPromises([]);
      // Don't throw here - past promises are secondary to main tasks
    }
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
    if (!db || !user) return;
    
    try {
      const taskDoc = await getDoc(doc(db, 'tasks', taskId));
      if (taskDoc.exists()) {
        const data = taskDoc.data();
        const now = Timestamp.now();
        
        // Update the task to move it to today
        await updateDoc(doc(db, 'tasks', taskId), {
          createdAt: now,
          lastRestored: now,
          restoreCount: (data.restoreCount || 0) + 1,
          dismissed: false,  // Clear any dismissed status
          snoozedUntil: null, // Clear any snooze
        });
        
        // Remove from past promises immediately for UI feedback
        setPastPromises(prev => prev.filter(t => t.id !== taskId));
        
        // Refresh all data to ensure proper display
        await refreshAllData();
      }
    } catch (error) {
      console.error('Error restoring task:', error);
      alert('Error moving task to today. Please try again.');
    }
  };

  // Snooze task
  const snoozeTask = async (taskId) => {
    if (!db || !user) return;
    
    try {
      // Snooze until tomorrow morning (9 AM)
      const snoozeTime = new Date();
      snoozeTime.setDate(snoozeTime.getDate() + 1);
      snoozeTime.setHours(9, 0, 0, 0);
      
      await updateDoc(doc(db, 'tasks', taskId), {
        snoozedUntil: Timestamp.fromDate(snoozeTime),
        lastActivityAt: Timestamp.now()
      });
      
      // Remove from past promises immediately for UI feedback
      setPastPromises(prev => prev.filter(t => t.id !== taskId));
      
      // Refresh to update task lists
      await refreshAllData();
    } catch (error) {
      console.error('Error snoozing task:', error);
      alert('Error snoozing task. Please try again.');
    }
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
      const templatePrefixes = ['rel_', 'baby_', 'house_', 'self_', 'admin_', 'seas_', 'work_', 'health_', 'maint_'];
      
      // Template task titles to search for (more comprehensive)
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
        'Ask how she slept',
        'Make the bed',
        'Do laundry',
        'Schedule dentist',
        'Check car oil',
        'Water plants',
        'Call mom',
        'Plan date night',
        'Read bedtime story',
        'Clean bathroom',
        'Grocery shopping'
      ];
      
      snapshot.docs.forEach((docSnap) => {
        const taskId = docSnap.id;
        const taskData = docSnap.data();
        
        let shouldDelete = false;
        let reason = '';
        
        // Check by ID prefix
        const isTemplateById = templatePrefixes.some(prefix => taskId.startsWith(prefix));
        if (isTemplateById) {
          shouldDelete = true;
          reason = 'template ID prefix';
        }
        
        // Check by template title content
        const isTemplateByTitle = templateTitles.some(title => 
          taskData.title && taskData.title.toLowerCase().includes(title.toLowerCase())
        );
        if (isTemplateByTitle) {
          shouldDelete = true;
          reason = 'template title match';
        }
        
        // Check for very short IDs (likely auto-generated templates)
        if (taskId.length < 10 && /^[a-z]+_?\d*$/.test(taskId)) {
          shouldDelete = true;
          reason = 'suspicious short ID format';
        }
        
        // Check for missing critical data
        if (!taskData.title || !taskData.userId || !taskData.createdAt) {
          shouldDelete = true;
          reason = 'missing critical fields';
        }
        
        // Check for very old tasks (before 2023) that might be corrupted
        if (taskData.createdAt && taskData.createdAt.toDate) {
          try {
            const taskDate = taskData.createdAt.toDate();
            if (taskDate.getFullYear() < 2023) {
              shouldDelete = true;
              reason = 'very old task (pre-2023)';
            }
          } catch (error) {
            shouldDelete = true;
            reason = 'invalid date format';
          }
        }
        
        if (shouldDelete) {
          console.log(`🎯 Found problematic task: ${taskId} - ${taskData.title} (${reason})`);
          templateTasks.push({
            id: taskId,
            title: taskData.title || 'NO TITLE',
            reason: reason,
            ref: docSnap.ref
          });
        }
      });
      
      console.log(`Found ${templateTasks.length} template tasks:`, templateTasks);
      
      if (templateTasks.length === 0) {
        alert('✅ No problematic tasks found. Database is clean!');
        return;
      }
      
      const taskList = templateTasks.map(t => `- ${t.id}: ${t.title} (${t.reason})`).join('\n');
      const confirmed = confirm(`⚠️ Found ${templateTasks.length} problematic tasks to delete:\n\n${taskList}\n\n🗑️ Delete these tasks to clean up your database?`);
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
      
      // Remove from past promises immediately for UI feedback
      setPastPromises(prev => prev.filter(t => t.id !== taskId));
      
      // Refresh data to ensure dismissed task doesn't reappear
      await refreshAllData();
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

  // Handle logout
  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
        router.push('/login');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
        // Don't leave user stuck in loading state
        setTasks([]);
        setPastPromises([]);
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

    const handleMobileTaskSnooze = async (taskId, snoozeUntil) => {
      if (!user || !db) return;
      try {
        await updateDoc(doc(db, 'tasks', taskId), {
          snoozedUntil: Timestamp.fromDate(snoozeUntil),
          lastActivityAt: Timestamp.now()
        });
        await refreshAllData();
      } catch (error) {
        console.error('Error snoozing task:', error);
      }
    };

    const handleMobileTaskReminder = async (taskId, reminderType) => {
      if (!user || !db || !firebaseInstances.functions) return;
      
      try {
        const { setTaskReminder } = await import('@/lib/reminders');
        await setTaskReminder(taskId, reminderType, {
          functions: firebaseInstances.functions,
          db: db,
          user: user
        });
        await refreshAllData();
      } catch (error) {
        console.error('Error setting task reminder:', error);
        // Could show a toast notification here
      }
    };

    const handleMobileTaskAdd = async (taskData) => {
      if (!user || !db) return;
      
      // Check if this might be a project on mobile too
      if (mightBeProject(taskData.title)) {
        // For mobile, just create a simple project with basic subtasks
        const basicSubtasks = [
          { id: Date.now() + 1, title: 'Plan the approach', completed: false, completedAt: null },
          { id: Date.now() + 2, title: 'Gather materials', completed: false, completedAt: null },
          { id: Date.now() + 3, title: 'Complete the work', completed: false, completedAt: null },
          { id: Date.now() + 4, title: 'Review and finalize', completed: false, completedAt: null }
        ];
        
        await handleCreateProject({
          title: taskData.title,
          subtasks: basicSubtasks
        });
        return;
      }
      
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
      return <DashboardLoading message="Loading your tasks..." showSkeleton={true} />;
    }

    return (
      <TaskErrorBoundary>
        <MobileDashboard
          tasks={regularTasks}
          projects={projects}
          suggestions={generateSmartDailyTasks(userPreferences, user?.homeId)}
          onTaskComplete={handleMobileTaskComplete}
          onTaskAdd={handleMobileTaskAdd}
          onTaskSnooze={handleMobileTaskSnooze}
          onTaskReminder={handleMobileTaskReminder}
          onShowTaskForm={() => setShowMobileTaskForm(true)}
          streak={streakCount}
          upcomingEvents={[]} // You can integrate personal events here
          onLogout={handleLogout}
          db={db}
          functions={functions}
          user={user}
          onProjectComplete={handleProjectComplete}
          onUpdate={refreshAllData}
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
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{greeting}</h1>
              <p className="text-gray-600">{dateStr}</p>
              {streakCount > 0 && (
                <p className="text-sm text-green-600 mt-1">🔥 {streakCount} day streak</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Temporary cleanup button */}
              <button
                onClick={cleanupTemplateTasks}
                className="px-3 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-2"
                title="Clean up corrupted template tasks that may be causing errors"
              >
                🧹 Cleanup
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                title="Sign out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign out</span>
              </button>
            </div>
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
                    userTier={userTier}
                    onUpgradeRequest={() => setShowUpgradeModal(true)}
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
                    // Find the task being completed
                    const completedTask = tasks.find(t => t.id === taskId);
                    if (completedTask) {
                      // Add to recently completed for undo functionality
                      setRecentlyCompleted(prev => [
                        { ...completedTask, completedAt: new Date() },
                        ...prev.slice(0, 4) // Keep only last 5 completed tasks
                      ]);
                    }
                    
                    // Optimistic update: immediately mark task as completed
                    setTasks(prev => 
                      prev.map(task => 
                        task.id === taskId 
                          ? { ...task, completed: true, completedAt: Timestamp.now() }
                          : task
                      )
                    );
                  }}
                  onOpenChat={handleOpenChat}
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


          {/* Recently Completed Tasks - Undo Section */}
          {recentlyCompleted.length > 0 && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h3 className="text-sm font-medium text-green-800 mb-3">Recently Completed</h3>
              <div className="space-y-2">
                {recentlyCompleted.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-200">
                    <div className="flex-1">
                      <span className="text-sm text-gray-600 line-through">{task.title}</span>
                      <span className="text-xs text-green-600 ml-2">✓ Completed</span>
                    </div>
                    <button
                      onClick={() => handleTaskUndo(task.id)}
                      className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      ↶ Undo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Sidekick Chat */}
          <SidekickChat
            task={selectedTask}
            isVisible={showSidekickChat}
            onClose={handleCloseChat}
            userTier={userTier}
            onUpgradeRequest={() => setShowUpgradeModal(true)}
          />

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
