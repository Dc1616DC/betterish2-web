/**
 * Basic Pattern Tracking System
 * Tracks user behavior patterns to improve task suggestions
 */

/**
 * Get AI context for a user (basic implementation)
 * Returns mock data until full analytics system is implemented
 */
export async function getAIContext(userId) {
  try {
    // For now, return a basic context object
    // This prevents the Firebase error and allows the system to work
    return {
      neglectedCategories: [],
      favoriteCategories: ['household', 'personal'],
      isOverwhelmed: false,
      isProductive: true,
      currentHour: new Date().getHours(),
      mostProductiveHour: 10,
      todayCompletions: 2,
      patterns: {
        completionTimes: {},
        preferredDifficulty: 'medium',
        weeklyGoals: 5
      }
    };
  } catch (error) {
    console.error('Pattern tracking error:', error);
    // Return safe fallback
    return {
      neglectedCategories: [],
      favoriteCategories: [],
      isOverwhelmed: false,
      isProductive: false,
      currentHour: new Date().getHours(),
      mostProductiveHour: 10,
      todayCompletions: 0
    };
  }
}

/**
 * Track task completion for future pattern analysis
 */
export async function trackTaskCompletion(userId, task) {
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      return; // Skip tracking on server-side
    }
    
    // For now, just store in localStorage for basic tracking
    const completions = JSON.parse(localStorage.getItem('taskCompletions') || '[]');
    completions.push({
      userId,
      task: task.title,
      category: task.category,
      completedAt: new Date().toISOString(),
      difficulty: task.priority,
      timeEstimate: task.timeEstimate
    });
    
    // Keep only last 100 completions
    if (completions.length > 100) {
      completions.shift();
    }
    
    localStorage.setItem('taskCompletions', JSON.stringify(completions));
  } catch (error) {
    console.error('Error tracking task completion:', error);
  }
}

/**
 * Get user completion patterns from stored data
 */
export function getUserPatterns(userId) {
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      return {
        favoriteCategories: [],
        neglectedCategories: [],
        totalCompletions: 0,
        recentActivity: []
      };
    }
    
    const completions = JSON.parse(localStorage.getItem('taskCompletions') || '[]');
    const userCompletions = completions.filter(c => c.userId === userId);
    
    // Analyze patterns
    const categoryCount = {};
    userCompletions.forEach(completion => {
      categoryCount[completion.category] = (categoryCount[completion.category] || 0) + 1;
    });
    
    const favoriteCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
    
    const allCategories = ['household', 'personal', 'relationships', 'projects', 'kids', 'maintenance'];
    const neglectedCategories = allCategories.filter(cat => !favoriteCategories.includes(cat));
    
    return {
      favoriteCategories,
      neglectedCategories,
      totalCompletions: userCompletions.length,
      recentActivity: userCompletions.slice(-10)
    };
  } catch (error) {
    console.error('Error getting user patterns:', error);
    return {
      favoriteCategories: [],
      neglectedCategories: [],
      totalCompletions: 0,
      recentActivity: []
    };
  }
}

export default {
  getAIContext,
  trackTaskCompletion,
  getUserPatterns
};