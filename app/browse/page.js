'use client';

import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { coreAutoTasks } from '@/lib/coreAutoTasks';
import { expandedTaskLibrary } from '@/lib/taskEngine';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

export default function BrowsePage() {
  const [user] = useAuthState(auth);
  const [addedIds, setAddedIds] = useState({});
  const [showExpanded, setShowExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

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

    const taskToAdd = {
      ...task,
      userId: user.uid,
      createdAt: Timestamp.now(),
      source: 'manual'
    };

    await addDoc(collection(db, 'tasks'), taskToAdd);
    setAddedIds((prev) => ({ ...prev, [task.id]: true }));
  };

  const toggleSection = (category) => {
    setExpandedSections((prev) => ({ ...prev, [category]: !prev[category] }));
  };

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