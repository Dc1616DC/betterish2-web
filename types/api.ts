/**
 * API Types for Betterish Application
 * 
 * Defines request/response types for all API endpoints.
 * Ensures type safety for client-server communication.
 */

import { Task, TaskId, UserId, Subtask } from './models';

// =============================================
// GENERIC API RESPONSE TYPES
// =============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  fallback?: boolean; // Indicates if fallback response was used
}

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
  suggestion?: string;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =============================================
// AUTHENTICATION API
// =============================================

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse extends ApiResponse {
  data?: {
    user: {
      uid: string;
      email: string;
      displayName: string | null;
      photoURL: string | null;
    };
    token: string;
    expiresIn: number;
  };
}

export interface LogoutRequest {
  userId: string;
}

export interface LogoutResponse extends ApiResponse {
  message: string;
}

// =============================================
// TASK BREAKDOWN API (AI)
// =============================================

export interface TaskBreakdownRequest {
  taskTitle: string;
  context?: string;
  userId?: string;
}

export interface TaskBreakdownResponse extends ApiResponse {
  data?: {
    subtasks: string[];
    originalTask: string;
    fallback?: boolean;
  };
  subtasks?: string[]; // Legacy support
  originalTask?: string; // Legacy support
}

// =============================================
// VOICE TRANSCRIPTION API
// =============================================

export interface TranscriptionRequest {
  // FormData with 'file' field containing audio
}

export interface TranscriptionResponse extends ApiResponse {
  data?: {
    text: string;
    confidence?: number;
    language?: string;
  };
  text?: string; // Legacy support
}

// =============================================
// SIDEKICK CHAT API
// =============================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface SidekickChatRequest {
  task: Task;
  message: string;
  conversationHistory?: ChatMessage[];
  userProfile: {
    id: UserId;
    tier?: 'free' | 'premium' | 'family';
    preferences?: {
      responseStyle?: 'brief' | 'detailed';
      includeLinks?: boolean;
    };
  };
}

export interface SidekickChatResponse extends ApiResponse {
  data?: {
    response: string;
    conversationId?: string;
    suggestedActions?: string[];
    relatedTasks?: Task[];
  };
  response?: string; // Legacy support
}

// =============================================
// AI CHECK-IN API
// =============================================

export interface AiCheckinRequest {
  userId: UserId;
  context?: {
    recentTasks?: Task[];
    currentProjects?: Task[];
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    mood?: 'motivated' | 'neutral' | 'overwhelmed' | 'tired';
  };
  preferences?: {
    responseLength?: 'brief' | 'detailed';
    focusAreas?: string[];
  };
}

export interface AiCheckinResponse extends ApiResponse {
  data?: {
    message: string;
    suggestions: {
      id: string;
      type: 'task' | 'break' | 'priority_shift' | 'encouragement';
      title: string;
      description?: string;
      actionable?: boolean;
      taskId?: TaskId;
    }[];
    mood?: {
      detected: string;
      confidence: number;
    };
    followUpQuestions?: string[];
  };
}

// =============================================
// TASK MANAGEMENT API (Future)
// =============================================

export interface CreateTaskRequest {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  tags?: string[];
  estimatedMinutes?: number;
  dueDate?: Date;
  isProject?: boolean;
  subtasks?: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>[];
}

export interface CreateTaskResponse extends ApiResponse {
  data?: Task;
}

export interface UpdateTaskRequest {
  taskId: TaskId;
  updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>;
}

export interface UpdateTaskResponse extends ApiResponse {
  data?: Task;
}

