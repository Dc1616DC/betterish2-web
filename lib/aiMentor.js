/**
 * Morpheus Mentor System
 * The brain of the app - provides contextual, empathetic guidance
 * Based on user patterns, seasonal needs, and current situation
 */

import { getCurrentSeasonalTasks, getEssentialTasks } from './seasonalTasks';
import { getAIContext } from './patternTracking';

/**
 * Core Morpheus class
 */
export class Morpheus {
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
    let context = null;
    try {
      context = await getAIContext(userId);
    } catch (error) {
      console.error('Error getting user patterns:', error);
      // Create a default context if pattern tracking fails
      context = {
        neglectedCategories: [],
        preferredTime: currentHour,
        lastCheckIn: null,
        overwhemSignals: 0
      };
    }
    
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
    if ((context && context.isOverwhelmed) || userTasks.length > 8) {
      return { type: 'overwhelmed', confidence: 0.9 };
    }

    // User has tasks planned
    if (userTasks.length >= 3) {
      return { type: 'has_tasks', confidence: 0.8 };
    }

    // Check if it's a productive time
    const isProductiveTime = context && context.currentHour === context.mostProductiveHour;
    const hasEnergy = context && !context.isOverwhelmed && context.todayCompletions < 5;
    
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
      "There's a difference between making a list and completing it. Which of these needs decoding?",
      "You've taken the first step - you can see your tasks. Now let's make them actionable.",
      "What if I told you some of these don't have to be as hard as they look?",
      "You're beginning to see the patterns. Which ones still feel impossible?"
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
    
    if (context && context.neglectedCategories && context.neglectedCategories.length > 0) {
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
      "I can show you the patterns, but you have to choose to act. This is your moment.",
      "What if I told you... this energy you feel right now is when disasters get prevented?",
      "There's a difference between having time and using time wisely. Choose wisely.",
      "You're beginning to see when you're most effective. The question is: will you take the red pill?"
    ];

    const suggestions = this.generateSmartSuggestions(context, seasonal, essentials, true);

