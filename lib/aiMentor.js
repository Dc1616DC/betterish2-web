/**
 * AI Dad Mentor System
 * The brain of the app - provides contextual, empathetic guidance
 * Based on user patterns, seasonal needs, and current situation
 */

import { getCurrentSeasonalTasks, getEssentialTasks } from './seasonalTasks';
import { getAIContext } from './patternTracking';

/**
 * Core AI Mentor class
 */
export class DadMentor {
  constructor() {
    this.personality = {
      tone: 'tired-dad-friend', // Empathetic, been-there-done-that
      humor: 'gentle', // Light humor without being flippant
      directness: 'high', // No corporate speak, just practical help
      empathy: 'high' // Acknowledges the struggle
    };
  }

  /**
   * Morning Check-In - the main AI interaction
   */
  async morningCheckIn(userId, userTasks = [], currentHour = new Date().getHours()) {
    const context = await getAIContext(userId);
    const seasonal = getCurrentSeasonalTasks();
    const essentials = getEssentialTasks();

    // Determine user's current state
    const state = this.analyzeUserState(context, userTasks);
    
    switch (state.type) {
      case 'overwhelmed':
        return this.overwhelmedResponse(context, userTasks);
      
      case 'has_tasks':
        return this.supportiveResponse(context, userTasks);
      
      case 'needs_suggestions':
        return this.suggestiveResponse(context, seasonal, essentials);
      
      case 'productive_mood':
        return this.opportunityResponse(context, seasonal, essentials);
      
      default:
        return this.defaultResponse(context);
    }
  }

  /**
   * Analyze user's current state based on patterns and tasks
   */
  analyzeUserState(context, userTasks) {
    // Check for overwhelm signals
    if (context.isOverwhelmed || userTasks.length > 8) {
      return { type: 'overwhelmed', confidence: 0.9 };
    }

    // User has tasks planned
    if (userTasks.length >= 3) {
      return { type: 'has_tasks', confidence: 0.8 };
    }

    // Check if it's a productive time
    const isProductiveTime = context.currentHour === context.mostProductiveHour;
    const hasEnergy = !context.isOverwhelmed && context.todayCompletions < 5;
    
    if (isProductiveTime && hasEnergy) {
      return { type: 'productive_mood', confidence: 0.7 };
    }

    // Default to needing suggestions
    if (userTasks.length <= 2) {
      return { type: 'needs_suggestions', confidence: 0.6 };
    }

    return { type: 'default', confidence: 0.5 };
  }

  /**
   * Response for overwhelmed users
   */
  overwhelmedResponse(context, userTasks) {
    const messages = [
      "Yeah... one of those days. No judgment here. Let's just focus on survival.",
      "Everything feeling like too much? Been there. Kids fed and everyone alive counts as a win.",
      "Rough morning already? Same. Let's keep it stupid simple today.",
      "That look on your face when you realize it's only Tuesday... I see you."
    ];

    return {
      message: this.randomChoice(messages),
      type: 'overwhelmed', 
      suggestions: [],
      actions: [
        { type: 'emergency_mode', label: 'Just survival mode' },
        { type: 'one_critical', label: 'One thing. That\'s it.' },
        { type: 'defer_all', label: 'Tomorrow\'s problem' }
      ]
    };
  }

  /**
   * Response when user has tasks planned
   */
  supportiveResponse(context, userTasks) {
    const messages = [
      "Not bad, you actually planned ahead. Anything here making you go 'ugh'?",
      "Look at you, being all organized. Which one's gonna be the pain?",
      "Decent list. Want me to break down the ones that sound impossible?",
      "You're ahead of the game today. Need backup on the tricky stuff?"
    ];

    // Check for complex tasks that might need breakdown
    const complexTasks = userTasks.filter(task => 
      task.title.length > 50 || 
      task.title.toLowerCase().includes('project') ||
      task.title.toLowerCase().includes('organize') ||
      task.title.toLowerCase().includes('plan')
    );

    const actions = [
      { type: 'review_list', label: 'I got this' }
    ];

    if (complexTasks.length > 0) {
      actions.push({ type: 'break_down', label: 'Yeah, break these down' });
    }

    actions.push({ type: 'add_reminders', label: 'Remind me later' });

    return {
      message: this.randomChoice(messages),
      type: 'supportive',
      suggestions: [],
      actions
    };
  }

  /**
   * Response with smart suggestions
   */
  suggestiveResponse(context, seasonal, essentials) {
    const suggestions = this.generateSmartSuggestions(context, seasonal, essentials);
    
    let message = "What might help today?";
    
    if (context.neglectedCategories.length > 0) {
      const neglected = context.neglectedCategories[0].replace('_', ' ').replace('home_projects', 'house stuff');
      message = `Notice you haven't done ${neglected} stuff in a bit. Also, ${seasonal[0]?.title || 'some seasonal things'} coming up. Sound familiar?`;
    } else if (seasonal.length > 0 && seasonal[0].priority === 'time-sensitive') {
      message = `Quick heads up: ${seasonal[0].title} is kinda time-sensitive. Might be worth tackling before it becomes a Thing.`;
    }

    return {
      message,
      type: 'suggestive',
      suggestions,
      actions: [
        { type: 'add_suggestion', label: 'Yeah, add these' },
        { type: 'seasonal_only', label: 'Just the urgent stuff' },
        { type: 'skip_suggestions', label: 'Nah, I\'m good' }
      ]
    };
  }

