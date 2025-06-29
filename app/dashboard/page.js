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
import { generateDailyTasks } from '@/lib/taskEngine';
import StreakBanner from '@/components/StreakBanner';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [tasks, setTasks] = useState([]);
  const [pastPromises, setPastPromises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDetail, setNewTaskDetail] = useState('');

  useEffect(() => {
    if (!user) return;

    const checkAndUpdateStreak = async () => {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const lastCheckIn = data.lastCheckIn?.toDate();

        if (!lastCheckIn || lastCheckIn < today) {
          await updateDoc(userRef, {
            streakCount: (data.streakCount || 0) + 1,
            lastCheckIn: Timestamp.now(),
          });
        }
      } else {
        await setDoc(userRef, {
          streakCount: 1,
          lastCheckIn: Timestamp.now(),
        });
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

      if (existing.length < 3) {
        const needed = 3 - existing.length;
        const suggestions = generateDailyTasks('1-3y').slice(0, needed);
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
      await checkAndUpdateStreak();
      await loadTasks();
      await loadPastPromises();
      setLoading(false);
    };

    initDashboard();
  }, [user]);

  const markTaskDone = async (taskId) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { completedAt: Timestamp.now() });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completedAt: Timestamp.now() } : t)));
    setPastPromises((prev) => prev.filter((t) => t.id !== taskId));
  };

  const swapTask = async (taskId, currentTask) => {
    const replacement = generateDailyTasks('1-3y').find(
      (t) => t.title !== currentTask.title
    );
    if (!replacement) return;

    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      title: replacement.title,
      detail: replacement.detail,
      createdAt: Timestamp.now(),
    });

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, title: replacement.title, detail: replacement.detail } : t
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
    };

    const docRef = await addDoc(collection(db, 'tasks'), newTask);
    setTasks((prev) => [...prev, { ...newTask, id: docRef.id }]);
    setNewTaskTitle('');
    setNewTaskDetail('');
  };

  const dateStr = new Date().toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <main className="max-w-md mx-auto p-4">
      <h1 className="text-xl text-gray-600 mb-1">{dateStr}</h1>
      <h2 className="text-2xl font-bold mb-4">Hey there 👋</h2>

      {user?.uid && <StreakBanner userId={user.uid} />}

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
            {tasks.map((task, index) => (
              <li
                key={`${task.title}-${index}`}
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
                {pastPromises.map((task, index) => (
                  <li
                    key={`${task.title}-past-${index}`}
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
    </main>
  );
}