'use client';
import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AddTaskForm({ userId, onTaskAdded }) {
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask = {
      title: title.trim(),
      detail: detail.trim(),
      userId,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'tasks'), newTask);
    onTaskAdded({ id: docRef.id, ...newTask });

    setTitle('');
    setDetail('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-2">
      <input
        type="text"
        placeholder="Task title"
        className="w-full border px-3 py-2 rounded"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="text"
        placeholder="Details (optional)"
        className="w-full border px-3 py-2 rounded"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Add Task
      </button>
    </form>
  );
}