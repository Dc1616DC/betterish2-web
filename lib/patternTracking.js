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
  increment
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Initialize pattern tracking for a new user
 */
export async function initializePatternTracking(userId) {
  const patternsRef = doc(db, 'users', userId, 'patterns', 'behavioral');
  
  const initialPatterns = {
    initialized: true,
    createdAt: serverTimestamp(),
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
  return initialPatterns;
}

/**
 * Track when a task is completed
 */
export async function trackTaskCompletion(userId, task) {
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
    const updates = {
      [`categoryLastUsed.${category}`]: serverTimestamp(),
      [`completionsByHour.${hour}`]: increment(1),
      [`completionsByDay.${dayOfWeek}`]: increment(1),
      [`completionsByCategory.${category}`]: increment(1),
      lastActiveDate: serverTimestamp(),
      totalTasksCompleted: increment(1)
    };
    
    // Track task duration preference
    if (task.duration) {
      const duration = task.duration < 15 ? 'short' : 
                      task.duration < 30 ? 'medium' : 'long';
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
export async function trackSuggestionResponse(userId, suggestion, accepted) {
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
export async function trackEmergencyMode(userId) {
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
export async function getUserPatterns(userId) {
  try {
    const patternsRef = doc(db, 'users', userId, 'patterns', 'behavioral');
    const patternsDoc = await getDoc(patternsRef);
    
    if (!patternsDoc.exists()) {
      return await initializePatternTracking(userId);
    }
    
    const patterns = patternsDoc.data();
    
    // Calculate insights
    const insights = analyzePatterns(patterns);
    
    return {
      ...patterns,
      insights
    };
    
  } catch (error) {
    console.error('Error getting user patterns:', error);
    return null;
  }
}

/**
 * Analyze patterns to generate insights
 */
function analyzePatterns(patterns) {
  const insights = {
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
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  
  if (patterns.categoryLastUsed) {
    Object.entries(patterns.categoryLastUsed).forEach(([category, lastUsed]) => {
      if (!lastUsed || new Date(lastUsed.seconds * 1000) < sevenDaysAgo) {
        insights.neglectedCategories.push(category);
      }
    });
  }
  
  // Check if overwhelmed (emergency mode in last 3 days)
  if (patterns.overwhelmDays && patterns.overwhelmDays.length > 0) {
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
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
async function getTodayCompletions(userId) {
  try {
    const patternsRef = doc(db, 'users', userId, 'patterns', 'daily');
    const today = new Date().toISOString().split('T')[0];
    const dailyDoc = await getDoc(doc(patternsRef, today));
    
    if (dailyDoc.exists()) {
      return dailyDoc.data().completions || 0;
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
export async function updatePreferredCheckInTime(userId) {
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
export async function getAIContext(userId) {
  const patterns = await getUserPatterns(userId);
  
  if (!patterns) {
    return {
      isNewUser: true,
      hasPatterns: false
    };
  }
  
  const context = {
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

export default {
  initializePatternTracking,
  trackTaskCompletion,
  trackSuggestionResponse,
  trackEmergencyMode,
  getUserPatterns,
  updatePreferredCheckInTime,
  getAIContext
};