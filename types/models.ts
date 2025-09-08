/**
 * Core Data Models for Betterish Application
 * 
 * These interfaces define the shape of data structures used throughout the app.
 * They serve as the single source of truth for TypeScript type checking.
 */

import { Timestamp } from 'firebase/firestore';

// =============================================
// BASIC ID TYPES
// =============================================

export type TaskId = string;
export type UserId = string;
export type ProjectId = string;
export type SubtaskId = number;

// =============================================
// ENUMS & CONSTANTS
// =============================================

export enum TaskStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  SNOOZED = 'snoozed',
  ARCHIVED = 'archived'
}

export enum TaskCategory {
  PERSONAL = 'personal',
  HOUSEHOLD = 'household',
  WORK = 'work',
  BABY = 'baby',
  RELATIONSHIP = 'relationship',
  HEALTH = 'health',
  EVENTS = 'events',
  MAINTENANCE = 'maintenance',
  HOME_PROJECTS = 'home_projects'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum TaskSource {
  MANUAL = 'manual',
  AI_MENTOR = 'ai_mentor',
  VOICE = 'voice',
  TEMPLATE = 'template'
}

export enum EmergencyMode {
  OFF = 'off',
  BABY = 'baby',
  CRISIS = 'crisis'
}

// =============================================
// USER INTERFACE
// =============================================

export interface User {
  uid: UserId;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Profile information
  profile?: {
    firstName?: string;
    lastName?: string;
    state?: string; // US state for location-based suggestions
    timezone?: string;
    
    // Family & relationship context
    hasPartner?: boolean;
    hasChildren?: boolean;
    childrenAges?: number[];
    
    // Home context
    isHomeowner?: boolean;
    homeType?: 'house' | 'apartment' | 'condo' | 'other';
    
    // Work context
    workType?: 'office' | 'remote' | 'hybrid' | 'freelance' | 'unemployed';
    workHours?: {
      start: string; // HH:mm format
      end: string;
    };
  };
  
  // App settings
  settings?: {
    emergencyMode?: EmergencyMode;
    notificationsEnabled?: boolean;
    voiceEnabled?: boolean;
    theme?: 'light' | 'dark' | 'system';
    onboardingCompleted?: boolean;
  };
}

// =============================================
// SUBTASK INTERFACE
// =============================================

export interface Subtask {
  id: SubtaskId;
  title: string;
  completed: boolean;
  completedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// =============================================
// MAIN TASK INTERFACE
// =============================================

export interface Task {
  // Core identification
  id: TaskId;
  userId: UserId;
  
  // Content
  title: string;
  description?: string;
  
  // Categorization
  category: TaskCategory;
  priority: TaskPriority;
  tags?: string[];
  
  // Status & lifecycle
  status: TaskStatus;
  completed: boolean;
  dismissed?: boolean;
  deleted?: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  snoozedUntil: Date | null;
  lastActivityAt?: Date;
  
  // Project-specific fields
  isProject: boolean;
  subtasks?: Subtask[];
  progress?: number; // 0-100 percentage
  
  // AI & automation
  source: TaskSource;
  aiGenerated?: boolean;
  aiContext?: {
    prompt?: string;
    model?: string;
    confidence?: number;
  };
  
  // Metadata
  notes?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  
  // Relationships
  parentProjectId?: ProjectId;
  relatedTaskIds?: TaskId[];
  
  // Seasonal/contextual data
  seasonal?: {
    months?: number[]; // 1-12 for applicable months
    regions?: string[];
    homeownerOnly?: boolean;
  };
}

// =============================================
// SPECIALIZED TASK TYPES
// =============================================

export interface Project extends Task {
  isProject: true;
  subtasks: Subtask[];
  progress: number;
  
  // Project-specific metadata
  projectType?: 'personal' | 'household' | 'work';
  estimatedDays?: number;
  actualDays?: number;
}

// =============================================
// EVENT INTERFACE
// =============================================

export interface Event {
  id: string;
  userId: UserId;
  
