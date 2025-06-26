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
  setDoc
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { generateDailyTasks } from '@/lib/taskEngine';
import StreakBanner from '@/components/StreakBanner';

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [tasks, setTasks] = useState([]);
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

      if (snapshot.empty) {
        const newTasks = generateDailyTasks("1-3y");
        const taskPromises = newTasks.map((task) =>
          addDoc(collection(db, 'tasks'), {
            ...task,
            userId: user.uid,
            createdAt: Timestamp.now(),
          })
        );
        await Promise.all(taskPromises);
        setTasks(newTasks);
      } else {
        const existing = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTasks(existing);
      }

      setLoading(false);
    };

    const initDashboard = async () => {
      await checkAndUpdateStreak();
      await loadTasks();
    };

    initDashboard();
  }, [user]);

  const markTaskDone = async (taskId) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { completedAt: Timestamp.now() });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completedAt: Timestamp.now() } : t
      )
    );
  };

  const addManualTask = async () => {
    if (!newTaskTitle.trim()) return;

    const newTask = {
      title: newTaskTitle,
      detail: newTaskDetail,
      userId: user.uid,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'tasks'), newTask);
    setTasks((prev) => [...prev, { ...newTask, id: docRef.id }]);
    setNewTaskTitle('');
    setNewTaskDetail('');
  };

  return (
    <main className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Hey there 👋</h1>

      {user?.uid && <StreakBanner userId={user.uid} />}

      <div className="mb-6">
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
          Add Task
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading tasks...</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task, index) => (
            <li
              key={`${task.title}-${index}`}
              onClick={() => !task.completedAt && markTaskDone(task.id)}
              className={`p-4 rounded-xl border border-gray-300 shadow-sm cursor-pointer transition-all ${
                task.completedAt
                  ? 'bg-gray-100 line-through text-gray-400'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="font-semibold">{task.title}</div>
              <div className="text-sm text-gray-500">{task.detail}</div>
            </li>
          ))}
        </ul>
      )}

      {!loading && (
        <div className="mt-6 text-xs text-gray-400 text-center">
          Tap a task to mark it complete
        </div>
      )}
    </main>
  );
}