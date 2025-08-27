'use client';

import { useState, useEffect } from 'react';
import { initializeFirebaseClient } from '@/lib/firebase-client';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function DebugPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [firebaseInstances, setFirebaseInstances] = useState({ auth: null, db: null });
  const router = useRouter();

  // Initialize Firebase
  useEffect(() => {
    const { auth, db } = initializeFirebaseClient();
    setFirebaseInstances({ auth, db });
  }, []);

  const { auth, db } = firebaseInstances;

  // Auth state management
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  // Load all user tasks
  const loadAllTasks = async () => {
    if (!user || !db) return;

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid)
      );

      const snapshot = await getDocs(q);
      const allTasks = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert timestamps to readable strings for display
          createdAt_readable: data.createdAt?.toDate?.()?.toString() || 'Invalid Date',
          completedAt_readable: data.completedAt?.toDate?.()?.toString() || null,
          lastActivityAt_readable: data.lastActivityAt?.toDate?.()?.toString() || null,
        };
      });

      console.log(`Found ${allTasks.length} total tasks`);
      setTasks(allTasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!db) return;
    if (!confirm(`Delete task ${taskId}?`)) return;

    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setTasks(prev => prev.filter(t => t.id !== taskId));
      alert('Task deleted');
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Error deleting task: ' + err.message);
    }
  };

  if (authLoading) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Debug Page</h1>
        <p>Loading auth...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Debug Page</h1>
        <p>Please log in first.</p>
        <button 
          onClick={() => router.push('/login')}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Debug Page</h1>
        <button 
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="mb-4">
        <p>Logged in as: <strong>{user.displayName || user.email}</strong></p>
        <p>User ID: <code className="bg-gray-100 px-2 py-1 rounded">{user.uid}</code></p>
      </div>

      <div className="mb-4">
        <button
          onClick={loadAllTasks}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load All Tasks'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-200 rounded">
          <h3 className="font-bold text-red-800">Error:</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {tasks.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-2">All Tasks ({tasks.length})</h2>
          
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className="border border-gray-200 rounded p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {task.title} 
                      {task.isProject && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">PROJECT</span>}
                      {task.completed && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">COMPLETED</span>}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      ID: <code>{task.id}</code>
                    </p>
                    {task.detail && <p className="text-sm mt-1">{task.detail}</p>}
                    
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      <p>Created: {task.createdAt_readable}</p>
                      {task.completedAt_readable && <p>Completed: {task.completedAt_readable}</p>}
                      {task.lastActivityAt_readable && <p>Last Activity: {task.lastActivityAt_readable}</p>}
                      <p>Category: {task.category || 'none'}</p>
                      <p>Priority: {task.priority || 'none'}</p>
                      <p>Source: {task.source || 'unknown'}</p>
                      {task.subtasks && (
                        <div>
                          <p>Subtasks ({task.subtasks.length}):</p>
                          <ul className="ml-4 list-disc">
                            {task.subtasks.map((st, i) => (
                              <li key={i} className={st.completed ? 'line-through' : ''}>
                                {st.title || `Subtask ${i + 1}`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="ml-4 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}