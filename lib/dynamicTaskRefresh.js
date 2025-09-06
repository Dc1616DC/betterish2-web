/**
 * Dynamic Task Refresh System
 * Keeps suggestions relevant by updating based on:
 * - Time changes (hourly, daily, seasonal)
 * - Task completion patterns
 * - Context shifts (weekday/weekend, energy levels)
 * - External triggers (weather, calendar events)
 */

import { getAIContext } from './patternTracking';
import { generatePersonalizedTasks } from './contextualTasks';

/**
 * Main orchestrator for dynamic task updates
 */
export class DynamicTaskRefresh {
  constructor() {
    this.refreshIntervals = new Map(); // Track active refresh intervals
    this.lastRefreshTimes = new Map(); // Track last refresh per user/category
    this.contextCache = new Map(); // Cache context to detect changes
  }

  /**
   * Initialize dynamic refresh for a user session
   */
  initializeForUser(userId, callbacks = {}) {
    const refreshConfig = {
      // Callback functions for different update types
      onTimeBasedRefresh: callbacks.onTimeBasedRefresh || (() => {}),
      onTaskCompletionRefresh: callbacks.onTaskCompletionRefresh || (() => {}),
      onContextChangeRefresh: callbacks.onContextChangeRefresh || (() => {}),
      onPatternLearningRefresh: callbacks.onPatternLearningRefresh || (() => {}),
    };

    // Set up time-based refresh intervals
    this.setupTimeBasedRefresh(userId, refreshConfig);
    
    // Set up context monitoring
    this.setupContextMonitoring(userId, refreshConfig);
    
    return {
      refreshNow: (category) => this.forceRefresh(userId, category, refreshConfig),
      onTaskCompleted: (task) => this.handleTaskCompletion(userId, task, refreshConfig),
      cleanup: () => this.cleanup(userId)
    };
  }