  // Content
  title: string;
  description?: string;
  
  // Timing
  date: Date;
  startTime?: string; // HH:mm format
  endTime?: string;
  allDay?: boolean;
  
  // Location
  location?: string;
  virtualUrl?: string;
  
  // Categorization
  category: 'appointment' | 'social' | 'work' | 'personal' | 'family';
  priority: TaskPriority;
  
  // Status
  status: 'scheduled' | 'completed' | 'cancelled';
  
  // Relationships
  relatedTaskIds?: TaskId[];
  
  // Reminders
  reminders?: {
    type: 'notification' | 'email';
    minutesBefore: number;
  }[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// NOTIFICATION INTERFACE
// =============================================

export interface Notification {
  id: string;
  userId: UserId;
  
  // Content
  title: string;
  body: string;
  icon?: string;
  image?: string;
  
  // Behavior
  type: 'task_reminder' | 'achievement' | 'system' | 'ai_suggestion';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Actions
  actions?: {
    id: string;
    title: string;
    action: 'complete_task' | 'snooze_task' | 'open_app' | 'dismiss';
    taskId?: TaskId;
  }[];
  
  // Status
  read: boolean;
  delivered: boolean;
  clicked?: boolean;
  
  // Context
  relatedTaskId?: TaskId;
  relatedEventId?: string;
  
  // Scheduling
  scheduledFor?: Date;
  deliveredAt?: Date;
  expiresAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// SUBSCRIPTION & PREMIUM FEATURES
// =============================================

export interface Subscription {
  id: string;
  userId: UserId;
  
  // Plan details
  plan: 'free' | 'premium' | 'family';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  
  // Billing
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
  
  // Features
  features: {
    maxTasks?: number;
    voiceTranscription?: boolean;
    advancedAI?: boolean;
    familySharing?: boolean;
    prioritySupport?: boolean;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// ACHIEVEMENT & GAMIFICATION
// =============================================

export interface Achievement {
  id: string;
  userId: UserId;
  
  // Achievement details
  type: 'streak' | 'completion' | 'milestone' | 'feature_usage';
  name: string;
  description: string;
  icon?: string;
  
  // Progress
  unlockedAt: Date;
  progress?: {
    current: number;
    target: number;
  };
  
  // Rewards
  reward?: {
    type: 'feature_unlock' | 'badge' | 'points';
    value: string | number;
  };
  
  // Metadata
  createdAt: Date;
}

// =============================================
// FIREBASE-SPECIFIC TYPES
// =============================================

// Raw Firestore document data (before conversion)
export interface TaskFirestoreDoc {
  userId: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  completed: boolean;
  dismissed?: boolean;
  deleted?: boolean;
  isProject: boolean;
  subtasks?: Subtask[];
  progress?: number;
  source: string;
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
  snoozedUntil: Timestamp | null;
  lastActivityAt?: Timestamp;
  [key: string]: any; // Allow additional fields
}

// Firebase User type (from react-firebase-hooks)
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

// =============================================
// UTILITY TYPES
// =============================================

// Task filters for queries
export interface TaskFilters {
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  isProject?: boolean;
  limit?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Pagination helper
export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

// Sort options
export interface SortOptions {
  field: keyof Task;
  direction: 'asc' | 'desc';
}

// Export validation helpers
export const isValidTaskStatus = (status: string): status is TaskStatus => {
  return Object.values(TaskStatus).includes(status as TaskStatus);
};

export const isValidTaskCategory = (category: string): category is TaskCategory => {
  return Object.values(TaskCategory).includes(category as TaskCategory);
};

export const isValidTaskPriority = (priority: string): priority is TaskPriority => {
  return Object.values(TaskPriority).includes(priority as TaskPriority);
};

export const isValidTaskSource = (source: string): source is TaskSource => {
  return Object.values(TaskSource).includes(source as TaskSource);
};