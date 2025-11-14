import { init } from '@instantdb/react';

// Simplified types for InstantDB
export interface User {
  id: string;
  email: string;
  name?: string;
  onboardingCompleted?: boolean;

  // Profile from onboarding
  children?: {
    ageRange: string; // e.g., "0-3", "3-6", etc.
    ageInMonths?: number; // calculated from age range
  }[];
  hasPartner?: boolean;
  state?: string;
  isHomeowner?: boolean;
  homeType?: string;
  workSituation?: string;

  createdAt?: number;
  updatedAt?: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  completed: boolean;
  source: string; // 'manual' | 'ai_mentor' | 'voice'

  // AI context
  aiGenerated?: boolean;
  aiContext?: {
    prompt?: string;
    reasoning?: string;
  };

  // Chat history for this specific task
  chatHistory?: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }[];

  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

// Define the schema for InstantDB
type Schema = {
  users: User;
  tasks: Task;
};

// Initialize InstantDB with app ID
const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID!;

if (!APP_ID) {
  throw new Error('NEXT_PUBLIC_INSTANTDB_APP_ID is not defined in environment variables');
}

// Initialize and export the db instance
export const db = init<Schema>({ appId: APP_ID });

// Export types for use throughout the app
export type { Schema };