  /**
   * Set up automatic time-based refreshes
   */
  setupTimeBasedRefresh(userId, callbacks) {
    // Hourly context check (energy levels, time-of-day tasks)
    const hourlyInterval = setInterval(async () => {
      await this.checkForContextChanges(userId, 'hourly', callbacks);
    }, 60 * 60 * 1000); // Every hour

    // Daily refresh (new day, different priorities)
    const dailyInterval = setInterval(async () => {
      await this.triggerDailyRefresh(userId, callbacks);
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    // Weekend/weekday transition refresh
    const transitionInterval = setInterval(async () => {
      await this.checkForWeekdayTransition(userId, callbacks);
    }, 6 * 60 * 60 * 1000); // Every 6 hours

    this.refreshIntervals.set(userId, {
      hourly: hourlyInterval,
      daily: dailyInterval,
      transition: transitionInterval
    });
  }

  /**
   * Set up context monitoring for immediate updates
   */
  setupContextMonitoring(userId, callbacks) {
    // Initialize context cache
    this.updateContextCache(userId);

    // Set up periodic context comparison
    const contextInterval = setInterval(async () => {
      await this.detectContextChanges(userId, callbacks);
    }, 5 * 60 * 1000); // Every 5 minutes

    const intervals = this.refreshIntervals.get(userId) || {};
    intervals.context = contextInterval;
    this.refreshIntervals.set(userId, intervals);
  }

  /**
   * Check for significant context changes
   */
  async detectContextChanges(userId, callbacks) {
    const currentContext = await this.getCurrentContext(userId);
    const cachedContext = this.contextCache.get(userId);

    if (!cachedContext) {
      this.contextCache.set(userId, currentContext);
      return;
    }

    const significantChanges = this.identifySignificantChanges(cachedContext, currentContext);
    
    if (significantChanges.length > 0) {
      console.log(`Context changes detected for ${userId}:`, significantChanges);
      
      // Update cache
      this.contextCache.set(userId, currentContext);
      
      // Trigger appropriate refreshes
      for (const change of significantChanges) {
        await this.handleContextChange(userId, change, callbacks);
      }
    }
  }

  /**
   * Identify what changed significantly in user context
   */
  identifySignificantChanges(oldContext, newContext) {
    const changes = [];

    // Energy level changes
    if (oldContext.energyLevel !== newContext.energyLevel) {
      changes.push({
        type: 'energy_level',
        from: oldContext.energyLevel,
        to: newContext.energyLevel,
        categories: ['quick-wins', 'projects', 'personal']
      });
    }

    // Time of day transitions
    if (oldContext.timeOfDay !== newContext.timeOfDay) {
      changes.push({
        type: 'time_of_day',
        from: oldContext.timeOfDay,
        to: newContext.timeOfDay,
        categories: ['household', 'kids', 'relationships']
      });
    }

    // Weekend/weekday transitions
    if (oldContext.isWeekend !== newContext.isWeekend) {
      changes.push({
        type: 'weekend_transition',
        to: newContext.isWeekend ? 'weekend' : 'weekday',
        categories: ['projects', 'household', 'relationships', 'personal']
      });
    }

    // Overwhelm state changes
    if (oldContext.isOverwhelmed !== newContext.isOverwhelmed) {
      changes.push({
        type: 'overwhelm_state',
        to: newContext.isOverwhelmed ? 'overwhelmed' : 'recovered',
        categories: ['all'] // Affects all categories
      });
    }

    // Productive time detection
    if (!oldContext.isProductive && newContext.isProductive) {
      changes.push({
        type: 'productive_window',
        to: 'productive',
        categories: ['projects', 'prevention', 'personal']
      });
    }

    return changes;
  }

  /**
   * Handle specific context changes
   */
  async handleContextChange(userId, change, callbacks) {
    const affectedCategories = change.categories.includes('all') 
      ? ['seasonal', 'quick-wins', 'personal', 'household', 'kids', 'relationships', 'projects', 'prevention']
      : change.categories;

    for (const category of affectedCategories) {
      const refreshData = await this.generateRefreshedTasks(userId, category, change);
      
      if (refreshData.hasChanges) {
        callbacks.onContextChangeRefresh({
          userId,
          category,
          changeType: change.type,
          newTasks: refreshData.tasks,
          reason: this.getChangeReason(change)
        });
      }
    }
  }

  /**
   * Generate refreshed tasks for a category
   */
  async generateRefreshedTasks(userId, category, contextChange = null) {
    try {
      // Get current user profile
      const userProfile = this.getUserProfile(userId);
      
      // Generate new personalized tasks
      const newTasks = await generatePersonalizedTasks(
        userId,
        category,
        userProfile,
        [] // Empty current tasks to get fresh suggestions
      );

      // Compare with last suggestions to determine if refresh is needed
      const lastRefreshKey = `${userId}-${category}`;
      const lastTasks = this.lastRefreshTimes.get(lastRefreshKey)?.tasks || [];
      
      const hasChanges = this.tasksHaveChanged(lastTasks, newTasks);
      
      // Update cache
      this.lastRefreshTimes.set(lastRefreshKey, {
        timestamp: Date.now(),
        tasks: newTasks,
        contextChange
      });

      return {
        hasChanges,
        tasks: newTasks,
        previousTasks: lastTasks
      };
      
    } catch (error) {
      console.error('Error generating refreshed tasks:', error);
      return { hasChanges: false, tasks: [], previousTasks: [] };
    }
  }

  /**
   * Check if task lists have meaningfully changed
   */
  tasksHaveChanged(oldTasks, newTasks) {
    if (oldTasks.length !== newTasks.length) return true;
    
    // Compare top 5 tasks (most important ones)
    const oldTop5 = oldTasks.slice(0, 5).map(t => t.title);
    const newTop5 = newTasks.slice(0, 5).map(t => t.title);
    
    for (let i = 0; i < Math.min(oldTop5.length, newTop5.length); i++) {
      if (oldTop5[i] !== newTop5[i]) return true;
    }
    
    return false;
  }

  /**
   * Handle task completion and trigger relevant updates
   */
  async handleTaskCompletion(userId, completedTask, callbacks) {
    try {
      // Update pattern tracking
      await import('./patternTracking').then(module => 
        module.trackTaskCompletion(userId, completedTask)
      );

      // Identify categories that might need refresh
      const categoriesToRefresh = this.getCategoriesAffectedByCompletion(completedTask);
      
      // Generate replacement suggestions for affected categories
      for (const category of categoriesToRefresh) {
        const refreshData = await this.generateRefreshedTasks(userId, category, {
          type: 'task_completion',
          completedTask: completedTask.title,
          completedCategory: completedTask.category
        });

        if (refreshData.hasChanges) {
          callbacks.onTaskCompletionRefresh({
            userId,
            category,
            completedTask,
            newTasks: refreshData.tasks,
            reason: `Refreshed after completing "${completedTask.title}"`
          });
        }
      }

      // Check for achievement milestones that unlock new task types
      await this.checkForAchievementUnlocks(userId, completedTask, callbacks);
      
    } catch (error) {
      console.error('Error handling task completion refresh:', error);
    }
  }

  /**
   * Determine which categories need refresh after task completion
   */
  getCategoriesAffectedByCompletion(completedTask) {
    const category = completedTask.category;
    const affectedCategories = [category]; // Always refresh the same category
    
    // Cross-category effects
    if (category === 'relationship' && completedTask.title.includes('date')) {
      affectedCategories.push('personal'); // More self-care after relationship care
    }
    
    if (category === 'household' && completedTask.title.includes('organize')) {
      affectedCategories.push('projects'); // Might suggest more organizing projects
    }
    
    if (category === 'kids' && completedTask.title.includes('school')) {
      affectedCategories.push('personal'); // Parent self-care after kid focus
    }
    
    // Always refresh prevention category after maintenance tasks
    if (['household', 'maintenance', 'home_projects'].includes(category)) {
      affectedCategories.push('prevention');
    }
    
    return [...new Set(affectedCategories)]; // Remove duplicates
  }

  /**
   * Check for achievement unlocks that reveal new task types
   */
  async checkForAchievementUnlocks(userId, completedTask, callbacks) {
    try {
      const patterns = await getAIContext(userId);
      
      // Check for streaks that unlock advanced features
      if (patterns.streakDays === 7) {
        callbacks.onPatternLearningRefresh({
          userId,
          type: 'streak_unlock',
          achievement: 'week_streak',
          newFeatures: ['advanced_projects', 'habit_building'],
          message: '🔥 7-day streak! Unlocking project planning features'
        });
      }
      
      if (patterns.streakDays === 30) {
        callbacks.onPatternLearningRefresh({
          userId,
          type: 'streak_unlock',
          achievement: 'month_streak',
          newFeatures: ['seasonal_planning', 'goal_setting'],
          message: '🏆 30-day streak! You\'re ready for long-term planning'
        });
      }
      
      // Category mastery unlocks
      const categoryCompletions = patterns.completionsByCategory?.[completedTask.category] || 0;
      if (categoryCompletions === 10) {
        callbacks.onPatternLearningRefresh({
          userId,
          type: 'category_mastery',
          category: completedTask.category,
          newFeatures: ['advanced_' + completedTask.category],
          message: `💪 ${completedTask.category} expert! Unlocking advanced suggestions`
        });
      }
      
    } catch (error) {
      console.error('Error checking achievement unlocks:', error);
    }
  }

  /**
   * Force immediate refresh of a category
   */
  async forceRefresh(userId, category, callbacks) {
    const refreshData = await this.generateRefreshedTasks(userId, category, {
      type: 'manual_refresh'
    });
    
    callbacks.onTimeBasedRefresh({
      userId,
      category,
      newTasks: refreshData.tasks,
      reason: 'Manual refresh requested'
    });
    
    return refreshData.tasks;
  }

  /**
   * Trigger daily refresh for new day priorities
   */
  async triggerDailyRefresh(userId, callbacks) {
    const allCategories = ['seasonal', 'quick-wins', 'personal', 'household', 'kids', 'relationships', 'projects', 'prevention'];
    
    for (const category of allCategories) {
      const refreshData = await this.generateRefreshedTasks(userId, category, {
        type: 'daily_refresh',
        newDay: new Date().toISOString().split('T')[0]
      });
      
      if (refreshData.hasChanges) {
        callbacks.onTimeBasedRefresh({
          userId,
          category,
          newTasks: refreshData.tasks,
          reason: 'New day - fresh priorities'
        });
      }
    }
  }

  /**
   * Check for weekday/weekend transitions
   */
  async checkForWeekdayTransition(userId, callbacks) {
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const cachedContext = this.contextCache.get(userId);
    
    if (cachedContext && cachedContext.isWeekend !== isWeekend) {
      // Weekend transition detected
      const transitionType = isWeekend ? 'weekend_start' : 'weekday_start';
      
      const affectedCategories = ['projects', 'household', 'relationships', 'personal'];
      
      for (const category of affectedCategories) {
        const refreshData = await this.generateRefreshedTasks(userId, category, {
          type: 'weekend_transition',
          to: transitionType
        });
        
        if (refreshData.hasChanges) {
          callbacks.onContextChangeRefresh({
            userId,
            category,
            changeType: transitionType,
            newTasks: refreshData.tasks,
            reason: isWeekend ? 'Weekend mode: More projects and family time' : 'Weekday focus: Quick wins and essentials'
          });
        }
      }
      
      // Update context cache
      this.updateContextCache(userId);
    }
  }

  /**
   * Get current context for comparison
   */
  async getCurrentContext(userId) {
    try {
      const patterns = await getAIContext(userId);
      const now = new Date();
      
      return {
        hour: now.getHours(),
        dayOfWeek: now.getDay(),
        isWeekend: now.getDay() === 0 || now.getDay() === 6,
        timeOfDay: this.getTimeOfDay(now.getHours()),
        energyLevel: this.getEnergyLevel(now.getHours(), now.getDay() === 0 || now.getDay() === 6),
        isOverwhelmed: patterns?.isOverwhelmed || false,
        isProductive: patterns?.isProductive || false,
        neglectedCategories: patterns?.neglectedCategories || []
      };
    } catch (error) {
      console.error('Error getting current context:', error);
      return {};
    }
  }

  /**
   * Update context cache
   */
  async updateContextCache(userId) {
    const context = await this.getCurrentContext(userId);
    this.contextCache.set(userId, context);
  }

  /**
   * Get user profile from localStorage (client-side) or database (server-side)
   */
  getUserProfile(userId) {
    try {
      // Client-side
      if (typeof window !== 'undefined') {
        const profile = localStorage.getItem('userProfile');
        return profile ? JSON.parse(profile) : null;
      }
      
      // Server-side - would need database lookup
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Generate human-readable reason for changes
   */
  getChangeReason(change) {
    const reasons = {
      energy_level: `Energy level changed to ${change.to}`,
      time_of_day: `Time changed to ${change.to}`,
      weekend_transition: change.to === 'weekend' ? 'Weekend mode activated' : 'Back to weekday focus',
      overwhelm_state: change.to === 'overwhelmed' ? 'Simplified for overwhelm' : 'Full suggestions restored',
      productive_window: 'Productive time detected - showing bigger tasks'
    };
    
    return reasons[change.type] || `Context updated: ${change.type}`;
  }

  /**
   * Clean up intervals when user session ends
   */
  cleanup(userId) {
    const intervals = this.refreshIntervals.get(userId);
    if (intervals) {
      Object.values(intervals).forEach(interval => clearInterval(interval));
      this.refreshIntervals.delete(userId);
    }
    
    this.contextCache.delete(userId);
    
    // Clean up old refresh caches
    const keysToDelete = [];
    for (const key of this.lastRefreshTimes.keys()) {
      if (key.startsWith(userId + '-')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.lastRefreshTimes.delete(key));
  }

  /**
   * Helper: Get time of day label
   */
  getTimeOfDay(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Helper: Estimate energy level
   */
  getEnergyLevel(hour, isWeekend) {
    if (isWeekend && hour >= 9 && hour <= 11) return 'high';
    if (!isWeekend && hour >= 9 && hour <= 11) return 'medium';
    if (hour >= 14 && hour <= 16) return 'low'; // Post-lunch dip
    if (hour >= 19 && hour <= 21) return 'low'; // Evening wind-down
    if (hour >= 8 && hour <= 10) return 'high';
    return 'medium';
  }
}

// Create singleton instance
export const dynamicRefresh = new DynamicTaskRefresh();

/**
 * Convenience function for initializing dynamic refresh
 */
export function initializeDynamicRefresh(userId, callbacks) {
  return dynamicRefresh.initializeForUser(userId, callbacks);
}

export default dynamicRefresh;