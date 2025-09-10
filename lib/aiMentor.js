/**
 * Dad Mentor System
 * Your straight-talking dad friend who helps you get stuff done
 * Based on user patterns, seasonal needs, and real life chaos
 */

import { getCurrentSeasonalTasks, getEssentialTasks } from './seasonalTasks';
import { getAIContext } from './patternTracking';

/**
 * Core Dad Mentor class
 */
export class DadMentor {
  constructor() {
    this.personality = {
      tone: 'authentic-dad-friend', // Straight talk, been-there-done-that
      humor: 'dry-dad-humor', // Real dad jokes and observations
      directness: 'very-high', // No BS, just practical help
      empathy: 'real' // Acknowledges the actual struggle
    };
  }

  /**
   * Daily Reality Check - the main AI interaction
   */
  async dailyCheckIn(userId, userTasks = [], currentHour = new Date().getHours()) {
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

    // Get user profile for personalized recommendations
    const userProfile = this.getUserProfile();
    
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
      "Alright, everything's on fire and you're out of coffee. I get it. Let's just keep everyone alive today.",
      "One of those 'hide in the bathroom for 5 minutes' days? Been there. Survival mode it is.",
      "Your brain's running at 127% capacity and none of it's working right. Let's simplify this mess.",
      "Look, some days you're the dad, some days you're the disaster. Today feels like disaster day. That's fine."
    ];

