'use client';

import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Task, UserId } from '@/types/models';
import { BaseProps } from '@/types/components';

export interface AddTaskFormProps extends BaseProps {
  userId: UserId;
  onTaskAdded: (task: Task) => void;
}

interface TaskFormData {
  title: string;
  detail: string;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({
  userId,
  onTaskAdded,
  className,
  children,
  'data-testid': testId
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    detail: ''
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;
    
    setIsSubmitting(true);

    try {
      const newTaskData = {
        title: formData.title.trim(),
        detail: formData.detail.trim(),
        userId,
        createdAt: Timestamp.now(),
      };

      if (!db) {
        throw new Error('Firebase not initialized');
      }
      
      const docRef = await addDoc(collection(db, 'tasks'), newTaskData);
      
      // Create the full task object for the callback
      const newTask: Task = {
        id: docRef.id,
        ...newTaskData,
        // Add required Task properties with default values
        description: formData.detail.trim() || undefined,
        category: 'personal' as any, // Will need proper type casting
        priority: 'medium' as any,
        status: 'active' as any,
        completed: false,
        dismissed: false,
        deleted: false,
        updatedAt: new Date(),
        completedAt: null,
        snoozedUntil: null,
        lastActivityAt: new Date(),
        isProject: false,
        source: 'manual' as any,
        aiGenerated: false,
        createdAt: new Date() // Convert Timestamp to Date for the callback
      };

      onTaskAdded(newTask);

      // Reset form
      setFormData({
        title: '',
        detail: ''
      });
    } catch (error) {
      console.error('Error adding task:', error);
      // TODO: Handle error properly with user feedback
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`mb-6 space-y-2 ${className || ''}`}
      data-testid={testId}
    >
      <input
        type="text"
        name="title"
        placeholder="Task title"
        className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={formData.title}
        onChange={handleInputChange}
        disabled={isSubmitting}
        required
        maxLength={100}
      />
      <input
        type="text"
        name="detail"
        placeholder="Details (optional)"
        className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={formData.detail}
        onChange={handleInputChange}
        disabled={isSubmitting}
        maxLength={500}
      />
      <button
        type="submit"
        disabled={!formData.title.trim() || isSubmitting}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            <span>Adding...</span>
          </>
        ) : (
          'Add Task'
        )}
      </button>
      
      {children}
    </form>
  );
};

export default AddTaskForm;