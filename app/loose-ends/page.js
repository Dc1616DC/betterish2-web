'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  Timestamp,
  doc
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

function LooseEndsPage() {
  const [user, loading] = useAuthState(auth);
  const [manualTasks, setManualTasks] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Early return for SSR/hydration
  if (typeof window === 'undefined') {
    return null;
  }

  const fetchLooseEnds = useCallback(async () => {
    if (!user) return;
    
    try {
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
        const isDismissed = data.status === 'dismissed' || data.dismissed;
        
        // Exclude snoozed tasks that haven't reached their snooze time yet
        const isSnoozed = data.snoozedUntil && data.snoozedUntil.toDate() > new Date();
        
        return isBeforeToday && isIncomplete && isManual && !isDismissed && !isSnoozed;
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
    } catch (error) {
      console.error('Error fetching loose ends:', error);
      setManualTasks([]);
    }
  }, [user]);

  useEffect(() => {
    if (!mounted || !user) return;
    fetchLooseEnds();
  }, [user, mounted, fetchLooseEnds]);

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
    try {
      console.log('🔧 addToToday called with task:', task);
      
      // Update the existing task to move it to today instead of creating a new one
      const taskRef = doc(db, 'tasks', task.id);
      const now = Timestamp.now();
      
      // Prepare update data, ensuring no undefined fields
      const updateData = {
        createdAt: now,
        lastRestored: now,
        restoreCount: (task.restoreCount || 0) + 1,
        dismissed: false,  // Clear any dismissed status
        snoozedUntil: null, // Clear any snooze
        lastActivityAt: now,
        // Ensure title and detail are never undefined
        title: task.title || 'Untitled Task',
        detail: task.detail || ''
      };

      console.log('🔧 Updating with data:', updateData);
      
      await updateDoc(taskRef, updateData);

      console.log('✅ Successfully updated task');
      
      // Remove from loose ends list immediately for UI feedback
      setManualTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (error) {
      console.error('❌ Error moving task to today:', error);
      console.error('❌ Task data was:', task);
      // Fallback: if update fails, refresh the data to show correct state
      fetchLooseEnds();
    }
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Loose Ends</h1>
      </div>


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

export default LooseEndsPage;