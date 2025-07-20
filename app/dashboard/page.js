'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
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
import { auth, db } from '@/lib/firebase';
import { generateSmartDailyTasks } from '@/constants/tasks';
import StreakBanner from '@/components/StreakBanner';
import UserPreferences from '@/components/UserPreferences';
import { ArrowPathIcon, PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import VoiceTaskRecorder from '@/components/VoiceTaskRecorder';
import PullToRefresh from '@/components/PullToRefresh';
import RecurringTaskManager from '@/components/RecurringTaskManager';
import EmergencyModeSelector from '@/components/EmergencyModeSelector';
import SmartReminders from '@/components/SmartReminders';
import EnergyLevelSelector from '@/components/EnergyLevelSelector';
import RelationshipTracker from '@/components/RelationshipTracker';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { shouldCreateToday } from '@/lib/recurringTasks';
import { generateSmartContextualTasks } from '@/lib/contextualTasks';

export default function Dashboard() {
  const [user] = useAuthState(auth);
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

  // MOVE useMemo HOOKS TO TOP - BEFORE ANY CONDITIONAL RETURNS
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
      await Promise.all([
        loadTasks(),
        loadPastPromises()
      ]);
      
      // Haptic feedback for successful refresh
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate streak based on consecutive days with completed tasks
  const calculateStreak = useCallback(async (userData) => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastTaskCompletionDate = userData.lastTaskCompletionDate?.toDate();
    let currentStreak = userData.streakCount || 0;

    if (lastTaskCompletionDate) {
      const daysSinceLastCompletion = Math.floor((today - lastTaskCompletionDate) / (1000 * 60 * 60 * 24));
      
      // If more than 1 day has passed since last task completion, streak is broken
      if (daysSinceLastCompletion > 1) {
        currentStreak = 0;
        await updateDoc(doc(db, 'users', user.uid), {
          streakCount: 0,
        });
      }
    }

    setStreakCount(currentStreak);
  }, [user]);

  // Update streak when a task is completed
  const updateStreakOnTaskCompletion = async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const lastTaskCompletionDate = data.lastTaskCompletionDate?.toDate();
      
      // Check if this is the first task completed today
      if (!lastTaskCompletionDate || lastTaskCompletionDate < today) {
        let newStreak = data.streakCount || 0;
        
        // If last completion was yesterday, increment streak
        if (lastTaskCompletionDate) {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastTaskCompletionDate >= yesterday && lastTaskCompletionDate < today) {
            newStreak += 1;
          } else if (lastTaskCompletionDate < yesterday) {
            // Gap in streak, reset to 1
            newStreak = 1;
          } else {
            // Same day completion already happened
            return;
          }
        } else {
          // First ever task completion
          newStreak = 1;
        }
        
        await updateDoc(userRef, {
          streakCount: newStreak,
          lastTaskCompletionDate: Timestamp.fromDate(today),
        });
        
        setStreakCount(newStreak);
        
        // Celebratory feedback for streak milestones
        if (newStreak === 3 || newStreak === 7 || newStreak % 10 === 0) {
          if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100, 50, 100]);
          }
        }
      }
    }
  };

  // Helper to (re)load today's tasks – reused after voice task insert
  const fetchTodayTasks = async () => {
    if (!user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = Timestamp.fromDate(today);

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      where('createdAt', '>=', startOfDay),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    const todayTasks = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    setTasks(todayTasks);
  };

  // Callback for VoiceTaskRecorder
  const handleVoiceTasksAdded = async (count) => {
    if (count > 0) {
      setVoiceSuccess(true);
      setTimeout(() => setVoiceSuccess(false), 4000);
    }
    await fetchTodayTasks();
  };

  // SWIPE FUNCTIONALITY HELPERS
  const markTaskDone = async (taskId) => {
    try {
      // Optimistic update
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completedAt: Timestamp.now() } : t)));
      setPastPromises((prev) => prev.filter((t) => t.id !== taskId));
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10, 50]); // Success pattern
      }
      
      // Update database
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { completedAt: Timestamp.now() });
      
      // Update streak for task completion
      await updateStreakOnTaskCompletion();
      
    } catch (error) {
      console.error("❌ Mark done error:", error);
      // Revert optimistic update on error
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completedAt: null } : t)));
      alert("Failed to mark task as complete. Please try again.");
    }
  };

  const snoozeTask = async (taskId) => {
    console.log("🟡 Starting snooze for task:", taskId);
    try {
      const taskRef = doc(db, "tasks", taskId);
      
      // Check if document exists first
      const docSnap = await getDoc(taskRef);
      if (!docSnap.exists()) {
        console.log("⚠️ Task document does not exist, removing from UI only");
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setPastPromises((prev) => prev.filter((t) => t.id !== taskId));
        return;
      }
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      console.log("📅 Setting createdAt to tomorrow:", tomorrow);
      await updateDoc(taskRef, { 
        createdAt: Timestamp.fromDate(tomorrow),
        lastModified: Timestamp.now(),
        snoozedAt: Timestamp.now()
      });
      
      console.log("✅ Database update completed");
      
      // Remove from UI
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setPastPromises((prev) => prev.filter((t) => t.id !== taskId));
      
      console.log("✅ Task removed from UI");
      
      // Reload past promises to ensure dismissed tasks are filtered out
      await loadPastPromises();
    } catch (error) {
      console.error("❌ Snooze error:", error);
      alert("ERROR: " + error.message);
    }
  };

  const dismissTask = async (taskId) => {
    console.log("🔴 Dismissing task:", taskId);
    try {
      const taskRef = doc(db, "tasks", taskId);
      
      // Check if document exists first
      const docSnap = await getDoc(taskRef);
      if (!docSnap.exists()) {
        console.log("⚠️ Task document does not exist, removing from UI only");
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setPastPromises((prev) => prev.filter((t) => t.id !== taskId));
        return;
      }
      
      console.log("🗑️ Marking task as dismissed");
      await updateDoc(taskRef, { 
        status: "dismissed",
        dismissedAt: Timestamp.now(),
        lastModified: Timestamp.now()
      });
      
      console.log("✅ Database update completed");
      
      // Remove from UI
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setPastPromises((prev) => prev.filter((t) => t.id !== taskId));
      
      console.log("✅ Task removed from UI");
    } catch (error) {
      console.error("❌ Dismiss error:", error);
      alert("ERROR: " + error.message);
    }
  };

  const swapTask = async (taskId, currentTask) => {
    const allSuggestions = generateSmartDailyTasks(userPreferences);
    const replacement = allSuggestions.find(
      (t) => t.title !== currentTask.title && t.category === currentTask.category
    );
    if (!replacement) return;
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      title: replacement.title,
      detail: replacement.detail,
      category: replacement.category,
      simplicity: replacement.simplicity,
    });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, ...replacement, id: taskId } : t
      )
    );
  };

  // TASK ITEM COMPONENT WITH SWIPE GESTURES
  const TaskItem = ({ task }) => {
    const isCompleted = !!task.completedAt;
    
    const { swipeDistance, handlers } = useSwipeGesture({
      onSwipeRight: () => !isCompleted && markTaskDone(task.id),
      onSwipeLeft: () => !isCompleted && snoozeTask(task.id),
      onSwipeFarLeft: () => !isCompleted && dismissTask(task.id),
      isDisabled: isCompleted
    });

    const ageInDays = task.createdAt
      ? Math.floor((Date.now() - task.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const isNudged = ageInDays >= 3;

    // Visual feedback based on swipe distance and completion status
    let bgColor = 'bg-white';
    let actionIcon = null;
    let actionText = '';
    
    if (isCompleted) {
      bgColor = 'bg-green-50 border-green-200';
    } else if (swipeDistance > 30) {
      bgColor = 'bg-green-50 border-green-200';
      actionText = '✓ Complete';
    } else if (swipeDistance < -120) {
      bgColor = 'bg-red-50 border-red-200';
      actionText = '🗑️ Dismiss';
    } else if (swipeDistance < -40) {
      bgColor = 'bg-orange-50 border-orange-200';
      actionText = '💤 Snooze';
    } else if (isNudged && !isCompleted) {
      bgColor = 'bg-red-50 border-red-100';
    }

    const handleTaskClick = (e) => {
      // Only allow completion if task is not already completed
      if (!isCompleted) {
        e.stopPropagation();
        markTaskDone(task.id);
      }
    };

    const handleSwapClick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      swapTask(task.id, task);
    };

    // Category icons
    const categoryIcons = {
      relationship: '❤️',
      baby: '👶',
      household: '🏠',
      personal: '🙋‍♂️',
      voice: '🎤'
    };

    return (
      <li
        {...handlers}
        className={`p-4 rounded-xl border flex flex-col transition-all duration-200 ease-out cursor-pointer shadow-sm ${bgColor} select-none touch-manipulation relative overflow-hidden`}
        style={{ transform: `translateX(${swipeDistance}px)` }}
      >
        {/* Swipe Action Indicator */}
        {actionText && Math.abs(swipeDistance) > 20 && (
          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none
            ${swipeDistance > 0 ? 'bg-green-500' : swipeDistance < -120 ? 'bg-red-500' : 'bg-orange-500'}
            text-white font-semibold opacity-80`}>
            {actionText}
          </div>
        )}
        
        <div className="flex items-center justify-between w-full relative z-10">
          <div 
            className={`flex flex-col flex-grow ${isCompleted ? 'cursor-default' : 'cursor-pointer'}`}
            onClick={handleTaskClick}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{categoryIcons[task.category] || '📝'}</span>
              <span className={`font-semibold ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                {isCompleted && '✅ '}{task.title}
              </span>
              {task.priority && !isCompleted && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  task.priority === 'high' ? 'bg-red-100 text-red-600' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {task.priority === 'high' ? '⏳' : task.priority === 'medium' ? '⏱️' : '⚡'}
                </span>
              )}
            </div>
            {task.detail && <span className={`text-sm mt-1 ${isCompleted ? 'line-through text-gray-400' : 'text-gray-500'}`}>{task.detail}</span>}
            {isCompleted && (
              <span className="text-xs text-green-600 mt-1">
                Completed {task.completedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          
          {/* Desktop Action Buttons - Only show for incomplete tasks */}
          {!isCompleted && (
            <div className="flex items-center gap-1 ml-4">
              <button
                onClick={(e) => { e.stopPropagation(); snoozeTask(task.id); }}
                className="p-1.5 hover:bg-orange-100 rounded text-orange-600 transition-colors"
                title="Snooze until tomorrow"
              >
                💤
              </button>
              <button
                onClick={handleSwapClick}
                className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                title="Swap for different task"
              >
                <ArrowPathIcon className="w-4 h-4 text-gray-400 hover:text-blue-500" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); dismissTask(task.id); }}
                className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors"
                title="Dismiss task"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
        {isNudged && (
          <div className="mt-2 pt-2 border-t border-red-200 flex items-center text-xs text-red-700 relative z-10">
            <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
            <span>This is 3+ days old. Get it done!</span>
          </div>
        )}
      </li>
    );
  };

  // Load today's tasks (auto-generate if fewer than 3)
  const loadTasks = useCallback(async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = Timestamp.fromDate(today);

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      where('createdAt', '>=', startOfDay),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    
    let existing = snapshot.docs
    .map((doc) => ({ ...doc.data(), id: doc.id })) // Ensure Firestore doc ID always wins
    .filter((task) => {
      // Skip dismissed tasks
      if (task.status === "dismissed") {
        return false;
      }
      
      // Skip tasks that were snoozed today
      if (task.snoozedAt) {
        const snoozedDate = task.snoozedAt.toDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24*60*60*1000);
        const snoozedToday = snoozedDate >= today && snoozedDate < tomorrow;
        if (snoozedToday) {
          return false;
        }
      }
      
      return true;
    });

    // Add recurring tasks that should appear today
    const recurringTasks = await loadRecurringTasks();
    
    // Only auto-generate tasks if there are NO tasks at all (not even completed ones)
    const totalTasks = existing.length + recurringTasks.length;
    if (totalTasks === 0 && userPreferences) {
      const enhancedSuggestions = await generateEnhancedTasks();
      const suggestions = enhancedSuggestions.slice(0, 3); // Start with 3 suggestions when completely empty

      if (suggestions.length > 0) {
        const suggestionDocs = await Promise.all(
          suggestions.map((task) =>
            addDoc(collection(db, 'tasks'), {
              ...task,
              userId: user.uid,
              createdAt: Timestamp.now(),
              source: emergencyModeActive ? 'emergency' : 'auto',
            })
          )
        );

        const newTasksWithIds = suggestions.map((task, index) => ({
          ...task,
          id: suggestionDocs[index].id,
        }));
        existing = [...existing, ...newTasksWithIds];
      }
    }

    setTasks([...existing, ...recurringTasks]);
  }, [user, emergencyModeActive, generateEnhancedTasks, loadRecurringTasks, userPreferences]);

  // Load completion history for smart features
  const loadCompletionHistory = async () => {
    if (!user) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      where('completedAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('completedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    setCompletionHistory(history);
  };

  // Enhanced task generation using contextual intelligence
  const generateEnhancedTasks = useCallback(async () => {
    if (!user || !userPreferences) return [];

    if (emergencyModeActive && activeModeTemplates.length > 0) {
      // Return emergency mode tasks
      return activeModeTemplates.map(template => ({
        ...template,
        id: 'emergency-' + Math.random(),
        userId: user.uid,
        createdAt: Timestamp.now(),
        source: 'emergency'
      }));
    }

    // Use contextual task generation
    const contextualTasks = generateSmartContextualTasks(
      userPreferences, 
      completionHistory, 
      currentEnergyLevel
    );

    return contextualTasks;
  }, [user, userPreferences, emergencyModeActive, activeModeTemplates, completionHistory, currentEnergyLevel]);

  // Handle emergency mode selection
  const handleEmergencyMode = async (templatePack) => {
    try {
      setEmergencyModeActive(true);
      setActiveModeTemplates(templatePack.tasks);
      setShowEmergencyMode(false);

      // Clear current tasks and replace with emergency tasks
      setTasks([]);
      
      // Create emergency tasks in Firebase
      const emergencyTasks = await Promise.all(
        templatePack.tasks.map(async (task) => {
          const taskDoc = await addDoc(collection(db, 'tasks'), {
            ...task,
            userId: user.uid,
            createdAt: Timestamp.now(),
            source: 'emergency',
            emergencyMode: templatePack.mode
          });
          return { ...task, id: taskDoc.id };
        })
      );

      setTasks(emergencyTasks);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      
    } catch (error) {
      console.error('Error setting emergency mode:', error);
    }
  };

  // Clear emergency mode
  const clearEmergencyMode = async () => {
    setEmergencyModeActive(false);
    setActiveModeTemplates([]);
    await loadTasks(); // Reload normal tasks
  };

  // Load and create recurring tasks for today
  const loadRecurringTasks = useCallback(async () => {
    if (!user) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = Timestamp.fromDate(today);

    // Get all recurring task templates
    const recurringQuery = query(
      collection(db, 'recurringTasks'),
      where('userId', '==', user.uid),
      where('isActive', '==', true)
    );

    const recurringSnapshot = await getDocs(recurringQuery);
    const recurringTemplates = recurringSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    // Check which recurring tasks should be created today
    const tasksToCreate = [];
    const createdTasks = [];

    for (const template of recurringTemplates) {
      if (shouldCreateToday(template, today)) {
        // Check if this recurring task was already created today
        const existingQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', user.uid),
          where('recurringTaskId', '==', template.id),
          where('createdAt', '>=', startOfDay)
        );

        const existingSnapshot = await getDocs(existingQuery);
        
        if (existingSnapshot.empty) {
          // Create the task
          const newTask = {
            title: template.title,
            detail: template.detail,
            category: template.category,
            priority: template.priority,
            userId: user.uid,
            createdAt: Timestamp.now(),
            source: 'recurring',
            recurringTaskId: template.id,
            isRecurring: true
          };

          tasksToCreate.push(newTask);
        } else {
          // Task already exists, add to our list
          createdTasks.push(...existingSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          })));
        }
      }
    }

    // Create new recurring tasks
    if (tasksToCreate.length > 0) {
      const newTaskDocs = await Promise.all(
        tasksToCreate.map(task => addDoc(collection(db, 'tasks'), task))
      );

      const newTasks = tasksToCreate.map((task, index) => ({
        ...task,
        id: newTaskDocs[index].id
      }));

      createdTasks.push(...newTasks);
    }

    return createdTasks;
  }, [user]);

  // Load past promises (older incomplete manual tasks)
  const loadPastPromises = useCallback(async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    const eligibleTasks = snapshot.docs.filter((docSnap) => {
      const data = docSnap.data();
      const createdDate = data.createdAt?.toDate();
      
      // Skip tasks that have been restored today
      if (data.lastRestored) {
        const restoredDate = data.lastRestored.toDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24*60*60*1000);
        const restoredToday = restoredDate >= today && restoredDate < tomorrow;
        if (restoredToday) {
          return false;
        }
      }
      
      // 1-DAY RULE: Only show tasks from YESTERDAY
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isFromYesterday = createdDate >= yesterday && createdDate < today;
      
      const isIncomplete = !data.completedAt;
      const isManual = (data.source ?? "manual") === "manual";
      const isNotDismissed = data.status !== "dismissed";
      
      return isFromYesterday && isIncomplete && isManual && isNotDismissed;
    });

    const seen = new Set();
    const filtered = eligibleTasks.filter((docSnap) => {
      const data = docSnap.data();
      const key = `${data.title}-${data.detail}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const past = filtered
      .map((docSnap) => {
        const data = docSnap.data();
        const created = data.createdAt.toDate();
        const ageDays = Math.floor(
          (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const result = {
          ...data,
          id: docSnap.id, // Override any custom id with the REAL Firestore document ID
          ageLabel:
            ageDays === 0 ? 'Today' : `${ageDays} day${ageDays > 1 ? 's' : ''} ago`,
        };
        
        return result;
      })
      .sort((a, b) => b.ageLabel.localeCompare(a.ageLabel))
      .slice(0, 3);

    setPastPromises(past);
  }, [user]);

  // 1) Load user data & preferences (runs once per login)

  // Fix hydration by setting date/greeting on client only
  useEffect(() => {
    setMounted(true);
    setDateStr(new Date().toLocaleDateString(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    }));
    
    const hour = new Date().getHours();
    const name = user?.displayName?.split(" ")[0] || "there";
    if (hour < 12) setGreeting(`Morning, ${name} 👋`);
    else if (hour < 17) setGreeting(`Afternoon, ${name} 👋`);
    else setGreeting(`Evening, ${name} 👋`);
  }, [user]);

  useEffect(() => {
    if (!user) return;

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
        
        // Calculate streak based on actual task completion, not just app visits
        await calculateStreak(data);
        
      } else {
        await setDoc(userRef, {
          streakCount: 0,
          lastTaskCompletionDate: null,
        });
        setStreakCount(0);
        setShowPreferences(true);
      }
    };

    loadUserData().catch(console.error);
  }, [user, calculateStreak]);

  // 2) Once preferences are ready & not on preferences screen, load tasks/promises

  useEffect(() => {
    if (!user || showPreferences || !userPreferences) return;

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
  }, [user, userPreferences, showPreferences, loadTasks, loadPastPromises]);

  const handlePreferencesComplete = async (prefs) => {
    setUserPreferences(prefs);
    setShowPreferences(false);
    
    const loadTasksWithPrefs = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = Timestamp.fromDate(today);

      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid),
        where('createdAt', '>=', startOfDay),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(q);
      let existing = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

      if (existing.length < 3) {
        const needed = 3 - existing.length;
        const suggestions = generateSmartDailyTasks(prefs).slice(0, needed);
        
        const suggestionDocs = await Promise.all(
          suggestions.map((task) => {
            return addDoc(collection(db, 'tasks'), {
              ...task,
              userId: user.uid,
              createdAt: Timestamp.now(),
              source: 'auto',
            });
          })
        );
        
        const newTasksWithIds = suggestions.map((task, index) => ({
          ...task,
          id: suggestionDocs[index].id,
        }));
        existing = [...existing, ...newTasksWithIds];
      }

      setTasks(existing);
    };
    
    await loadTasksWithPrefs();
    await loadPastPromises();
  };

  const restoreToToday = async (taskId) => {
    console.log("🔄 Restoring task to today:", taskId);
    console.log("🔍 Database instance:", db ? "✅ Connected" : "❌ Not connected");
    console.log("🔍 User:", user ? `✅ ${user.uid}` : "❌ No user");
    
    const taskRef = doc(db, "tasks", taskId);
    console.log("🔍 Task reference created:", taskRef.path);
    
    try {
      console.log("📥 Fetching task document...");
      const docSnap = await getDoc(taskRef);
      console.log("📄 Document exists:", docSnap.exists());
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("📝 Task data before restore:", data);
        
        const restoreCount = (data.restoreCount || 0) + 1;
        console.log("� Restore count will be:", restoreCount);
        
        // Update task with new creation date and restore tracking
        const now = Timestamp.now();
        console.log("⏰ Current timestamp:", now.toDate());
        
        console.log("💾 Starting database update...");
        await updateDoc(taskRef, {
          createdAt: now,
          restoreCount: restoreCount,
          lastRestored: now,
          source: 'manual' // Ensure it's marked as manual so it can be properly tracked
        });
        
        console.log("✅ Task updated in database - SUCCESS!");
        
        // Force immediate reload to ensure database changes are reflected
        console.log("🔄 Reloading tasks after database update...");
        await loadTasks();
        await loadPastPromises();
        console.log("✅ Tasks reloaded - database should be synced");
        
        // 3-DAY NUDGE: Show alert if task has been restored 3+ times
        if (restoreCount >= 3) {
          alert("💪 This task has been on your list for 3 days! Time to tackle it or break it down into smaller steps?");
        }
        
        // Optimistically add to current tasks with updated timestamp
        const restored = { 
          id: taskId, 
          ...data, 
          createdAt: now,
          restoreCount: restoreCount,
          lastRestored: now,
          source: 'manual'
        };
        
        setTasks((prev) => {
          // Make sure we don't add duplicates
          const existing = prev.find(t => t.id === taskId);
          if (existing) {
            console.log("🔄 Task already exists, updating it");
            return prev.map(t => t.id === taskId ? restored : t);
          } else {
            console.log("➕ Adding new task to list");
            return [...prev, restored];
          }
        });
        
        console.log("🎯 Task added to UI state");
        
        // Remove from past promises immediately
        setPastPromises((prev) => prev.filter((t) => t.id !== taskId));
        
        console.log("�️ Task removed from past promises");
      } else {
        console.log("❌ Task document does not exist!");
      }
    } catch (err) {
      console.error("💥 [Dashboard] restoreToToday FATAL ERROR:", err);
      console.error("💥 Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      alert(`Failed to restore task: ${err.message}`);
    }
  };

  const addManualTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const newTask = {
        title: newTaskTitle.trim(),
        detail: newTaskDetail.trim(),
        userId: user.uid,
        createdAt: Timestamp.now(),
        source: 'manual',
        category: newTaskCategory,
        priority: newTaskPriority,
      };

      // Optimistic update
      const tempId = 'temp-' + Date.now();
      setTasks((prev) => [...prev, { ...newTask, id: tempId }]);

      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      
      // Replace temp task with real one
      setTasks((prev) => prev.map(t => t.id === tempId ? { ...newTask, id: docRef.id } : t));
      
      // Reset form
      setNewTaskTitle('');
      setNewTaskDetail('');
      setNewTaskCategory('household');
      setNewTaskPriority('medium');
      setShowTaskForm(false);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      
    } catch (error) {
      console.error("❌ Add task error:", error);
      alert("Failed to add task. Please try again.");
      // Remove optimistic update on error
      setTasks((prev) => prev.filter(t => !t.id.startsWith('temp-')));
    }
  };

  const saveRecurringTask = async (recurringTask) => {
    try {
      const newRecurringTask = {
        ...recurringTask,
        userId: user.uid,
        createdAt: Timestamp.now(),
        isActive: true
      };

      await addDoc(collection(db, 'recurringTasks'), newRecurringTask);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }

      // Refresh tasks to include any new recurring tasks for today
      await loadTasks();
      
      setShowRecurringForm(false);
      
    } catch (error) {
      console.error("❌ Save recurring task error:", error);
      alert("Failed to save recurring task. Please try again.");
    }
  };

  // Show preferences screen if needed
  if (showPreferences && user) {
    return <UserPreferences userId={user.uid} onComplete={handlePreferencesComplete} />;
  }

  // Handle SSR and loading states
  if (!mounted) {
    return (
      <main className="max-w-2xl mx-auto p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-2xl mx-auto p-4">
        <p className="text-center text-gray-500">Please log in to view your dashboard.</p>
      </main>
    );
  }

  return (
    <PullToRefresh onRefresh={refreshAllData}>
      <main className="max-w-2xl mx-auto p-4">
        {/* Header with date and greeting */}
        <div className="mb-6">
          <h1 className="text-lg text-gray-500 mb-1">{dateStr}</h1>
          <h2 className="text-2xl font-bold text-gray-800">{greeting}</h2>
        </div>

        {/* Streak Banner - Important but subtle */}
        {user?.uid && <StreakBanner userId={user.uid} />}

        {/* Emergency Mode Alert - Only show if active */}
        {emergencyModeActive && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Emergency Mode Active</span>
            </div>
            <button
              onClick={clearEmergencyMode}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Exit
            </button>
          </div>
        )}

        {/* Smart Reminders - Only show when relevant */}
        {user?.uid && (
          <SmartReminders
            userId={user.uid}
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
          />
        )}

        {/* MAIN CONTENT: TODAY'S TASKS */}
        {!loading && (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Today&apos;s Focus</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={refreshAllData}
                    disabled={loading}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                    title="Refresh all tasks"
                  >
                    <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowMoreOptions(!showMoreOptions)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showMoreOptions ? 'Less' : 'More options'}
                  </button>
                </div>
              </div>

              {/* Quick Add - Simple and prominent */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowTaskForm(!showTaskForm)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Add Task</span>
                </button>
                
                {user?.uid && (
                  <div className="flex-shrink-0">
                    <VoiceTaskRecorder
                      userId={user.uid}
                      onTasksAdded={handleVoiceTasksAdded}
                      compact={true}
                    />
                  </div>
                )}
              </div>

              {/* More Options - Collapsible */}
              {showMoreOptions && (
                <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                  <button
                    onClick={() => setShowRecurringForm(!showRecurringForm)}
                    className="w-full flex items-center gap-2 text-gray-700 py-2 px-3 rounded hover:bg-gray-200 transition-colors text-sm"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    <span>Add Recurring Task</span>
                  </button>
                  
                  {!emergencyModeActive && (
                    <button
                      onClick={() => setShowEmergencyMode(true)}
                      className="w-full flex items-center gap-2 text-orange-700 py-2 px-3 rounded hover:bg-orange-100 transition-colors text-sm"
                    >
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      <span>Emergency Mode</span>
                    </button>
                  )}

                  <EnergyLevelSelector
                    currentLevel={currentEnergyLevel}
                    onLevelChange={setCurrentEnergyLevel}
                    compact={true}
                  />
                </div>
              )}
            </div>

            {/* Task List - The main focus */}
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No tasks for today</p>
                <p className="text-sm">Add one above to get started! 🎯</p>
              </div>
            ) : (
              <ul className="space-y-3 mb-6">
                {sortedTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </ul>
            )}

            {/* Past Promises - Important but secondary */}
            {pastPromises.length > 0 && (
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Yesterday&apos;s Promises</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Unfinished from yesterday
                </p>
                <ul className="space-y-3">
                  {pastPromises.map((task) => (
                    <li
                      key={task.id}
                      className="p-3 rounded-lg border bg-yellow-50 border-yellow-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">{task.title}</span>
                          {task.detail && (
                            <span className="text-sm text-gray-600 block">{task.detail}</span>
                          )}
                          <span className="text-xs text-gray-400">{task.ageLabel}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => restoreToToday(task.id)}
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            Today
                          </button>
                          <button
                            onClick={() => snoozeTask(task.id)}
                            className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
                          >
                            Snooze
                          </button>
                          <button
                            onClick={() => dismissTask(task.id)}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading your tasks...</p>
          </div>
        )}

        {/* Instructions - Helpful for all users */}
        {!loading && tasks.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="text-xs text-gray-400 text-center">
              � Desktop: Use the action buttons (✓ 💤 🔄 🗑️) on each task
            </div>
            <div className="text-xs text-gray-400 text-center">
              � Desktop: Click task to complete • Use buttons (💤 🔄 🗑️) for other actions
            </div>
            <div className="text-xs text-gray-400 text-center">
              🔄 The refresh button (↻) reloads all tasks and generates new suggestions
            </div>
          </div>
        )}

        {/* Advanced Analytics - Hidden by default */}
        {showMoreOptions && user?.uid && userPreferences && (
          <div className="mt-8 border-t pt-6">
            <RelationshipTracker
              userId={user.uid}
              tasks={tasks}
              completionHistory={completionHistory}
              preferences={userPreferences}
              compact={true}
            />
          </div>
        )}

        {/* Task Forms */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <h3 className="font-semibold text-gray-800 mb-4">Add New Task</h3>
              
              <div className="space-y-4">
                <input
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  type="text"
                  placeholder="What needs to be done?"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  autoFocus
                />
                
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows="3"
                  placeholder="Any details? (optional)"
                  value={newTaskDetail}
                  onChange={(e) => setNewTaskDetail(e.target.value)}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value)}
                    >
                      <option value="household">🏠 Household</option>
                      <option value="relationship">❤️ Relationship</option>
                      <option value="kids">👶 Kids</option>
                      <option value="personal">🧘 Personal</option>
                      <option value="work">💼 Work</option>
                      <option value="health">🏃 Health</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🔴 High</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowTaskForm(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addManualTask}
                    disabled={!newTaskTitle.trim()}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showRecurringForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <RecurringTaskManager
                onSave={saveRecurringTask}
                onCancel={() => setShowRecurringForm(false)}
              />
            </div>
          </div>
        )}

        {/* Emergency Mode Modal */}
        {user?.uid && (
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
  );
}