    return {
      message: this.randomChoice(messages),
      type: 'overwhelmed', 
      suggestions: [],
      actions: [
        { type: 'emergency_mode', label: 'Just keep everyone alive' },
        { type: 'one_critical', label: 'One task. Maybe.' },
        { type: 'defer_all', label: 'Tomorrow\'s a new day' }
      ]
    };
  }

  /**
   * Response when user has tasks planned
   */
  supportiveResponse(context, userTasks) {
    const messages = [
      "Okay, you've got a list. That's more than most dads manage. Which of these is actually going to happen today?",
      "I see tasks, but some of these look like 'organize garage' - which isn't a task, it's a weekend-killer. Let's fix that.",
      "Good news: you've got stuff written down. Bad news: 'fix bathroom' isn't actionable. Let's break this down.",
      "You're thinking like a dad who gets stuff done. Now let's make these tasks dad-friendly."
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
      actions.push({ type: 'break_down', label: 'Make these actually doable' });
    }

    actions.push({ type: 'add_reminders', label: 'Remind me before I forget' });

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
      message = `Hey, you've been avoiding ${neglected} stuff for a while. I'm not judging, just saying. Also, ${seasonal[0]?.title || 'some seasonal things'} is coming up.`;
    } else if (seasonal.length > 0 && seasonal[0].priority === 'time-sensitive') {
      message = `Real talk: ${seasonal[0].title} needs to happen soon or it becomes expensive. Your call.`;
    }

    return {
      message,
      type: 'suggestive',
      suggestions,
      actions: [
        { type: 'add_suggestion', label: 'Add the important ones' },
        { type: 'seasonal_only', label: 'Just the disaster-prevention stuff' },
        { type: 'skip_suggestions', label: 'I\'ve got this handled' }
      ]
    };
  }

  /**
   * Response for productive moments
   */
  opportunityResponse(context, seasonal, essentials) {
    const messages = [
      "You've got some momentum going. This is when smart dads tackle the stuff that prevents expensive disasters later.",
      "Feeling productive? Good. Let's use this energy for something that'll save you money and headaches.",
      "This is your productive window. Want to knock out something meaningful while you're on a roll?",
      "You're in that rare dad zone where you might actually get stuff done. Let's not waste it."
    ];

    const suggestions = this.generateSmartSuggestions(context, seasonal, essentials, true);

    return {
      message: this.randomChoice(messages),
      type: 'opportunity',
      suggestions,
      actions: [
        { type: 'power_hour', label: 'Give me the high-impact stuff' },
        { type: 'one_big_thing', label: 'One thing that actually matters' },
        { type: 'catch_up', label: 'Deal with what I\'ve been avoiding' }
      ]
    };
  }

  /**
   * Default response
   */
  defaultResponse(context) {
    const messages = [
      "Alright, what actually needs your attention today? Let's figure this out.",
      "Nothing urgent on fire? Good. Let's see what could use some dad attention.",
      "Clean slate today. Want to tackle something before it becomes a problem?",
      "Looking good so far. What should we handle while you've got bandwidth?"
    ];

    return {
      message: this.randomChoice(messages),
      type: 'default',
      suggestions: [],
      actions: [
        { type: 'check_seasonal', label: 'What\'s seasonal right now?' },
        { type: 'quick_wins', label: 'Give me some easy wins' },
        { type: 'skip_checkin', label: 'All good for now' }
      ]
    };
  }

  /**
   * Get user profile for personalization
   */
  getUserProfile() {
    if (typeof window === 'undefined') return null;
    try {
      const profile = localStorage.getItem('userProfile');
      return profile ? JSON.parse(profile) : null;
    } catch {
      return null;
    }
  }

  /**
   * Generate smart suggestions based on context AND profile
   */
  generateSmartSuggestions(context, seasonal, essentials, isProductiveTime = false) {
    const suggestions = [];
    const profile = this.getUserProfile();
    
    // Priority 1: Time-sensitive seasonal tasks (adjusted for location)
    let urgentSeasonal = seasonal.filter(t => 
      t.priority === 'time-sensitive' || t.priority === 'deadline'
    );
    
    // Filter seasonal tasks based on homeownership
    if (profile?.homeOwnership) {
      urgentSeasonal = urgentSeasonal.filter(t => {
        if (profile.homeOwnership === 'rent' && t.category === 'home_projects') {
          return t.renterFriendly === true;
        }
        return true;
      });
    }
    suggestions.push(...urgentSeasonal.slice(0, 1));

    // Priority 2: Kid-specific tasks based on ages
    if (profile?.kidsCount > 0 && profile?.kidsAges?.length > 0) {
      const kidTasks = this.generateKidTasks(profile.kidsAges);
      suggestions.push(...kidTasks.slice(0, 1));
    }

    // Priority 3: Relationship tasks (personalized with spouse name)
    if (context && context.neglectedCategories && context.neglectedCategories.includes('relationship')) {
      const relationshipEssentials = essentials.daily.filter(t => t.category === 'relationship');
      if (profile?.spouseName) {
        // Personalize the relationship tasks
        relationshipEssentials.forEach(task => {
          task.title = task.title.replace('your partner', profile.spouseName);
          task.detail = task.detail?.replace('them', profile.spouseName);
        });
      }
      suggestions.push(...relationshipEssentials.slice(0, 1));
    }

    // Priority 4: Focus on user's primary concerns
    if (profile?.primaryConcerns?.length > 0) {
      const concernTasks = essentials.weekly.filter(t => 
        profile.primaryConcerns.includes(t.category)
      );
      suggestions.push(...concernTasks.slice(0, 1));
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
  /**
   * Generate kid-specific tasks based on ages
   */
  generateKidTasks(kidsAges) {
    const tasks = [];
    
    kidsAges.forEach((age, index) => {
      const ageNum = parseInt(age);
      if (isNaN(ageNum)) return;
      
      // Baby tasks (0-2)
      if (ageNum <= 2) {
        tasks.push({
          title: `Schedule ${ageNum <= 1 ? '12-month' : '2-year'} checkup`,
          detail: 'Vaccines and developmental milestones check',
          category: 'baby',
          priority: 'high'
        });
      }
      
      // Toddler tasks (3-5)
      else if (ageNum <= 5) {
        tasks.push({
          title: 'Research preschool options',
          detail: 'Good ones have 6+ month waitlists',
          category: 'baby',
          priority: 'high'
        });
      }
      
      // School age (6-12)
      else if (ageNum <= 12) {
        tasks.push({
          title: 'Check homework folder',
          detail: 'Permission slips hide in there',
          category: 'baby',
          priority: 'medium'
        });
      }
      
      // Teen (13+)
      else {
        tasks.push({
          title: 'Check college savings plan',
          detail: 'Time is running out faster than you think',
          category: 'personal',
          priority: 'high'
        });
      }
    });
    
    return tasks;
  }

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
        difficulty: '☕☕ Double Shot',
        totalTime: '3-4 hours over 2 weekends',
        skillLevel: 'You can handle this (with YouTube help)',
        youtube: {
          searchTerms: 'install wire closet shelving brackets',
          recommendedChannel: 'This Old House',
          tip: 'Watch the video twice before starting'
        },
        thisWeekend: [
          { title: 'Measure closet width, depth, and height', time: '10 min' },
          { title: 'Research shelving systems (Home Depot vs Amazon)', time: '20 min' },
          { title: 'Buy shelving kit and basic tools', time: '1 hour' },
          { title: 'Watch this tutorial: Install Wire Closet Shelving', time: '10 min', youtube: true }
        ],
        nextWeekend: [
          { title: 'Clear everything out of closet', time: '30 min' },
          { title: 'Find studs with stud finder', time: '15 min' },
          { title: 'Install mounting brackets level', time: '45 min' },
          { title: 'Hang shelves and test weight', time: '30 min' }
        ],
        suggestion: 'Wire shelving is easier for beginners. Measure twice, drill once. If you mess up the first bracket, the rest will be crooked.'
      },
      'install threshold': {
        difficulty: '☕☕ Double Shot',
        totalTime: '1-2 hours',
        skillLevel: 'Basic DIY skills needed',
        youtube: {
          searchTerms: 'install door threshold transition strip',
          tip: 'Measure twice, cut once - classic dad advice for a reason'
        },
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
        difficulty: '☕☕☕ Full Pot',
        totalTime: 'Multiple weekends (seriously)',
        skillLevel: 'Commitment level: high',
        youtube: {
          searchTerms: 'garage organization before after storage ideas',
          tip: 'Look for videos of garages similar to your disaster level'
        },
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
        suggestion: 'Start with one wall. Seriously, just one. Don\'t try to tackle the whole garage or you\'ll quit by lunch.'
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
        difficulty: '☕ One Cup',
        totalTime: '15 minutes',
        skillLevel: 'Anyone can do this',
        youtube: {
          searchTerms: 'how to fix squeaky door hinge WD40',
          tip: 'Skip to the middle - most videos have too much intro'
        },
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
        difficulty: '☕☕☕ Full Pot',
        totalTime: '3-4 hours (plus shopping)',
        skillLevel: 'Doable if you\'re handy',
        youtube: {
          searchTerms: 'replace kitchen faucet step by step',
          tip: 'Find a video for your specific faucet brand if possible'
        },
        thisWeekend: [
          { title: 'Turn off water supply under sink', time: '2 min' },
          { title: 'Measure existing faucet holes', time: '5 min' },
          { title: 'Buy matching replacement faucet', time: '45 min' },
          { title: 'Watch installation video for your faucet', time: '15 min', youtube: true }
        ],
        nextWeekend: [
          { title: 'Disconnect old water lines', time: '15 min' },
          { title: 'Remove old faucet', time: '10 min' },
          { title: 'Install new faucet according to instructions', time: '30 min' },
          { title: 'Reconnect water lines and test', time: '15 min' }
        ],
        suggestion: 'Take photos before disconnecting anything. If you see any weird pipe configurations, maybe call a plumber.'
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
      },
      'rewire outlet': {
        difficulty: '☕☕☕☕ Drive to Starbucks',
        totalTime: 'Call an electrician',
        skillLevel: 'This can literally kill you',
        callAPro: true,
        youtube: {
          searchTerms: 'how to find good electrician near me',
          tip: 'Watch videos to understand what they\'re doing, but don\'t DIY this'
        },
        today: [
          { title: 'Turn off power to that outlet (breaker box)', time: '5 min' },
          { title: 'Test with outlet tester to make sure it\'s really off', time: '2 min' },
          { title: 'Take photos of the problem', time: '3 min' },
          { title: 'Call 3 electricians for quotes', time: '30 min' }
        ],
        suggestion: 'Electrical work is not "how hard could it be?" territory. Your life insurance doesn\'t cover DIY electrical mishaps.'
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
      difficulty: '☕☕ Double Shot',
      totalTime: 'TBD based on complexity',
      skillLevel: 'Need to figure this out',
      suggestion: `Alright, "${taskTitle}" is not in my database. Here's how to tackle the unknown:`,
      youtube: {
        searchTerms: `how to ${taskTitle.toLowerCase()}`,
        tip: 'Watch 2-3 videos before starting anything'
      },
      steps: [
        { title: 'YouTube it first (seriously, everything is on there)', time: '10 min', youtube: true },
        { title: 'Make a list of tools and supplies needed', time: '10 min' },
        { title: 'Decide if this is DIY or "call a pro"', time: '5 min' },
        { title: 'Start with the least destructive step first', time: '15 min' }
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
   * Get browse suggestions by category - now with deep personalization
   */
  async getBrowseSuggestions(category, userTasks = [], userProfile = null) {
    // Import the new contextual task engine
    const { generatePersonalizedTasks } = await import('./contextualTasks');
    
    // Get user ID for pattern tracking
    const userId = userProfile?.userId || 'browse-user';
    
    // Generate deeply personalized tasks
    try {
      const personalizedTasks = await generatePersonalizedTasks(
        userId,
        category,
        userProfile,
        userTasks
      );
      
      // Return personalized tasks if successful
      if (personalizedTasks && personalizedTasks.length > 0) {
        return personalizedTasks;
      }
    } catch (error) {
      console.error('Error generating personalized tasks:', error);
    }
    
    // Fallback to original static suggestions if personalization fails
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
      'kids': userProfile?.babyAge 
        ? this.getAgeSpecificTasks(userProfile.babyAge)
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
 * Factory function to create Dad Mentor instance
 */
export function createDadMentor() {
  return new DadMentor();
}

// Backward compatibility export
export function createMorpheus() {
  return new DadMentor();
}

export default DadMentor;