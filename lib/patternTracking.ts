/**
 * Pattern Tracking System
 * Learns user behavior to enable smart AI suggestions
 * This is the foundation for the AI mentor system
 */

import { 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc,
  serverTimestamp,
  arrayUnion,
  increment,
  Timestamp,
  DocumentReference,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, TaskCategory, UserId } from '../types/models';

// Pattern tracking interfaces
export interface CategoryUsage {
  relationship: Timestamp | null;
  household: Timestamp | null;
  baby: Timestamp | null;
  home_projects: Timestamp | null;
  health: Timestamp | null;
  personal: Timestamp | null;
  maintenance: Timestamp | null;
  work: Timestamp | null;
  [key: string]: Timestamp | null;
}

export interface CompletionsByTime {
  [key: string]: number; // "8": 5, "20": 12
}

export interface SuggestionHistory {
  [suggestionId: string]: {
    timestamp: Timestamp;
    accepted: boolean;
    category: string;
  };
}

export interface DurationPreference {
  short?: number;
  medium?: number;
  long?: number;
}

export interface BehavioralPatterns {
  initialized: boolean;
  createdAt: Timestamp;
  schemaVersion: number;
  
  // Category usage tracking
  categoryLastUsed: CategoryUsage;
  
  // Completion patterns
  completionsByHour: CompletionsByTime;
  completionsByDay: CompletionsByTime;
  completionsByCategory: CompletionsByTime;
  
  // Task patterns
  averageTasksPerDay: number;
  taskCompletionRate: number;
  preferredTaskDuration: 'short' | 'medium' | 'long';
  durationPreference?: DurationPreference;
  totalTasksCompleted?: number;
  
  // Behavioral patterns
  overwhelmDays: string[];
  productiveDays: string[];
  streakDays: number;
  lastActiveDate: Timestamp | null;
  emergencyModeCount?: number;
  
  // Project patterns
  activeProjects: string[];
  abandonedProjects: string[];
  projectCompletionRate: number;
  
  // Interaction patterns
  suggestionsAccepted: number;
  suggestionsDismissed: number;
  suggestionHistory?: SuggestionHistory;
  checkInsCompleted: number;
  preferredCheckInTime: number | null;
  lastCheckIn?: Timestamp;
  
  // Seasonal patterns
  seasonalTasksCompleted: string[];
  missedSeasonalTasks: string[];
}

export interface PatternInsights {
  mostProductiveHour: number | null;
  mostProductiveDay: number | null;
  neglectedCategories: string[];
  preferredTaskSize: 'short' | 'medium' | 'long';
  isOverwhelmed: boolean;
  suggestionsEffectiveness: number;
}

export interface UserPatternsWithInsights extends BehavioralPatterns {
  insights: PatternInsights;
}

export interface Suggestion {
  id: string;
  category: TaskCategory | string;
  title: string;
  description?: string;
  [key: string]: any;
}

export interface AIContext {
  isNewUser: boolean;
  hasPatterns: boolean;
  isOverwhelmed?: boolean;
  isProductive?: boolean;
  neglectedCategories?: string[];
  favoriteCategories?: string[];
  currentHour?: number;
  mostProductiveHour?: number | null;
  dayOfWeek?: number;
  mostProductiveDay?: number | null;
  preferredTaskSize?: 'short' | 'medium' | 'long';
  acceptanceRate?: number;
  lastActive?: Timestamp | null;
  streakDays?: number;
  todayCompletions?: number;
}

/**
 * Initialize pattern tracking for a new user
 */
export async function initializePatternTracking(userId: UserId): Promise<UserPatternsWithInsights> {
  const patternsRef = doc(db, 'users', userId, 'patterns', 'behavioral');
  
  const initialPatterns: BehavioralPatterns = {
    initialized: true,
    createdAt: serverTimestamp() as Timestamp,
    schemaVersion: 1,
    
    // Category usage tracking
    categoryLastUsed: {
      relationship: null,
      household: null,
      baby: null,
      home_projects: null,
      health: null,
      personal: null,
      maintenance: null,
      work: null
    },
    
    // Completion patterns
    completionsByHour: {}, // { "8": 5, "20": 12 } = 5 tasks at 8am, 12 at 8pm
    completionsByDay: {}, // { "1": 10, "5": 25 } = 10 on Monday, 25 on Friday
    completionsByCategory: {},
    
    // Task patterns
    averageTasksPerDay: 0,
    taskCompletionRate: 0,
    preferredTaskDuration: 'medium', // short, medium, long
    
    // Behavioral patterns
    overwhelmDays: [], // Days when emergency mode was activated
    productiveDays: [], // Days with >5 completions
    streakDays: 0,
    lastActiveDate: null,
    
    // Project patterns
    activeProjects: [],
    abandonedProjects: [], // No progress in 14+ days
    projectCompletionRate: 0,
    
    // Interaction patterns
    suggestionsAccepted: 0,
    suggestionsDismissed: 0,
    checkInsCompleted: 0,
    preferredCheckInTime: null,
    
    // Seasonal patterns
    seasonalTasksCompleted: [],
    missedSeasonalTasks: []
  };
  
  await setDoc(patternsRef, initialPatterns);
  
  // Calculate insights for new patterns
  const insights = analyzePatterns(initialPatterns);
  
  return {
    ...initialPatterns,
    insights
  } as UserPatternsWithInsights;
}