export interface GetTasksRequest {
  userId: UserId;
  filters?: {
    status?: string[];
    category?: string[];
    priority?: string[];
    isProject?: boolean;
    dateRange?: {
      start: Date;
      end: Date;
    };
    search?: string;
  };
  pagination?: {
    page: number;
    limit: number;
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface GetTasksResponse extends PaginatedApiResponse<Task> {}

export interface DeleteTaskRequest {
  taskId: TaskId;
  permanent?: boolean; // true for hard delete, false for soft delete
}

export interface DeleteTaskResponse extends ApiResponse {
  data?: {
    taskId: TaskId;
    deleted: boolean;
    permanent: boolean;
  };
}

// =============================================
// BULK OPERATIONS
// =============================================

export interface BulkTaskOperationRequest {
  taskIds: TaskId[];
  operation: 'complete' | 'archive' | 'delete' | 'priority_update';
  params?: {
    priority?: string;
    category?: string;
    tags?: string[];
  };
}

export interface BulkTaskOperationResponse extends ApiResponse {
  data?: {
    successCount: number;
    failedCount: number;
    errors?: { taskId: TaskId; error: string }[];
    updatedTasks?: Task[];
  };
}

// =============================================
// ADMIN API
// =============================================

export interface AdminCleanupRequest {
  targetUser?: UserId;
  operations: ('duplicates' | 'orphaned' | 'archived')[];
  dryRun?: boolean;
}

export interface AdminCleanupResponse extends ApiResponse {
  data?: {
    duplicatesRemoved: number;
    orphanedTasksRemoved: number;
    archivedTasksRemoved: number;
    totalCleaned: number;
    dryRun: boolean;
  };
}

// =============================================
// NOTIFICATION API
// =============================================

export interface SendNotificationRequest {
  userId: UserId;
  title: string;
  body: string;
  type: 'task_reminder' | 'achievement' | 'system' | 'ai_suggestion';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actions?: {
    id: string;
    title: string;
    action: string;
    taskId?: TaskId;
  }[];
  scheduledFor?: Date;
  expiresAt?: Date;
}

export interface SendNotificationResponse extends ApiResponse {
  data?: {
    notificationId: string;
    deliveredAt?: Date;
    scheduledFor?: Date;
  };
}

// =============================================
// ANALYTICS API
// =============================================

export interface AnalyticsRequest {
  userId: UserId;
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: ('completion_rate' | 'task_velocity' | 'category_breakdown' | 'streak_data')[];
}

export interface AnalyticsResponse extends ApiResponse {
  data?: {
    completionRate: {
      percentage: number;
      trend: 'up' | 'down' | 'stable';
    };
    taskVelocity: {
      tasksPerDay: number;
      trend: 'up' | 'down' | 'stable';
    };
    categoryBreakdown: {
      category: string;
      count: number;
      percentage: number;
    }[];
    streakData: {
      currentStreak: number;
      longestStreak: number;
      streakType: 'daily' | 'weekly';
    };
    insights: {
      id: string;
      type: 'achievement' | 'suggestion' | 'warning';
      title: string;
      description: string;
      actionable: boolean;
    }[];
  };
}

// =============================================
// UPLOAD API
// =============================================

export interface FileUploadRequest {
  file: File;
  type: 'audio' | 'image' | 'document';
  purpose: 'transcription' | 'task_attachment' | 'profile_photo';
  metadata?: {
    taskId?: TaskId;
    userId?: UserId;
    [key: string]: any;
  };
}

export interface FileUploadResponse extends ApiResponse {
  data?: {
    fileId: string;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
  };
}

// =============================================
// WEBHOOK TYPES (for external integrations)
// =============================================

export interface WebhookEvent {
  id: string;
  type: 'task.completed' | 'task.created' | 'project.completed' | 'user.achievement';
  timestamp: Date;
  userId: UserId;
  data: {
    taskId?: TaskId;
    task?: Task;
    achievement?: {
      id: string;
      name: string;
      description: string;
    };
    [key: string]: any;
  };
}

export interface WebhookResponse extends ApiResponse {
  received: boolean;
  processed: boolean;
  processedAt?: Date;
}

// =============================================
// ERROR CODES
// =============================================

export enum ApiErrorCode {
  // Authentication
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Validation
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  INVALID_INPUT = 'INVALID_INPUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Business Logic
  DUPLICATE_TASK = 'DUPLICATE_TASK',
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // External Services
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  TRANSCRIPTION_FAILED = 'TRANSCRIPTION_FAILED',
  NOTIFICATION_FAILED = 'NOTIFICATION_FAILED',
  
  // System
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

// =============================================
// TYPE GUARDS
// =============================================

export const isApiError = (response: any): response is ApiError => {
  return response && typeof response.error === 'string';
};

export const isSuccessResponse = <T>(response: ApiResponse<T>): response is Required<ApiResponse<T>> => {
  return response.success === true && response.data !== undefined;
};

export const isPaginatedResponse = <T>(response: any): response is PaginatedApiResponse<T> => {
  return response && response.pagination && Array.isArray(response.data);
};

// =============================================
// REQUEST HELPERS
// =============================================

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface ApiRequestOptions {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  authToken?: string;
}