  /**
   * Response for productive moments
   */
  opportunityResponse(context, seasonal, essentials) {
    const messages = [
      "You usually get stuff done around now. Coffee finally kicking in?",
      "This is when you typically knock things out. Feeling it today?",
      "Your productive window's open. Want to tackle something while the energy lasts?",
      "Based on your patterns, this might be a good time to get ahead of things."
    ];

    const suggestions = this.generateSmartSuggestions(context, seasonal, essentials, true);

    return {
      message: this.randomChoice(messages),
      type: 'opportunity',
      suggestions,
      actions: [
        { type: 'power_hour', label: 'Hit me with a few things' },
        { type: 'one_big_thing', label: 'One meaningful task' },
        { type: 'catch_up', label: 'Catch up on what I\'ve been avoiding' }
      ]
    };
  }

  /**
   * Default response
   */
  defaultResponse(context) {
    const messages = [
      "How's it going so far?",
      "What's the vibe today?",
      "Checking in. How are we doing?",
      "Morning. What's on your mind?"
    ];

    return {
      message: this.randomChoice(messages),
      type: 'default',
      suggestions: [],
      actions: [
        { type: 'check_seasonal', label: 'What seasonal stuff is coming up?' },
        { type: 'quick_wins', label: 'Give me some easy wins' },
        { type: 'skip_checkin', label: 'I\'m good, thanks' }
      ]
    };
  }

  /**
   * Generate smart suggestions based on context
   */
  generateSmartSuggestions(context, seasonal, essentials, isProductiveTime = false) {
    const suggestions = [];
    
    // Priority 1: Time-sensitive seasonal tasks
    const urgentSeasonal = seasonal.filter(t => 
      t.priority === 'time-sensitive' || t.priority === 'deadline'
    );
    suggestions.push(...urgentSeasonal.slice(0, 1));

    // Priority 2: Neglected essentials (relationship savers)
    if (context.neglectedCategories.includes('relationship')) {
      const relationshipEssentials = essentials.daily.filter(t => t.category === 'relationship');
      suggestions.push(...relationshipEssentials.slice(0, 1));
    }

    // Priority 3: Other neglected categories
    context.neglectedCategories.slice(0, 2).forEach(category => {
      const categoryTasks = essentials.daily.filter(t => t.category === category);
      if (categoryTasks.length > 0) {
        suggestions.push(categoryTasks[0]);
      }
    });

    // If productive time, add more options
    if (isProductiveTime) {
      suggestions.push(...seasonal.slice(0, 2));
      suggestions.push(...essentials.weekly.slice(0, 1));
    }

    // Limit to 5 suggestions max
    return suggestions.slice(0, 5);
  }

  /**
   * Break down a complex task into steps
   */
  async breakDownTask(taskTitle) {
    // This would ideally call OpenAI/Grok API for dynamic breakdown
    // For now, using rule-based approach
    
    const breakdowns = {
      'clean garage': {
        thisWeekend: [
          { title: 'Clear one wall (just one!)', time: '30 min' },
          { title: 'Make three piles: trash, donate, keep', time: '20 min' },
          { title: 'Take photos of sellable stuff', time: '10 min' }
        ],
        nextWeekend: [
          { title: 'List the good stuff online', time: '15 min' },
          { title: 'Schedule donation pickup (or just drive it over)', time: '5 min' },
          { title: 'Install those hooks you bought 6 months ago', time: '45 min' }
        ],
        futureWeekends: [
          { title: 'Put everything in its spot', time: '30 min' },
          { title: 'Sweep up and grab a beer', time: '10 min' }
        ]
      },
      'organize office': {
        today: [
          { title: 'Clear the desk (throw everything in a box if needed)', time: '10 min' },
          { title: 'Three piles: important, maybe, definitely trash', time: '15 min' }
        ],
        thisWeek: [
          { title: 'Buy a simple filing thing (or use a shoebox)', time: '20 min' },
          { title: 'Deal with the cable chaos somehow', time: '15 min' }
        ]
      }
    };

    // Simple matching for common tasks
    const lowerTask = taskTitle.toLowerCase();
    for (const [key, breakdown] of Object.entries(breakdowns)) {
      if (lowerTask.includes(key)) {
        return breakdown;
      }
    }

    // Default breakdown for unrecognized tasks
    return {
      suggestion: `"${taskTitle}" sounds like one of those tasks that keeps getting put off. Want to break it down?`,
      steps: [
        { title: 'Figure out what "done" actually means', time: '5 min' },
        { title: 'List the steps (probably more than you think)', time: '10 min' },
        { title: 'Do just the first step. That\'s it.', time: '15 min' }
      ]
    };
  }

  /**
   * Get contextual help for a task
   */
  getTaskHelp(taskTitle) {
    const helpDatabase = {
      'change hvac filter': {
        steps: ['Turn off system (important!)', 'Find the filter (usually behind a panel)', 'Take a photo of the old one (trust me on this)', 'New filter arrow points toward the unit', 'Turn system back on'],
        tips: 'Most common mistake: buying the wrong size. That photo saves you a second trip to Home Depot.',
        timeEstimate: '5 minutes',
        difficulty: 'Dad-level easy'
      },
      'test sump pump': {
        steps: ['Pour a bucket of water into the pit', 'Pump should kick on automatically', 'Water drains fast = good', 'Weird noises = not good'],
        tips: 'Do this before spring rains hit. If it doesn\'t work, call someone TODAY. Flooded basements suck.',
        timeEstimate: '2 minutes',
        difficulty: 'Super easy'
      }
    };

    const lowerTask = taskTitle.toLowerCase();
    for (const [key, help] of Object.entries(helpDatabase)) {
      if (lowerTask.includes(key.split(' ')[0])) {
        return help;
      }
    }

    return null;
  }

  /**
   * Utility: Random choice from array
   */
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

/**
 * Factory function to create AI mentor instance
 */
export function createDadMentor() {
  return new DadMentor();
}

export default DadMentor;