/**
 * Track when a task is completed
 */
export async function trackTaskCompletion(userId: UserId, task: Task): Promise<void> {
  try {
    const patternsRef = doc(db, 'users', userId, 'patterns', 'behavioral');
    const patternsDoc = await getDoc(patternsRef);
    
    if (!patternsDoc.exists()) {
      await initializePatternTracking(userId);
    }
    
    const now = new Date();
    const hour = now.getHours().toString();
    const dayOfWeek = now.getDay().toString();
    const category = task.category || 'uncategorized';
    
    // Update multiple patterns in one transaction
    const updates: Record<string, any> = {
      [`categoryLastUsed.${category}`]: serverTimestamp(),
      [`completionsByHour.${hour}`]: increment(1),
      [`completionsByDay.${dayOfWeek}`]: increment(1),
      [`completionsByCategory.${category}`]: increment(1),
      lastActiveDate: serverTimestamp(),
      totalTasksCompleted: increment(1)
    };
    
    // Track task duration preference  
    if ((task as any).duration) {
      const taskDuration = (task as any).duration;
      const duration = taskDuration < 15 ? 'short' : 
                      taskDuration < 30 ? 'medium' : 'long';
      updates[`durationPreference.${duration}`] = increment(1);
    }
    
    await updateDoc(patternsRef, updates);
    
    // Check for productive day (>5 tasks)
    const todayCompletions = await getTodayCompletions(userId);
    if (todayCompletions >= 5) {
      await updateDoc(patternsRef, {
        productiveDays: arrayUnion(now.toISOString().split('T')[0])
      });
    }
    
  } catch (error) {
    console.error('Error tracking task completion:', error);
    // Don't throw - pattern tracking should never break the app
  }
}

/**
 * Track when a suggestion is accepted or dismissed
 */
export async function trackSuggestionResponse(userId: UserId, suggestion: Suggestion, accepted: boolean): Promise<void> {
  try {
    const patternsRef = doc(db, 'users', userId, 'patterns', 'behavioral');
    
    const field = accepted ? 'suggestionsAccepted' : 'suggestionsDismissed';
    await updateDoc(patternsRef, {
      [field]: increment(1),
      [`suggestionHistory.${suggestion.id}`]: {
        timestamp: serverTimestamp(),
        accepted,
        category: suggestion.category
      }
    });
    
  } catch (error) {
    console.error('Error tracking suggestion response:', error);
  }
}

/**
 * Track when emergency mode is activated
 */
export async function trackEmergencyMode(userId: UserId): Promise<void> {
  try {
    const patternsRef = doc(db, 'users', userId, 'patterns', 'behavioral');
    const today = new Date().toISOString().split('T')[0];
    
    await updateDoc(patternsRef, {
      overwhelmDays: arrayUnion(today),
      emergencyModeCount: increment(1)
    });
    
  } catch (error) {
    console.error('Error tracking emergency mode:', error);
  }
}

/**
 * Get user's behavior patterns for AI context
 */
export async function getUserPatterns(userId: UserId): Promise<UserPatternsWithInsights | null> {
  try {
    const patternsRef = doc(db, 'users', userId, 'patterns', 'behavioral');
    const patternsDoc = await getDoc(patternsRef);
    
    if (!patternsDoc.exists()) {
      return await initializePatternTracking(userId);
    }
    
    const patterns = patternsDoc.data() as BehavioralPatterns;
    
    // Calculate insights
    const insights = analyzePatterns(patterns);
    
    return {
      ...patterns,
      insights
    } as UserPatternsWithInsights;
    
  } catch (error) {
    console.error('Error getting user patterns:', error);
    return null;
  }
}

/**
 * Analyze patterns to generate insights
 */
