'use client';

import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { taskSuggestions } from '@/constants/tasks';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

export default function BrowsePage() {
  const [user] = useAuthState(auth);
  const [addedIds, setAddedIds] = useState({});

  const handleAdd = async (task, category, index) => {
    if (!user) return;

    const taskToAdd = {
      ...task,
      userId: user.uid,
      createdAt: Timestamp.now(),
    };

    await addDoc(collection(db, 'tasks'), taskToAdd);
    setAddedIds((prev) => ({ ...prev, [`${category}-${index}`]: true }));
  };

  return (
    <main className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Browse Task Suggestions</h1>

      {Object.entries(taskSuggestions).map(([category, tasks]) => (
        <div key={category} className="mb-6">
          <h2 className="text-lg font-semibold mb-2 capitalize">{category}</h2>
          <ul className="space-y-2">
            {Array.isArray(tasks)
              ? tasks.map((task, index) => (
                  <li
                    key={`${category}-${index}`}
                    className="bg-white border p-4 rounded-xl shadow-sm flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold">{task.title}</div>
                      <div className="text-sm text-gray-500">{task.detail}</div>
                    </div>
                    <button
                      onClick={() => handleAdd(task, category, index)}
                      disabled={addedIds[`${category}-${index}`]}
                      className="ml-4 px-3 py-1 text-sm rounded-lg text-white bg-blue-600 disabled:bg-gray-300"
                    >
                      {addedIds[`${category}-${index}`] ? 'Added' : 'Add'}
                    </button>
                  </li>
                ))
              : Object.entries(tasks).map(([subcat, subTasks]) => (
                  <div key={subcat}>
                    <h3 className="text-sm text-gray-500 mt-2 capitalize">
                      {subcat}
                    </h3>
                    {subTasks.map((task, index) => (
                      <li
                        key={`${category}-${subcat}-${index}`}
                        className="bg-white border p-4 rounded-xl shadow-sm flex justify-between items-center mt-1"
                      >
                        <div>
                          <div className="font-semibold">{task.title}</div>
                          <div className="text-sm text-gray-500">{task.detail}</div>
                        </div>
                        <button
                          onClick={() =>
                            handleAdd(task, `${category}-${subcat}`, index)
                          }
                          disabled={addedIds[`${category}-${subcat}-${index}`]}
                          className="ml-4 px-3 py-1 text-sm rounded-lg text-white bg-blue-600 disabled:bg-gray-300"
                        >
                          {addedIds[`${category}-${subcat}-${index}`]
                            ? 'Added'
                            : 'Add'}
                        </button>
                      </li>
                    ))}
                  </div>
                ))}
          </ul>
        </div>
      ))}
    </main>
  );
}