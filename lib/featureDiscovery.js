/**
 * Feature Discovery Tracking - Smart tracking of user feature usage
 * Helps customize onboarding experience based on what users have already discovered
 */

// Track when users discover or use features
export function trackFeatureDiscovery(featureName, context = {}) {
  if (typeof window === 'undefined') return;

  try {
    const discoveredFeatures = getDiscoveredFeatures();
    const timestamp = new Date().toISOString();
    
    // Add to discovered features if not already present
    if (!discoveredFeatures.some(f => f.name === featureName)) {
      discoveredFeatures.push({
        name: featureName,
        discoveredAt: timestamp,
        context
      });
      
      localStorage.setItem('discoveredFeatures', JSON.stringify(discoveredFeatures));
      
      // Track usage analytics (could be sent to analytics service)
      console.log(`Feature discovered: ${featureName}`, context);
    }
    
    // Update last used timestamp
    updateFeatureUsage(featureName, context);
  } catch (error) {
    console.error('Failed to track feature discovery:', error);
  }
}

// Track feature usage (when user actually uses a feature)
export function trackFeatureUsage(featureName, context = {}) {
  if (typeof window === 'undefined') return;

  try {
    trackFeatureDiscovery(featureName, context); // Ensure it's marked as discovered
    updateFeatureUsage(featureName, context);
  } catch (error) {
    console.error('Failed to track feature usage:', error);
  }
}

// Update the last used timestamp and usage count
function updateFeatureUsage(featureName, context) {
  const featureUsage = getFeatureUsage();
  const timestamp = new Date().toISOString();
  
  featureUsage[featureName] = {
    ...(featureUsage[featureName] || { usageCount: 0 }),
    lastUsed: timestamp,
    usageCount: (featureUsage[featureName]?.usageCount || 0) + 1,
    lastContext: context
  };
  
  localStorage.setItem('featureUsage', JSON.stringify(featureUsage));
}

// Get all discovered features
export function getDiscoveredFeatures() {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(localStorage.getItem('discoveredFeatures') || '[]');
  } catch {
    return [];
  }
}

// Get feature usage statistics
export function getFeatureUsage() {
  if (typeof window === 'undefined') return {};
  
  try {
    return JSON.parse(localStorage.getItem('featureUsage') || '{}');
  } catch {
    return {};
  }
}

// Check if user has discovered a specific feature
export function hasDiscoveredFeature(featureName) {
  const discoveredFeatures = getDiscoveredFeatures();
  return discoveredFeatures.some(f => f.name === featureName);
}

// Get user's onboarding progress
export function getOnboardingProgress() {
  const discoveredFeatures = getDiscoveredFeatures();
  const featureUsage = getFeatureUsage();
  
  const coreFeatures = [
    'task-creation',
    'ai-dad-mentor', 
    'voice-input',
    'project-breakdown',
    'step-help',
    'task-categories'
  ];
  
  const discoveredCore = coreFeatures.filter(feature => hasDiscoveredFeature(feature));
  const usedFeatures = Object.keys(featureUsage);
  
  return {
    discoveredFeatures: discoveredFeatures.length,
    discoveredCoreFeatures: discoveredCore.length,
    totalCoreFeatures: coreFeatures.length,
    usedFeatures: usedFeatures.length,
    coreProgress: discoveredCore.length / coreFeatures.length,
    recommendations: getFeatureRecommendations(discoveredCore, coreFeatures)
  };
}

// Get personalized feature recommendations
function getFeatureRecommendations(discoveredCore, coreFeatures) {
  const notDiscovered = coreFeatures.filter(feature => !discoveredCore.includes(feature));
  const recommendations = [];
  
  // Smart recommendations based on what they've already discovered
  if (!notDiscovered.length) {
    return ['You\'ve mastered the basics! 🎉'];
  }
  
  if (discoveredCore.includes('task-creation') && !discoveredCore.includes('voice-input')) {
    recommendations.push('Try voice input - it\'s much faster than typing!');
  }
  
  if (discoveredCore.includes('task-creation') && !discoveredCore.includes('ai-dad-mentor')) {
    recommendations.push('Ask your AI Dad Mentor for seasonal maintenance tips');
  }
  
  if (discoveredCore.includes('ai-dad-mentor') && !discoveredCore.includes('project-breakdown')) {
    recommendations.push('Break down complex projects into manageable steps');
  }
  
  if (discoveredCore.includes('project-breakdown') && !discoveredCore.includes('step-help')) {
    recommendations.push('Get step-specific help from your AI Dad Mentor');
  }
  
  // Default recommendations for completely new users
  if (!discoveredCore.length) {
    recommendations.push('Start by adding your first task');
    recommendations.push('Try the daily check-in with your AI Dad Mentor');
  }
  
  return recommendations.slice(0, 2); // Max 2 recommendations
}

// Clear all discovery tracking (for testing or user request)
export function clearFeatureTracking() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('discoveredFeatures');
  localStorage.removeItem('featureUsage');
  localStorage.removeItem('completedTutorials');
  localStorage.removeItem('dismissedOnboardingTips');
}

// Feature name constants for consistency
export const FEATURES = {
  TASK_CREATION: 'task-creation',
  AI_DAD_MENTOR: 'ai-dad-mentor',
  VOICE_INPUT: 'voice-input',
  PROJECT_BREAKDOWN: 'project-breakdown',
  STEP_HELP: 'step-help',
  TASK_CATEGORIES: 'task-categories',
  TASK_COMPLETION: 'task-completion',
  EMERGENCY_MODE: 'emergency-mode',
  WALKTHROUGH: 'app-walkthrough',
  TUTORIALS: 'feature-tutorials'
};