function analyzePatterns(patterns: BehavioralPatterns): PatternInsights {
  const insights: PatternInsights = {
    mostProductiveHour: null,
    mostProductiveDay: null,
    neglectedCategories: [],
    preferredTaskSize: 'medium',
    isOverwhelmed: false,
    suggestionsEffectiveness: 0
  };
  
  // Find most productive hour
  if (patterns.completionsByHour) {
    const hours = Object.entries(patterns.completionsByHour);
    if (hours.length > 0) {
      hours.sort((a, b) => b[1] - a[1]);
      insights.mostProductiveHour = parseInt(hours[0][0]);
    }
  }
  
  // Find most productive day
  if (patterns.completionsByDay) {
    const days = Object.entries(patterns.completionsByDay);
    if (days.length > 0) {
      days.sort((a, b) => b[1] - a[1]);
      insights.mostProductiveDay = parseInt(days[0][0]);
    }
  }
  
  // Find neglected categories (not used in 7+ days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  if (patterns.categoryLastUsed) {
    Object.entries(patterns.categoryLastUsed).forEach(([category, lastUsed]) => {
      if (!lastUsed || new Date((lastUsed as any).seconds * 1000) < sevenDaysAgo) {
        insights.neglectedCategories.push(category);
      }
    });
  }
  
  // Check if overwhelmed (emergency mode in last 3 days)
  if (patterns.overwhelmDays && patterns.overwhelmDays.length > 0) {
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const recentOverwhelm = patterns.overwhelmDays.some(day => 
      new Date(day) > threeDaysAgo
    );
    insights.isOverwhelmed = recentOverwhelm;
  }
  
  // Calculate suggestion effectiveness
  const accepted = patterns.suggestionsAccepted || 0;
  const dismissed = patterns.suggestionsDismissed || 0;
  const total = accepted + dismissed;
  if (total > 0) {
    insights.suggestionsEffectiveness = (accepted / total) * 100;
  }
  
  return insights;
}

/**
 * Get count of tasks completed today
 */
async function getTodayCompletions(userId: UserId): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    // Store daily completions in the behavioral patterns doc instead
    const patternsRef = doc(db, 'users', userId, 'patterns', 'behavioral');
    const patternsDoc = await getDoc(patternsRef);
    
    if (patternsDoc.exists()) {
      const data = patternsDoc.data();
      // Get today's completion count from the completions by hour
      const todayHours = new Date().getHours();
      let totalToday = 0;
      
      // Sum up all completions for today (rough estimate based on hours)
      for (let h = 0; h <= todayHours; h++) {
        totalToday += data?.completionsByHour?.[h.toString()] || 0;
      }
      
      return totalToday;
    }
    return 0;
    
  } catch (error) {
    console.error('Error getting today completions:', error);
    return 0;
  }
}

/**
 * Update user's preferred check-in time based on interaction
 */
export async function updatePreferredCheckInTime(userId: UserId): Promise<void> {
  try {
    const hour = new Date().getHours();
    const patternsRef = doc(db, 'users', userId, 'patterns', 'behavioral');
    
    await updateDoc(patternsRef, {
      preferredCheckInTime: hour,
      checkInsCompleted: increment(1),
      lastCheckIn: serverTimestamp()
    });
    
  } catch (error) {
    console.error('Error updating check-in time:', error);
  }
}

/**
 * Get smart context for AI suggestions
 */
export async function getAIContext(userId: UserId): Promise<AIContext> {
  const patterns = await getUserPatterns(userId);
  
  if (!patterns) {
    return {
      isNewUser: true,
      hasPatterns: false
    };
  }
  
  const context: AIContext = {
    isNewUser: false,
    hasPatterns: true,
    
    // User state
    isOverwhelmed: patterns.insights.isOverwhelmed,
    isProductive: patterns.insights.mostProductiveHour === new Date().getHours(),
    
    // Categories needing attention
    neglectedCategories: patterns.insights.neglectedCategories,
    favoriteCategories: Object.entries(patterns.completionsByCategory || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat),
    
    // Timing
    currentHour: new Date().getHours(),
    mostProductiveHour: patterns.insights.mostProductiveHour,
    dayOfWeek: new Date().getDay(),
    mostProductiveDay: patterns.insights.mostProductiveDay,
    
    // Preferences
    preferredTaskSize: patterns.preferredTaskDuration,
    acceptanceRate: patterns.insights.suggestionsEffectiveness,
    
    // Activity
    lastActive: patterns.lastActiveDate,
    streakDays: patterns.streakDays || 0,
    todayCompletions: await getTodayCompletions(userId)
  };
  
  return context;
}

const PatternTracking = {
  initializePatternTracking,
  trackTaskCompletion,
  trackSuggestionResponse,
  trackEmergencyMode,
  getUserPatterns,
  updatePreferredCheckInTime,
  getAIContext
};

export default PatternTracking;