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

export default function LooseEndsClient() {
  const [user, loading] = useAuthState(auth);
  const [manualTasks, setManualTasks] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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
      const tasks = [];
      
      snapshot.forEach((doc) => {
        const task = { id: doc.id, ...doc.data() };
        
        if (!task.completedAt && !task.deleted && !task.dismissed && task.source === 'manual') {
          const createdDate = task.createdAt?.toDate() || new Date();
          createdDate.setHours(0, 0, 0, 0);
          
          if (createdDate < today) {
            tasks.push(task);
          }
        }
      });

      // Remove duplicates based on title
      const seen = new Set();
      const deduped = tasks.filter(task => {
        if (seen.has(task.title)) {
          return false;
        }
        seen.add(task.title);
        return true;
      });

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

  // Prevent rendering during auth loading
  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to view your loose ends.</p>
        </div>
      </div>
    );
  }

  const markTaskDone = async (taskId) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { completedAt: Timestamp.now() });
    setManualTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const dismissTask = async (taskId) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { dismissed: true });
    setManualTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  if (manualTasks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h1>
          <p className="text-gray-600">No loose ends from previous days.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loose Ends</h1>
          <p className="text-gray-600">Tasks from previous days that need attention</p>
        </div>

        <div className="space-y-4">
          {manualTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{task.title}</h3>
                  {task.detail && (
                    <p className="text-gray-600 text-sm mt-1">{task.detail}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>Created: {task.createdAt?.toDate().toLocaleDateString()}</span>
                    <span className="capitalize">{task.category}</span>
                    <span className="capitalize">{task.priority}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => markTaskDone(task.id)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => dismissTask(task.id)}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}