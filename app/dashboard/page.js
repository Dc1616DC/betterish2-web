'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [tasks, setTasks] = useState([]);
  const [pastPromises, setPastPromises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDetail, setNewTaskDetail] = useState('');
  const [userPreferences, setUserPreferences] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [voiceSuccess, setVoiceSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dateStr, setDateStr] = useState("");
  const [greeting, setGreeting] = useState("Hello 👋");

  // MOVE useMemo HOOKS TO TOP - BEFORE ANY CONDITIONAL RETURNS
  // Sort tasks with 3+ day old tasks first (nudged)
  const sortedIncompleteTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.completedAt)
      .map(task => ({
        ...task,
        ageInDays: task.createdAt ? Math.floor((Date.now() - task.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24)) : 0
      }))
      .sort((a, b) => (b.ageInDays >= 3 ? 1 : 0) - (a.ageInDays >= 3 ? 1 : 0));
  }, [tasks]);

  const completedTasks = useMemo(() => tasks.filter((t) => t.completedAt), [tasks]);

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
    const todayTasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { completedAt: Timestamp.now() });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completedAt: Timestamp.now() } : t)));
    setPastPromises((prev) => prev.filter((t) => t.id !== taskId));
  };

  const snoozeTask = async (taskId) => {
    console.log("🟡 Starting snooze for task:", taskId);
    try {
      const taskRef = doc(db, "tasks", taskId);
      
      // Add debugging - temporary alert for mobile
      
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
    } catch (error) {
      console.error("❌ Snooze error:", error);
      alert("ERROR: " + error.message);
    }
  };

  const dismissTask = async (taskId) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { status: 'dismissed' });
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setPastPromises((prev) => prev.filter((t) => t.id !== taskId));
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
    const { swipeDistance, handlers } = useSwipeGesture({
      onSwipeRight: () => markTaskDone(task.id),
      onSwipeLeft: () => snoozeTask(task.id),
      onSwipeFarLeft: () => dismissTask(task.id),
    });

    const ageInDays = task.createdAt
      ? Math.floor((Date.now() - task.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const isNudged = ageInDays >= 3;

    // Visual feedback based on swipe distance
    let bgColor = 'bg-white';
    if (swipeDistance > 30) bgColor = 'bg-green-50';
    else if (swipeDistance < -120) bgColor = 'bg-red-50';
    else if (swipeDistance < -40) bgColor = 'bg-orange-50';
    else if (isNudged) bgColor = 'bg-red-50';

    return (
      <li
        {...handlers}
        className={`p-4 rounded-xl border flex flex-col transition-all duration-200 ease-out cursor-pointer shadow-sm ${bgColor} select-none`}
        style={{ transform: `translateX(${swipeDistance}px)` }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col flex-grow" onClick={(e) => {e.stopPropagation(); markTaskDone(task.id);}}>
            <span className="font-semibold">{task.title}</span>
            {task.detail && <span className="text-sm text-gray-500">{task.detail}</span>}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              swapTask(task.id, task);
            }}
            className="flex-shrink-0 ml-4 p-1"
          >
            <ArrowPathIcon className="w-4 h-4 text-gray-400 hover:text-blue-500" />
          </button>
        </div>
        {isNudged && (
          <div className="mt-2 pt-2 border-t border-red-200 flex items-center text-xs text-red-700">
            <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
            <span>This is 3+ days old. Get it done!</span>
          </div>
        )}
      </li>
    );
  };

  // Load today's tasks (auto-generate if fewer than 3)
  const loadTasks = async () => {
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
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((task) => {
      // Skip dismissed tasks
      if (task.status === "dismissed") return false;
      
      // Skip tasks that were snoozed today
      if (task.snoozedAt) {
        const snoozedDate = task.snoozedAt.toDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24*60*60*1000);
        const snoozedToday = snoozedDate >= today && snoozedDate < tomorrow;
        if (snoozedToday) return false;
      }
      
      return true;
    });

    if (existing.length < 3 && userPreferences) {
      const needed = 3 - existing.length;
      const suggestions = generateSmartDailyTasks(userPreferences).slice(0, needed);

      const suggestionDocs = await Promise.all(
        suggestions.map((task) =>
          addDoc(collection(db, 'tasks'), {
            ...task,
            userId: user.uid,
            createdAt: Timestamp.now(),
            source: 'auto',
          })
        )
      );

      const newTasksWithIds = suggestions.map((task, index) => ({
        ...task,
        id: suggestionDocs[index].id,
      }));
      existing = [...existing, ...newTasksWithIds];
    }

    setTasks(existing);
  };

  // Load past promises (older incomplete manual tasks)
  const loadPastPromises = async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    const eligibleTasks = snapshot.docs.filter((docSnap) => {
      const data = docSnap.data();
      const isBeforeToday = data.createdAt?.toDate() < today;
      const isIncomplete = !data.completedAt;
      const isManual = (data.source ?? 'manual') === 'manual';
      const isNotDismissed = data.status !== 'dismissed';
      return isBeforeToday && isIncomplete && isManual && isNotDismissed;
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
        return {
          id: docSnap.id,
          ...data,
          ageLabel:
            ageDays === 0 ? 'Today' : `${ageDays} day${ageDays > 1 ? 's' : ''} ago`,
        };
      })
      .sort((a, b) => b.ageLabel.localeCompare(a.ageLabel))
      .slice(0, 3);

    setPastPromises(past);
  };

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
        await setDoc(userRef, {
          streakCount: 1,
          lastCheckIn: Timestamp.now(),
        });
        setStreakCount(1);
        setShowPreferences(true);
      }
    };

    loadUserData().catch(console.error);
  }, [user]);

  // 2) Once preferences are ready & not on preferences screen, load tasks/promises

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
  }, [user, userPreferences, showPreferences]);

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

  const restoreToToday = async (taskId) => {
    const taskRef = doc(db, 'tasks', taskId);
    try {
      await updateDoc(taskRef, { createdAt: Timestamp.now() });
      const docSnap = await getDoc(taskRef);
      if (docSnap.exists()) {
        const restored = { id: taskId, ...docSnap.data() };
        setTasks((prev) => [...prev, restored]);
      }
    } catch (err) {
      console.error('[Dashboard] restoreToToday error (document may not exist):', err);
    } finally {
      setPastPromises((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  const addManualTask = async () => {
    if (!newTaskTitle.trim()) return;

    const newTask = {
      title: newTaskTitle,
      detail: newTaskDetail,
      userId: user.uid,
      createdAt: Timestamp.now(),
      source: 'manual',
      category: 'household',
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



  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl text-gray-600 mb-1">{dateStr}</h1>
      <h2 className="text-2xl font-bold mb-4">{greeting}</h2>

      <button
        onClick={() => setShowPreferences(true)}
        className="text-sm text-gray-500 mb-4 hover:text-gray-700"
      >
        Update preferences
      </button>

      {user?.uid && <StreakBanner userId={user.uid} />}

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
          type="text"
          placeholder="Task title"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <textarea
          className="w-full mb-2 p-2 border border-gray-300 rounded"
          placeholder="Task details (optional)"
          value={newTaskDetail}
          onChange={(e) => setNewTaskDetail(e.target.value)}
        />
        <button
          onClick={addManualTask}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Save Task
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading tasks...</p>
      ) : (
        <>
          {sortedIncompleteTasks.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                TODAY&apos;S FOCUS
              </h3>
              <ul className="space-y-3 mb-6">
                {sortedIncompleteTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </ul>
            </>
          )}

          {completedTasks.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                COMPLETED
              </h3>
              <ul className="space-y-3 mb-6">
                {completedTasks.map((task) => (
                  <li
                    key={task.id}
                    className="p-4 rounded-xl border bg-gray-50 text-gray-500 shadow-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold line-through">{task.title}</span>
                      {task.detail && (
                        <span className="text-sm line-through">{task.detail}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {pastPromises.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2">You Promised</h2>
              <p className="text-sm text-gray-500 mb-4">
                Unfinished tasks from previous days
              </p>
              <ul className="space-y-3">
                {pastPromises.map((task) => (
                  <li
                    key={task.id}
                    className="p-4 rounded-xl border bg-yellow-50 border-yellow-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-semibold">{task.title}</span>
                        {task.detail && (
                          <span className="text-sm text-gray-500">{task.detail}</span>
                        )}
                        <span className="text-xs text-gray-400">{task.ageLabel}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => restoreToToday(task.id)}
                          className="text-xs bg-blue-500 text-white px-3 py-1 rounded"
                        >
                          Do Today
                        </button>
                        <button
                          onClick={() => dismissTask(task.id)}
                          className="text-xs bg-gray-500 text-white px-3 py-1 rounded"
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

      {!loading && (
        <div className="mt-6 text-xs text-gray-400 text-center">
          👈 Swipe left to snooze • Swipe right to complete • Far left to dismiss 👉
        </div>
      )}

      {voiceSuccess && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
          Voice tasks added!
        </div>
      )}
    </main>
  );
}
