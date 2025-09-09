/**
 * AI-related type definitions for future integrations
 * Supporting voice transcription, task suggestions, and behavioral predictions
 */

import { Task, TaskCategory, TaskPriority } from './models';

// Generic AI Response wrapper
export interface AiResponse<T> {
  data: T;
  error?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

// AI Task Suggestions
export interface AiSuggestion {
  tasks: Task[];
  rationale: string;
  priority: 'high' | 'medium' | 'low';
  category: TaskCategory;
  confidence: number;
}

// Voice transcription types
export interface VoiceTranscription {
  text: string;
  confidence: number;
  language: string;
  duration: number;
}

export interface VoiceToTaskRequest {
  transcription: VoiceTranscription;
  userContext?: {
    recentTasks: Task[];
    preferences: Record<string, any>;
    timeOfDay: string;
  };
}

export interface VoiceToTaskResponse {
  suggestedTask: Partial<Task>;
  confidence: number;
  requiresConfirmation: boolean;
  alternativeSuggestions?: Partial<Task>[];
}

// Behavioral prediction types
export interface UserBehaviorData {
  userId: string;
  completionPatterns: {
    byHour: Record<string, number>;
    byDay: Record<string, number>;
    byCategory: Record<TaskCategory, number>;
  };
  averageTimeToComplete: Record<TaskCategory, number>;
  commonDropoffPoints: string[];
}

export interface BehaviorPrediction {
  taskId: string;
  likelyToComplete: boolean;
  confidence: number;
  suggestedNudge?: string;
  optimalReminderTime?: Date;
  riskFactors: string[];
}

// Prompt templates for AI integrations
export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  category: 'task_creation' | 'suggestion' | 'behavior' | 'voice';
}

// AI Provider interfaces
export interface AiProvider {
  name: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface OpenAiRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface GrokRequest {
  prompt: string;
  context?: Record<string, any>;
  behaviorData?: UserBehaviorData;
}

// AI Processing Results
export interface TaskProcessingResult {
  originalInput: string;
  processedTask: Task;
  confidence: number;
  suggestedImprovements?: string[];
  categoryRecommendation?: TaskCategory;
  priorityRecommendation?: TaskPriority;
}

// Error types for AI operations
export type AiErrorType = 
  | 'transcription_failed'
  | 'suggestion_generation_failed'
  | 'behavior_analysis_failed'
  | 'api_rate_limit'
  | 'api_key_invalid'
  | 'network_error';

export interface AiError {
  type: AiErrorType;
  message: string;
  retryable: boolean;
  retryAfter?: number;
}

// AI Service Configuration
export interface AiConfig {
  providers: {
    openai?: AiProvider;
    grok?: AiProvider;
  };
  features: {
    voiceToTask: boolean;
    behaviorPrediction: boolean;
    taskSuggestions: boolean;
    smartReminders: boolean;
  };
  limits: {
    maxSuggestionsPerDay: number;
    maxVoiceProcessingPerHour: number;
  };
}