    return {
      message: this.randomChoice(messages),
      type: 'opportunity',
      suggestions,
      actions: [
        { type: 'power_hour', label: 'Show me the way' },
        { type: 'one_big_thing', label: 'One meaningful task' },
        { type: 'catch_up', label: 'Face what I\'ve been avoiding' }
      ]
    };
  }

  /**
   * Default response
   */
  defaultResponse(context) {
    const messages = [
      "This is your last chance. After this, there is no going back.",
      "I can only show you the door. You're the one who has to walk through it.",
      "The question isn't whether you're ready - it's whether you choose to see.",
      "Unfortunately, no one can be told what needs to be done. You have to see it for yourself."
    ];

    return {
      message: this.randomChoice(messages),
      type: 'default',
      suggestions: [],
      actions: [
        { type: 'check_seasonal', label: 'Show me what\'s coming (seasonal)' },
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
    if (context && context.neglectedCategories && context.neglectedCategories.includes('relationship')) {
      const relationshipEssentials = essentials.daily.filter(t => t.category === 'relationship');
      suggestions.push(...relationshipEssentials.slice(0, 1));
    }

    // Priority 3: Other neglected categories
    if (context && context.neglectedCategories) {
      context.neglectedCategories.slice(0, 2).forEach(category => {
        const categoryTasks = essentials.daily.filter(t => t.category === category);
        if (categoryTasks.length > 0) {
          suggestions.push(categoryTasks[0]);
        }
      });
    }

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
      },
      'install closet shelving': {
        thisWeekend: [
          { title: 'Measure closet width, depth, and height', time: '10 min' },
          { title: 'Research shelving systems (Home Depot vs Amazon)', time: '20 min' },
          { title: 'Buy shelving kit and basic tools', time: '1 hour' }
        ],
        nextWeekend: [
          { title: 'Clear everything out of closet', time: '30 min' },
          { title: 'Find studs with stud finder', time: '15 min' },
          { title: 'Install mounting brackets level', time: '45 min' },
          { title: 'Hang shelves and test weight', time: '30 min' }
        ],
        suggestion: 'Wire shelving is easier for beginners. Measure twice, drill once. YouTube the specific brand you buy.'
      },
      'install threshold': {
        thisWeekend: [
          { title: 'Measure the gap between rooms', time: '5 min' },
          { title: 'Buy threshold strip (wood, metal, or vinyl)', time: '30 min' },
          { title: 'Get wood screws or construction adhesive', time: '5 min' }
        ],
        nextWeekend: [
          { title: 'Cut threshold to exact width if needed', time: '10 min' },
          { title: 'Test fit - should sit flush with both floors', time: '5 min' },
          { title: 'Drill pilot holes and screw down', time: '15 min' },
          { title: 'Caulk edges if needed', time: '10 min' }
        ],
        suggestion: 'Thresholds hide uneven transitions. Get one slightly wider than the gap and trim to fit.'
      },
      'organize garage': {
        thisWeekend: [
          { title: 'Clear one wall completely', time: '30 min' },
          { title: 'Make three piles: trash, donate, keep', time: '45 min' },
          { title: 'Take photos of anything you might sell', time: '10 min' }
        ],
        nextWeekend: [
          { title: 'Get shelving or hooks from store', time: '1 hour' },
          { title: 'Install wall storage', time: '1.5 hours' },
          { title: 'Put keeper stuff back organized', time: '45 min' }
        ],
        suggestion: 'Start with one wall. Don\'t try to organize the whole garage at once.'
      },
      'paint bedroom': {
        thisWeekend: [
          { title: 'Pick paint color (bring sample home first)', time: '30 min' },
          { title: 'Buy paint, brushes, rollers, drop cloths', time: '1 hour' },
          { title: 'Move furniture to center, cover with plastic', time: '30 min' }
        ],
        nextWeekend: [
          { title: 'Tape edges and trim', time: '45 min' },
          { title: 'Prime walls if needed', time: '2 hours' },
          { title: 'Paint first coat', time: '2 hours' },
          { title: 'Second coat next day', time: '2 hours' }
        ],
        suggestion: 'Good paint matters more than expensive brushes. Take your time with the prep work.'
      },
      'fix squeaky door': {
        today: [
          { title: 'Identify which hinge is squeaking', time: '2 min' },
          { title: 'Get WD-40 or 3-in-1 oil', time: '5 min' },
          { title: 'Spray hinges thoroughly', time: '2 min' },
          { title: 'Work door back and forth', time: '2 min' },
          { title: 'Wipe excess oil with cloth', time: '2 min' }
        ],
        suggestion: 'Most door squeaks are fixed with basic oil. If it comes back, the hinge might be worn out.'
      },
      'install shower head': {
        thisWeekend: [
          { title: 'Remove old shower head (twist counterclockwise)', time: '5 min' },
          { title: 'Clean threads on shower arm', time: '5 min' },
          { title: 'Wrap new threads with plumber tape', time: '5 min' },
          { title: 'Hand-tighten new shower head', time: '5 min' },
          { title: 'Test for leaks', time: '2 min' }
        ],
        suggestion: 'Don\'t over-tighten! Hand-tight plus a quarter turn with pliers is usually enough.'
      },
      'caulk bathtub': {
        thisWeekend: [
          { title: 'Remove old caulk with scraper', time: '30 min' },
          { title: 'Clean surface with rubbing alcohol', time: '10 min' },
          { title: 'Apply painter tape for clean lines', time: '15 min' },
          { title: 'Apply new caulk in steady bead', time: '15 min' },
          { title: 'Smooth with finger, remove tape immediately', time: '10 min' }
        ],
        suggestion: 'Remove tape while caulk is wet! Let cure 24 hours before using shower.'
      },
      'mount tv': {
        thisWeekend: [
          { title: 'Find wall studs with stud finder', time: '10 min' },
          { title: 'Buy TV mount that fits your TV size', time: '30 min' },
          { title: 'Mark bracket holes on wall', time: '10 min' }
        ],
        nextWeekend: [
          { title: 'Drill pilot holes into studs', time: '15 min' },
          { title: 'Attach wall bracket with lag bolts', time: '20 min' },
          { title: 'Mount TV bracket to TV back', time: '10 min' },
          { title: 'Hang TV and run cables', time: '15 min' }
        ],
        suggestion: 'ALWAYS hit studs, not just drywall. TVs are heavy and will pull out of drywall alone.'
      },
      'replace faucet': {
        thisWeekend: [
          { title: 'Turn off water supply under sink', time: '2 min' },
          { title: 'Measure existing faucet holes', time: '5 min' },
          { title: 'Buy matching replacement faucet', time: '45 min' }
        ],
        nextWeekend: [
          { title: 'Disconnect old water lines', time: '15 min' },
          { title: 'Remove old faucet', time: '10 min' },
          { title: 'Install new faucet according to instructions', time: '30 min' },
          { title: 'Reconnect water lines and test', time: '15 min' }
        ],
        suggestion: 'Take photos before disconnecting anything. Plumber putty seals better than tape.'
      },
      'organize basement': {
        thisWeekend: [
          { title: 'Clear one section completely', time: '1 hour' },
          { title: 'Sort into keep/donate/trash piles', time: '1 hour' },
          { title: 'Take measurements for shelving', time: '15 min' }
        ],
        nextWeekend: [
          { title: 'Buy metal shelving units', time: '1 hour' },
          { title: 'Assemble and position shelves', time: '2 hours' },
          { title: 'Put everything back organized', time: '1 hour' }
        ],
        suggestion: 'Start with one wall or corner. Metal shelves hold more weight than plastic.'
      }
    };

    // Smart matching for common tasks - check multiple keywords
    const lowerTask = taskTitle.toLowerCase().trim();
    
    // First try exact substring matching
    for (const [key, breakdown] of Object.entries(breakdowns)) {
      if (lowerTask.includes(key.toLowerCase())) {
        return breakdown;
      }
    }
    
    // Then try keyword matching for better flexibility
    const taskWords = lowerTask.split(' ').filter(word => word.length > 2);
    for (const [key, breakdown] of Object.entries(breakdowns)) {
      const keyWords = key.split(' ');
      const matchCount = keyWords.filter(keyWord => 
        taskWords.some(taskWord => taskWord.includes(keyWord) || keyWord.includes(taskWord))
      ).length;
      
      // If we match most of the key words, use this breakdown
      if (matchCount >= Math.min(2, keyWords.length)) {
        return breakdown;
      }
    }

    // Default breakdown for unrecognized tasks
    return {
      suggestion: `Here's a general approach to break down "${taskTitle}":`,
      steps: [
        { title: 'Research what supplies/tools you need', time: '10 min' },
        { title: 'Plan the steps and timing', time: '10 min' },
        { title: 'Start with the first concrete action', time: '15 min' }
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

  /**
   * Get age-appropriate baby tasks based on child's age in months
   */
  getAgeSpecificTasks(ageInMonths) {
    if (ageInMonths <= 3) {
      // Newborn (0-3 months)
      return [
        { title: 'Prep bottles for night feeds', description: 'Set them up before bed', category: 'baby', priority: 'high', timeEstimate: '5 minutes' },
        { title: 'Stock diaper changing stations', description: 'Upstairs, downstairs, car - all ready', category: 'baby', priority: 'medium', timeEstimate: '10 minutes' },
        { title: 'Take photos of baby', description: 'They change so fast at this age', category: 'baby', priority: 'low', timeEstimate: '5 minutes' },
        { title: 'Research daycare options', description: 'Waitlists fill up fast', category: 'baby', priority: 'high', timeEstimate: '30 minutes' }
      ];
    } else if (ageInMonths <= 6) {
      // Early infant (4-6 months)  
      return [
        { title: 'Schedule 6-month checkup', description: 'Book it before you forget', category: 'baby', priority: 'high', timeEstimate: '5 minutes' },
        { title: 'Research solid food options', description: 'They\'ll be eating soon', category: 'baby', priority: 'medium', timeEstimate: '20 minutes' },
        { title: 'Baby-proof electrical outlets', description: 'They\'re getting more mobile', category: 'baby', priority: 'medium', timeEstimate: '15 minutes' },
        { title: 'Start bedtime routine consistency', description: 'Makes life easier for everyone', category: 'baby', priority: 'medium', timeEstimate: '10 minutes setup' }
      ];
    } else if (ageInMonths <= 12) {
      // Mobile baby (7-12 months)
      return [
        { title: 'Install baby gates', description: 'Before they start climbing stairs', category: 'baby', priority: 'high', timeEstimate: '30 minutes' },
        { title: 'Cabinet locks on everything', description: 'They\'ll find the one you missed', category: 'baby', priority: 'high', timeEstimate: '45 minutes' },
        { title: 'Plan first birthday', description: 'Book venues early', category: 'baby', priority: 'medium', timeEstimate: '20 minutes' },
        { title: 'Research toddler activities', description: 'Music classes, swim lessons fill up', category: 'baby', priority: 'low', timeEstimate: '15 minutes' }
      ];
    } else if (ageInMonths <= 24) {
      // Toddler (13-24 months)
      return [
        { title: 'Research preschools', description: 'Good ones have waitlists', category: 'baby', priority: 'medium', timeEstimate: '30 minutes' },
        { title: 'Toddler-proof the house again', description: 'They got taller and smarter', category: 'baby', priority: 'medium', timeEstimate: '20 minutes' },
        { title: 'Plan potty training approach', description: 'Read up before the chaos', category: 'baby', priority: 'low', timeEstimate: '15 minutes' },
        { title: 'Schedule toddler activities', description: 'Burn off that energy', category: 'baby', priority: 'medium', timeEstimate: '10 minutes' }
      ];
    } else {
      // Older kids (2+ years)
      return [
        { title: 'Plan tomorrow\'s outfit', description: 'Avoid morning meltdowns', category: 'baby', priority: 'medium', timeEstimate: '5 minutes' },
        { title: 'Read one story together', description: 'Connection that matters', category: 'baby', priority: 'high', timeEstimate: '10 minutes' },
        { title: 'Ask about their favorite part of today', description: 'Actually listen to the answer', category: 'baby', priority: 'high', timeEstimate: '5 minutes' },
        { title: 'Plan a fun weekend activity', description: 'Something they\'ll remember', category: 'baby', priority: 'medium', timeEstimate: '10 minutes' }
      ];
    }
  }

  /**
   * Get browse suggestions by category
   */
  getBrowseSuggestions(category, userTasks = [], babyAgeInMonths = null) {
    // Create diverse, category-specific suggestions
    const suggestions = {
      'seasonal': [
        { title: 'Check holiday travel prices', description: 'Prices jump significantly after October', category: 'personal', priority: 'high', timeEstimate: '10 minutes', isSeasonal: true },
        { title: 'Schedule flu shots', description: 'Beat the rush before flu season peaks', category: 'health', priority: 'medium', timeEstimate: '5 minutes', isSeasonal: true },
        { title: 'Test heating system', description: 'Before you really need it', category: 'household', priority: 'medium', timeEstimate: '15 minutes', isSeasonal: true },
        { title: 'Order holiday cards', description: 'Good ones sell out early', category: 'personal', priority: 'low', timeEstimate: '10 minutes', isSeasonal: true },
        { title: 'Book end-of-year appointments', description: 'Dentist, eye doctor - use those benefits', category: 'health', priority: 'medium', timeEstimate: '10 minutes', isSeasonal: true },
        { title: 'Plan gift budget', description: 'Avoid December panic spending', category: 'personal', priority: 'medium', timeEstimate: '20 minutes', isSeasonal: true }
      ],
      'quick-wins': [
        { title: 'Delete 10 old photos', description: 'Free up phone storage instantly', category: 'personal', priority: 'low', timeEstimate: '2 minutes' },
        { title: 'Unsubscribe from 3 emails', description: 'Clean up that inbox', category: 'personal', priority: 'low', timeEstimate: '3 minutes' },
        { title: 'Wipe down kitchen counters', description: 'Quick reset that feels good', category: 'household', priority: 'low', timeEstimate: '2 minutes' },
        { title: 'Make tomorrow\'s coffee tonight', description: 'Future you will thank you', category: 'household', priority: 'low', timeEstimate: '1 minute' },
        { title: 'Put phone in another room', description: 'Instant focus boost', category: 'personal', priority: 'low', timeEstimate: '30 seconds' },
        { title: 'Water your plants', description: 'They\'re counting on you', category: 'household', priority: 'low', timeEstimate: '2 minutes' }
      ],
      'prevention': [
        { title: 'Check tire pressure', description: 'Prevents uneven wear and blowouts', category: 'personal', priority: 'medium', timeEstimate: '10 minutes', prevents: 'Expensive tire replacement' },
        { title: 'Clean dryer vent', description: 'Fire prevention that takes minutes', category: 'household', priority: 'high', timeEstimate: '15 minutes', prevents: 'House fires' },
        { title: 'Update important passwords', description: 'Before you get hacked', category: 'personal', priority: 'medium', timeEstimate: '15 minutes', prevents: 'Identity theft' },
        { title: 'Check smoke detector batteries', description: 'Better safe than sorry', category: 'household', priority: 'high', timeEstimate: '5 minutes', prevents: 'Fire danger' },
        { title: 'Back up phone photos', description: 'Before they\'re gone forever', category: 'personal', priority: 'medium', timeEstimate: '10 minutes', prevents: 'Lost memories' },
        { title: 'Schedule car maintenance', description: 'Oil change saves your engine', category: 'personal', priority: 'medium', timeEstimate: '5 minutes', prevents: 'Expensive repairs' }
      ],
      'personal': [
        { title: 'Drink a full glass of water', description: 'Start hydrating right now', category: 'personal', priority: 'low', timeEstimate: '2 minutes' },
        { title: 'Take 10 deep breaths', description: 'Reset your nervous system', category: 'personal', priority: 'low', timeEstimate: '2 minutes' },
        { title: 'Schedule doctor checkup', description: 'When did you last go?', category: 'personal', priority: 'medium', timeEstimate: '5 minutes' },
        { title: 'Update LinkedIn profile', description: 'Keep career options open', category: 'personal', priority: 'low', timeEstimate: '15 minutes' },
        { title: 'Listen to 1 podcast episode', description: 'Learn something new today', category: 'personal', priority: 'low', timeEstimate: '30 minutes' },
        { title: 'Read for 15 minutes', description: 'Books make you smarter', category: 'personal', priority: 'low', timeEstimate: '15 minutes' }
      ],
      'household': [
        { title: 'Run one load of laundry', description: 'Just start it, that\'s all', category: 'household', priority: 'medium', timeEstimate: '3 minutes' },
        { title: 'Empty the dishwasher', description: 'Future cooking-you will thank you', category: 'household', priority: 'low', timeEstimate: '5 minutes' },
        { title: 'Make your bed', description: 'Instant bedroom upgrade', category: 'household', priority: 'low', timeEstimate: '2 minutes' },
        { title: 'Vacuum one room', description: 'Pick the messiest one', category: 'household', priority: 'medium', timeEstimate: '10 minutes' },
        { title: 'Organize one drawer', description: 'Start with the junk drawer', category: 'household', priority: 'low', timeEstimate: '10 minutes' },
        { title: 'Take out the trash', description: 'Before it overflows', category: 'household', priority: 'medium', timeEstimate: '2 minutes' }
      ],
      'kids': babyAgeInMonths 
        ? this.getAgeSpecificTasks(babyAgeInMonths)
        : [
            { title: 'Plan tomorrow\'s outfit', description: 'Avoid morning meltdowns', category: 'baby', priority: 'medium', timeEstimate: '5 minutes' },
            { title: 'Read one story together', description: 'Connection that matters', category: 'baby', priority: 'high', timeEstimate: '10 minutes' },
            { title: 'Ask about their favorite part of today', description: 'Actually listen to the answer', category: 'baby', priority: 'high', timeEstimate: '5 minutes' },
            { title: 'Plan a fun weekend activity', description: 'Something they\'ll remember', category: 'baby', priority: 'medium', timeEstimate: '10 minutes' },
            { title: 'Check backpack for important papers', description: 'Stay in the loop', category: 'baby', priority: 'medium', timeEstimate: '3 minutes' },
            { title: 'Take a silly photo together', description: 'Capture the everyday joy', category: 'baby', priority: 'low', timeEstimate: '2 minutes' }
          ],
      'relationships': [
        { title: 'Text an old friend', description: 'Just "thinking of you" works', category: 'relationship', priority: 'low', timeEstimate: '2 minutes' },
        { title: 'Plan a date night', description: 'Even if it\'s just takeout at home', category: 'relationship', priority: 'medium', timeEstimate: '10 minutes' },
        { title: 'Call your parents', description: 'They miss your voice', category: 'relationship', priority: 'medium', timeEstimate: '15 minutes' },
        { title: 'Ask about their day first', description: 'Before talking about yours', category: 'relationship', priority: 'high', timeEstimate: '30 seconds', prevents: 'Feeling like roommates' },
        { title: 'Give a real hug', description: 'Not while multitasking', category: 'relationship', priority: 'medium', timeEstimate: '10 seconds' },
        { title: 'Send a funny meme', description: 'To someone who needs a smile', category: 'relationship', priority: 'low', timeEstimate: '1 minute' }
      ],
      'projects': [
        { title: 'Organize the garage', description: 'Break it into weekend chunks - she\'ll be so impressed', category: 'home_projects', priority: 'medium', timeEstimate: 'Multiple weekends', isProject: true },
        { title: 'Install closet shelving', description: 'Double the storage space in one weekend', category: 'home_projects', priority: 'medium', timeEstimate: '4-6 hours', isProject: true },
        { title: 'Paint the bedroom', description: 'Fresh look, better sleep environment', category: 'home_projects', priority: 'low', timeEstimate: '2 weekends', isProject: true },
        { title: 'Fix squeaky door hinges', description: 'All of them - you know which ones', category: 'home_projects', priority: 'low', timeEstimate: '1 hour', isProject: true },
        { title: 'Install smart thermostat', description: 'Save money and look tech-savvy', category: 'home_projects', priority: 'medium', timeEstimate: '2 hours', isProject: true },
        { title: 'Weatherstrip doors and windows', description: 'Draft-proof before winter hits', category: 'home_projects', priority: 'medium', timeEstimate: '3-4 hours', isProject: true }
      ]
    };
    
    // Return suggestions for the category, or seasonal if not found
    return suggestions[category] || suggestions['seasonal'];
  }
}

/**
 * Factory function to create Morpheus instance
 */
export function createMorpheus() {
  return new Morpheus();
}

export default Morpheus;