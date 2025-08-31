/**
 * AI Configuration for Betterish Dad Mentor
 * Centralized config for AI behavior, prompts, and feature flags
 */

export const AI_CONFIG = {
  // Feature flags
  features: {
    aiCheckIn: true,
    patternTracking: true,
    taskBreakdown: true,
    smartSuggestions: true,
    emergencyModeTracking: true,
    seasonalTasks: true
  },

  // AI Personality settings
  personality: {
    tone: 'tired-dad-friend', // Options: professional, casual, tired-dad-friend
    humor: 'gentle', // Options: none, gentle, witty
    directness: 'high', // Options: low, medium, high
    empathy: 'high', // Options: low, medium, high
    encouragement: 'realistic' // Options: enthusiastic, realistic, minimal
  },

  // Pattern analysis thresholds
  patterns: {
    neglectedCategoryDays: 7, // Days before category is considered neglected
    overwhelmThreshold: 3, // Emergency mode activations in 3 days = overwhelmed
    productiveDayTaskCount: 5, // Tasks completed = productive day
    preferredTaskBatchSize: 3, // Ideal number of daily tasks
    suggestionAcceptanceThreshold: 0.6 // Minimum acceptance rate to keep suggesting
  },

  // Check-in behavior
  checkIn: {
    enableDaily: true,
    preferredHours: [7, 8, 9, 19, 20], // When to suggest check-ins
    maxSuggestionsPerCheckIn: 5,
    prioritizeTimesensitive: true,
    respectOverwhelm: true, // Don't suggest when overwhelmed
    learningPeriodDays: 7 // Days to learn user patterns before full AI kicks in
  },

  // Seasonal task priorities
  seasonal: {
    prioritizeTimeSensitive: true,
    alertDaysBefore: [7, 3, 1], // Alert 7 days, 3 days, 1 day before
    enableWeatherIntegration: false, // Future: weather-based suggestions
    enableLocationTasks: false // Future: location-based seasonal tasks
  },

  // Emergency mode settings
  emergencyMode: {
    maxTasks: 4, // Keep it minimal
    autoTriggerThreshold: 8, // If user has >8 tasks, suggest emergency mode
    cooldownHours: 6, // Hours before allowing another emergency mode
    trackPatterns: true // Learn when user typically gets overwhelmed
  },

  // Future AI integration settings
  aiProvider: {
    primary: 'openai', // Options: openai, anthropic, local
    fallbackEnabled: true,
    maxTokens: 500, // Keep responses concise
    temperature: 0.7, // Balance creativity with consistency
    systemPrompt: `You're texting a dad friend at 11 PM after the kids are finally asleep. Write like one dad to another who's barely keeping it together but still showing up. Honest, tired, funny, real.

    NEVER: Use corporate jargon, suggest unrealistic solutions ("just wake up at 4 AM!"), shame about screen time or convenience foods, pretend parenting is magical, or say "game-changer" unironically.
    
    ALWAYS: Acknowledge the chaos, celebrate tiny victories, use specific relatable examples, include humor about universal dad experiences, keep suggestions actually doable (under 10 minutes), remember that done is better than perfect.
    
    Voice: "Betterish" means progress over perfection. Pizza for dinner three nights happens. We don't shame, we don't preach. Sometimes "everyone's alive" counts as success.`
  },

  // Error handling
  gracefulDegradation: {
    enabled: true,
    fallbackToSeasonalTasks: true,
    fallbackToEmergencyMode: true,
    showErrorToUser: false, // Keep errors internal
    logErrors: true
  }
};

// Helper functions for configuration
export function getAIPersonality() {
  return AI_CONFIG.personality;
}

export function isFeatureEnabled(featureName) {
  return AI_CONFIG.features[featureName] ?? false;
}

export function getPatternThreshold(thresholdName) {
  return AI_CONFIG.patterns[thresholdName];
}

export function shouldShowCheckIn(currentHour) {
  return AI_CONFIG.checkIn.preferredHours.includes(currentHour);
}

// Environment-based overrides
export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV;
  
  if (env === 'development') {
    return {
      ...AI_CONFIG,
      // More verbose logging in development
      gracefulDegradation: {
        ...AI_CONFIG.gracefulDegradation,
        showErrorToUser: true,
        logErrors: true
      }
    };
  }
  
  return AI_CONFIG;
}

export default AI_CONFIG;