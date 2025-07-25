'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  Timestamp,
  addDoc,
  doc
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import dynamic from 'next/dynamic';

function LooseEndsPage() {
  const [user, loading] = useAuthState(auth);
  const [manualTasks, setManualTasks] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;

    const fetchLooseEnds = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid)
      );

      const snapshot = await getDocs(q);

      const eligible = snapshot.docs.filter((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        const isBeforeToday = createdAt < today;
        const isIncomplete = !data.completedAt;
        const isManual = (data.source ?? 'manual') === 'manual';
        const isDismissed = data.status === 'dismissed';
        return isBeforeToday && isIncomplete && isManual && !isDismissed;
      });

      const deduped = [];
      const seen = new Set();
      for (let docSnap of eligible) {
        const data = docSnap.data();
        const key = `${data.title}-${data.detail}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const created = data.createdAt.toDate();
        const ageDays = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
        deduped.push({
          ...data,
          id: docSnap.id, // Ensure Firestore doc ID always wins
          ageLabel: ageDays === 0 ? 'Today' : `${ageDays} day${ageDays > 1 ? 's' : ''} ago`,
        });
      }

      setManualTasks(deduped);
    };

    fetchLooseEnds();
  }, [user, mounted]);

  const markTaskDone = async (taskId) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { completedAt: Timestamp.now() });
    setManualTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const dismissTask = async (taskId) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { status: 'dismissed' });
    setManualTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const addToToday = async (task) => {
    // Don't include template ID when saving to Firestore
    const newTask = {
      title: task.title,
      detail: task.detail,
      userId: user.uid,
      createdAt: Timestamp.now(),
      source: 'manual',
      // Add dismissed and deleted fields for consistency
      dismissed: false,
      deleted: false
    };

    await addDoc(collection(db, 'tasks'), newTask);
    setManualTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  // Handle SSR and loading states
  if (!mounted || loading) {
    return (
      <main className="max-w-md mx-auto p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-md mx-auto p-4">
        <p className="text-center text-gray-500">Please log in to view loose ends.</p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Loose Ends</h1>

      {manualTasks.length === 0 ? (
        <p className="text-gray-500">No unfinished manual tasks. 🎉</p>
      ) : (
        <ul className="space-y-4">
          {manualTasks.map((task) => (
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
                <button
                  onClick={() => addToToday(task)}
                  className="text-green-600 hover:underline"
                >
                  Add to Today
                </button>
                <button
                  onClick={() => markTaskDone(task.id)}
                  className="text-blue-500 hover:underline"
                >
                  Mark Done
                </button>
                <button
                  onClick={() => dismissTask(task.id)}
                  className="text-gray-500 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

// Export the component with dynamic import to prevent SSR issues
export default dynamic(() => Promise.resolve(LooseEndsPage), {
  ssr: false,
  loading: () => (
    <main className="max-w-md mx-auto p-4">
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading...</p>
      </div>
    </main>
  )
});