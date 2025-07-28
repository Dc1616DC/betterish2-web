// Smart daily task suggestions based on user patterns
import { coreAutoTasks } from '@/constants/tasks';

export class SmartSuggestionEngine {
  constructor(userHistory, userPreferences) {
    this.history = userHistory || [];
    this.preferences = userPreferences || {};
    this.today = new Date();
  }

  // Main function to get 3 smart suggestions
  getDailySuggestions() {
    const suggestions = [];
    
    // 1. Quick Win (Morning Momentum) - always include one easy task
    suggestions.push(this.getQuickWin());
    
    // 2. Neglected Category - focus on what's been ignored
    const neglected = this.getNeglectedCategoryTask();
    if (neglected) suggestions.push(neglected);
    
    // 3. Time/Context Aware - based on time of day or patterns
    const contextual = this.getContextualTask();
    if (contextual) suggestions.push(contextual);
    
    // Fill remaining slots if needed
    while (suggestions.length < 3) {
      const random = this.getRandomBalancedTask(suggestions);
      if (random) suggestions.push(random);
    }
    
    return suggestions.slice(0, 3);
  }

  // Get a quick 2-minute task for confidence building
  getQuickWin() {
    const quickTasks = coreAutoTasks.filter(task => 
      task.simplicity === 'low' && 
      !this.wasRecentlyCompleted(task)
    );
    
    // Prefer relationship tasks for quick wins (emotional boost)
    const relationshipQuick = quickTasks.filter(t => t.category === 'relationship');
    if (relationshipQuick.length > 0) {
      return this.addReasonToTask(
        this.randomFromArray(relationshipQuick),
        '⚡ Quick win to start your day strong'
      );
    }
    
    return this.addReasonToTask(
      this.randomFromArray(quickTasks),
      '⚡ Easy task to build momentum'
    );
  }

  // Find most neglected category and suggest from it
  getNeglectedCategoryTask() {
    const categoryStats = this.getCategoryStats();
    const mostNeglected = categoryStats
      .sort((a, b) => b.daysSinceLastCompletion - a.daysSinceLastCompletion)[0];
    
    if (mostNeglected && mostNeglected.daysSinceLastCompletion > 2) {
      const categoryTasks = coreAutoTasks.filter(t => 
        t.category === mostNeglected.category &&
        !this.wasRecentlyCompleted(t)
      );
      
      if (categoryTasks.length > 0) {
        return this.addReasonToTask(
          this.randomFromArray(categoryTasks),
          `🎯 ${mostNeglected.category} needs attention (${mostNeglected.daysSinceLastCompletion} days)`
        );
      }
    }
    
    return null;
  }

  // Get task based on time of day, day of week, or patterns
  getContextualTask() {
    const hour = this.today.getHours();
    const dayOfWeek = this.today.getDay(); // 0 = Sunday
    
    // Morning tasks (before 9am)
    if (hour < 9) {
      const morningTasks = [
        { title: 'Prep her morning coffee', detail: 'Start her day right', category: 'relationship', simplicity: 'low' },
        { title: 'Set up coffee for morning', detail: 'Future you thanks you', category: 'household', simplicity: 'low' },
        { title: 'Pack daycare bag', detail: 'Before the rush', category: 'baby', simplicity: 'medium' }
      ];
      
      return this.addReasonToTask(
        this.randomFromArray(morningTasks),
        '🌅 Perfect morning task'
      );
    }
    
    // Evening tasks (after 7pm)
    if (hour >= 19) {
      const eveningTasks = [
        { title: 'Prep tomorrow\'s bottles', detail: 'Save morning time', category: 'baby', simplicity: 'medium' },
        { title: 'Kitchen reset', detail: 'Clean slate for tomorrow', category: 'household', simplicity: 'medium' },
        { title: 'Give her 30min break', detail: 'Take over bedtime', category: 'relationship', simplicity: 'medium' }
      ];
      
      return this.addReasonToTask(
        this.randomFromArray(eveningTasks),
        '🌙 Great evening task'
      );
    }
    
    // Weekend tasks (Saturday/Sunday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const weekendTasks = coreAutoTasks.filter(t => 
        t.simplicity === 'high' || // Bigger tasks for weekend
        t.title.includes('Plan') || t.title.includes('Schedule')
      );
      
      if (weekendTasks.length > 0) {
        return this.addReasonToTask(
          this.randomFromArray(weekendTasks),
          '🏡 Perfect weekend project'
        );
      }
    }
    
    // Friday prep
    if (dayOfWeek === 5) {
      const fridayTasks = [
        { title: 'Plan weekend activities', detail: 'Set up family fun', category: 'relationship', simplicity: 'medium' },
        { title: 'Prep for busy weekend', detail: 'Get ahead of the game', category: 'household', simplicity: 'medium' }
      ];
      
      return this.addReasonToTask(
        this.randomFromArray(fridayTasks),
        '🎉 Friday prep task'
      );
    }
    
    return null;
  }

  // Get category completion statistics
  getCategoryStats() {
    const categories = ['relationship', 'baby', 'household'];
    
    return categories.map(category => {
      const categoryTasks = this.history.filter(task => 
        task.category === category && task.completedAt
      );
      
      const lastCompleted = categoryTasks.length > 0 
        ? Math.max(...categoryTasks.map(t => new Date(t.completedAt).getTime()))
        : 0;
      
      const daysSinceLastCompletion = lastCompleted > 0 
        ? Math.floor((Date.now() - lastCompleted) / (1000 * 60 * 60 * 24))
        : 7; // Assume 7 days if never completed
      
      return {
        category,
        totalCompleted: categoryTasks.length,
        daysSinceLastCompletion
      };
    });
  }

  // Check if task was recently completed (last 3 days)
  wasRecentlyCompleted(task) {
    const recentTasks = this.history.filter(t => {
      const completedDate = t.completedAt ? new Date(t.completedAt) : null;
      if (!completedDate) return false;
      
      const daysSince = (Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 3 && t.title === task.title;
    });
    
    return recentTasks.length > 0;
  }

  // Get random task ensuring category balance
  getRandomBalancedTask(existingSuggestions) {
    const existingCategories = existingSuggestions.map(s => s.category);
    const availableCategories = ['relationship', 'baby', 'household']
      .filter(cat => !existingCategories.includes(cat));
    
    if (availableCategories.length === 0) {
      // All categories represented, pick any
      const available = coreAutoTasks.filter(t => 
        !this.wasRecentlyCompleted(t) &&
        !existingSuggestions.some(s => s.title === t.title)
      );
      return available.length > 0 ? this.randomFromArray(available) : null;
    }
    
    // Pick from underrepresented category
    const targetCategory = this.randomFromArray(availableCategories);
    const categoryTasks = coreAutoTasks.filter(t => 
      t.category === targetCategory &&
      !this.wasRecentlyCompleted(t) &&
      !existingSuggestions.some(s => s.title === t.title)
    );
    
    return categoryTasks.length > 0 ? this.randomFromArray(categoryTasks) : null;
  }

  // Add reasoning to task for user understanding
  addReasonToTask(task, reason) {
    if (!task) return null;
    
    return {
      ...task,
      reason,
      // Remove template ID to avoid conflicts
      id: undefined
    };
  }

  // Utility: random item from array
  randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

// Export convenience function
export function getSmartDailySuggestions(userHistory, userPreferences) {
  const engine = new SmartSuggestionEngine(userHistory, userPreferences);
  return engine.getDailySuggestions();
}