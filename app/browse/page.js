'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { coreAutoTasks } from '@/lib/coreAutoTasks';
import { expandedTaskLibrary } from '@/lib/taskEngine';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import dynamic from 'next/dynamic';

function BrowsePage() {
  const [user, loading] = useAuthState(auth);
  const [addedIds, setAddedIds] = useState({});
  const [showExpanded, setShowExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const taskSet = showExpanded ? expandedTaskLibrary : groupTasksByCategory(coreAutoTasks);

  function groupTasksByCategory(tasks) {
    return tasks.reduce((acc, task) => {
      if (!acc[task.category]) acc[task.category] = [];
      acc[task.category].push(task);
      return acc;
    }, {});
  }

  const handleAdd = async (task) => {
    if (!user) return;

    // Remove template ID to let Firestore generate proper document ID
    const { id: templateId, ...taskData } = task;
    
    const taskToAdd = {
      ...taskData,
      userId: user.uid,
      createdAt: Timestamp.now(),
      source: 'manual',
      // Add dismissed and deleted fields for consistency
      dismissed: false,
      deleted: false
    };

    await addDoc(collection(db, 'tasks'), taskToAdd);
    setAddedIds((prev) => ({ ...prev, [templateId]: true }));
  };

  const toggleSection = (category) => {
    setExpandedSections((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  // Handle SSR and loading states
  if (!mounted || loading) {
    return (
      <main className="max-w-md mx-auto p-4 mobile-content">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-md mx-auto p-4 mobile-content">
        <p className="text-center text-gray-500">Please log in to browse tasks.</p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Browse Task Suggestions</h1>
      <button
        onClick={() => setShowExpanded((prev) => !prev)}
        className="mb-4 text-sm text-blue-600 underline"
      >
        {showExpanded ? 'Show Recommended Only' : 'Show All'}
      </button>

      {Object.entries(taskSet).map(([category, tasks]) => (
        <div key={category} className="mb-8">
          <h2
            className="text-lg font-semibold mb-2 capitalize cursor-pointer flex justify-between items-center"
            onClick={() => toggleSection(category)}
          >
            <span>{category}</span>
            <span className="text-sm text-blue-500">
              {expandedSections[category] ? 'Hide' : 'Expand'}
            </span>
          </h2>
          {expandedSections[category] && (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="bg-white border p-4 rounded-xl shadow-sm flex justify-between items-start"
                >
                  <div>
                    <div className="font-semibold">{task.title}</div>
                    <div className="text-sm text-gray-500">{task.detail}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {task.simplicity === 'low'
                        ? '⏱ 2 min or less'
                        : task.simplicity === 'medium'
                        ? '⏱ 2–10 min'
                        : '⏱ 10+ min'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdd(task)}
                    disabled={addedIds[task.id]}
                    className="ml-4 px-3 py-1 text-sm rounded-lg text-white bg-blue-600 disabled:bg-gray-300"
                  >
                    {addedIds[task.id] ? 'Added' : 'Add'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </main>
  );
}

// Export the component with dynamic import to prevent SSR issues
export default dynamic(() => Promise.resolve(BrowsePage), {
  ssr: false,
  loading: () => (
    <main className="max-w-md mx-auto p-4 pb-24">
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading...</p>
      </div>
    </main>
  )
});