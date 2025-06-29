'use client';

import { useEffect, useState } from 'react';
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
import { generateSmartDailyTasks, getTimeBasedTasks } from '@/constants/tasks';
import StreakBanner from '@/components/StreakBanner';
import UserPreferences from '@/components/UserPreferences';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
// NEW COMPONENTS
import DashboardStats from '@/components/DashboardStats';
import QuickOverview from '@/components/QuickOverview';
import VoiceTaskRecorder from '@/components/VoiceTaskRecorder';

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [tasks, setTasks] = useState([]);
  const [pastPromises, setPastPromises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDetail, setNewTaskDetail] = useState('');
  const [userPreferences, setUserPreferences] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  // Track user's current streak
  const [streakCount, setStreakCount] = useState(0);
  // Voice task success banner
  const [voiceSuccess, setVoiceSuccess] = useState(false);

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
    const todayTasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setTasks(todayTasks);
  };

  // Callback for VoiceTaskRecorder
  const handleVoiceTasksAdded = async (count) => {
    if (count > 0) {
      setVoiceSuccess(true);
      // hide after a few seconds
      setTimeout(() => setVoiceSuccess(false), 4000);
    }
    await fetchTodayTasks();
  };

  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      // Load user preferences
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        // Check if user has set up preferences
        if (data.preferences && data.preferences.hasSetup) {
          setUserPreferences(data.preferences);
        } else {
          setShowPreferences(true);
        }
        
        // Update streak & keep local state in sync
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastCheckIn = data.lastCheckIn?.toDate();
        let currentStreak = data.streakCount || 0;
        if (!lastCheckIn || lastCheckIn < today) {
          currentStreak += 1;
          await updateDoc(userRef, {
            streakCount: currentStreak,
            lastCheckIn: Timestamp.now(),
          });
        }
        setStreakCount(currentStreak);
      } else {
        // New user
        await setDoc(userRef, {
          streakCount: 1,
          lastCheckIn: Timestamp.now(),
        });
        setStreakCount(1);
        setShowPreferences(true);
      }
    };

    const loadTasks = async () => {
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
      let existing = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      if (existing.length < 3 && userPreferences) {
        const needed = 3 - existing.length;
        // Use smart task generation with preferences
        const suggestions = generateSmartDailyTasks(userPreferences).slice(0, needed);
        
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

    const loadPastPromises = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid)
      );

      const snapshot = await getDocs(q);

      const eligibleTasks = snapshot.docs.filter((doc) => {
        const data = doc.data();
        const isBeforeToday = data.createdAt?.toDate() < today;
        const isIncomplete = !data.completedAt;
        const isManual = (data.source ?? 'manual') === 'manual';
        const isNotDismissed = data.status !== 'dismissed';

        return isBeforeToday && isIncomplete && isManual && isNotDismissed;
      });

      const seen = new Set();
      const filtered = eligibleTasks.filter((doc) => {
        const data = doc.data();
        const key = `${data.title}-${data.detail}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const past = filtered
        .map((doc) => {
          const data = doc.data();
          const created = data.createdAt.toDate();
          const ageDays = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: doc.id,
            ...data,
            ageLabel: ageDays === 0 ? 'Today' : `${ageDays} day${ageDays > 1 ? 's' : ''} ago`,
          };
        })
        .sort((a, b) => b.ageLabel.localeCompare(a.ageLabel))
        .slice(0, 3);

      setPastPromises(past);
    };

    const initDashboard = async () => {
      await loadUserData();
      if (!showPreferences) {
        await loadTasks();
        await loadPastPromises();
      }
      setLoading(false);
    };

    initDashboard();
  }, [user, userPreferences, showPreferences]);

  const handlePreferencesComplete = async (prefs) => {
    setUserPreferences(prefs);
    setShowPreferences(false);
    
    // Reload tasks with new preferences
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
      let existing = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

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

  const markTaskDone = async (taskId) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { completedAt: Timestamp.now() });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completedAt: Timestamp.now() } : t)));
    setPastPromises((prev) => prev.filter((t) => t.id !== taskId));
  };

  const swapTask = async (taskId, currentTask) => {
    // Use smart generation for replacement
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
        t.id === taskId ? { 
          ...t, 
          ...replacement,
          id: taskId
        } : t
      )
    );
  };

  const snoozeTask = async (taskId) => {
    const taskRef = doc(db, 'tasks', taskId);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    await updateDoc(taskRef, { createdAt: Timestamp.fromDate(tomorrow) });
    setPastPromises((prev) => prev.filter((t) => t.id !== taskId));
  };

  const dismissTask = async (taskId) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { status: 'dismissed' });
    setPastPromises((prev) => prev.filter((t) => t.id !== taskId));
  };

  const restoreToToday = async (taskId) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { createdAt: Timestamp.now() });
    const docSnap = await getDoc(taskRef);
    const restored = { id: taskId, ...docSnap.data() };
    setTasks((prev) => [...prev, restored]);
    setPastPromises((prev) => prev.filter((t) => t.id !== taskId));
  };

  const addManualTask = async () => {
    if (!newTaskTitle.trim()) return;

    const newTask = {
      title: newTaskTitle,
      detail: newTaskDetail,
      userId: user.uid,
      createdAt: Timestamp.now(),
      source: 'manual',
      category: 'household', // Default category, you can make this selectable
    };

    const docRef = await addDoc(collection(db, 'tasks'), newTask);
    setTasks((prev) => [...prev, { ...newTask, id: docRef.id }]);
    setNewTaskTitle('');
    setNewTaskDetail('');
  };

  // Show preferences screen if needed
  if (showPreferences && user) {
    return <UserPreferences userId={user.uid} onComplete={handlePreferencesComplete} />;
  }

  const dateStr = new Date().toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Add personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.displayName?.split(' ')[0] || 'there';
    
    if (hour < 12) return `Morning, ${name} 👋`;
    if (hour < 17) return `Afternoon, ${name} 👋`;
    return `Evening, ${name} 👋`;
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl text-gray-600 mb-1">{dateStr}</h1>
      <h2 className="text-2xl font-bold mb-4">{getGreeting()}</h2>

      {/* Quick daily overview */}
      {user?.uid && <QuickOverview userId={user.uid} />}

      {/* Add preferences edit button */}
      <button
        onClick={() => setShowPreferences(true)}
        className="text-sm text-gray-500 mb-4 hover:text-gray-700"
      >
        Update preferences
      </button>

      {user?.uid && <StreakBanner userId={user.uid} />}

      {/* Dashboard statistics */}
      {user?.uid && (
        <DashboardStats userId={user.uid} streakCount={streakCount} />
      )}

      {/* Voice notes -> tasks */}
      {user?.uid && (
        <VoiceTaskRecorder
          userId={user.uid}
          onTasksAdded={handleVoiceTasksAdded}
        />
      )}

      <button
        onClick={() => document.getElementById('manualTaskForm').classList.toggle('hidden')}
        className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl shadow-sm w-full justify-center mb-4"
      >
        <PlusIcon className="w-4 h-4" /> Add Task
      </button>

      <div id="manualTaskForm" className="hidden mb-6">
        <input
          className="w-full mb-2 p-2 border border-gray-300 rounded"
          placeholder="New task title"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <input
          className="w-full mb-2 p-2 border border-gray-300 rounded"
          placeholder="Task details (optional)"
          value={newTaskDetail}
          onChange={(e) => setNewTaskDetail(e.target.value)}
        />
        <button
          onClick={addManualTask}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Task
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading tasks...</p>
      ) : (
        <>
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                onClick={() => !task.completedAt && markTaskDone(task.id)}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer shadow-sm ${
                  task.completedAt
                    ? 'bg-gray-100 line-through text-gray-400'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{task.title}</span>
                  {task.detail && <span className="text-sm text-gray-500">{task.detail}</span>}
                </div>
                {!task.completedAt && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      swapTask(task.id, task);
                    }}
                  >
                    <ArrowPathIcon className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {pastPromises.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2">You Promised</h2>
              <ul className="space-y-3">
                {pastPromises.map((task) => (
                  <li
                    key={task.id}
                    className="p-4 rounded-xl border border-yellow-300 bg-yellow-50 shadow-sm transition-all"
                  >
                    <div className="font-semibold">{task.title}</div>
                    <div className="text-sm text-gray-600">{task.detail}</div>
                    <div className="text-xs text-yellow-700 mt-1 italic">
                      Promised {task.ageLabel}
                    </div>
                    <div className="flex justify-end gap-3 mt-2 text-xs">
                      <button onClick={() => restoreToToday(task.id)} className="text-green-600 hover:underline">
                        ↩️ Add Back
                      </button>
                      <button onClick={() => snoozeTask(task.id)} className="text-blue-500 hover:underline">
                        Snooze
                      </button>
                      <button onClick={() => dismissTask(task.id)} className="text-gray-500 hover:underline">
                        Dismiss
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!loading && (
        <div className="mt-6 text-xs text-gray-400 text-center">
          Tap a task to mark it complete
        </div>
      )}

      {/* Success message for voice tasks */}
      {voiceSuccess && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
          Voice tasks added!
        </div>
      )}
    </main>
  );
}