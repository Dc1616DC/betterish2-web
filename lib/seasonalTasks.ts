// Betterish Seasonal Task System
// Time-sensitive tasks that prevent real problems

// Task priority types
export enum TaskPriority {
  DISASTER_PREVENTION = 'disaster-prevention',
  TIME_SENSITIVE = 'time-sensitive',
  DEADLINE = 'deadline',
  PLANNING = 'planning',
  SANITY_MAINTENANCE = 'sanity-maintenance',
  EMERGENCY = 'emergency'
}

// Task categories
export enum TaskCategory {
  RELATIONSHIP = 'relationship',
  PERSONAL = 'personal',
  MAINTENANCE = 'maintenance',
  ADMIN = 'admin',
  HEALTH = 'health',
  KIDS = 'kids',
  PLANNING = 'planning',
  SAFETY = 'safety',
  SURVIVAL = 'survival'
}

// Seasonal task interface
export interface SeasonalTask {
  id: string;
  title: string;
  detail: string;
  category: TaskCategory | string; // Allow string for backward compatibility
  priority: TaskPriority | string;
  timeEstimate?: string;
  prevents?: string;
  deadline?: string;
}

// Essential tasks structure
export interface EssentialTasks {
  daily: SeasonalTask[];
  weekly: SeasonalTask[];
  monthly: SeasonalTask[];
  quarterly: SeasonalTask[];
}

// Monthly tasks mapping
export type MonthlyTasks = Record<number, SeasonalTask[]>;

export function getCurrentSeasonalTasks(): SeasonalTask[] {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11 (Jan-Dec)
  
  return SEASONAL_TASKS_BY_MONTH[currentMonth] || [];
}

export function getEssentialTasks(): EssentialTasks {
  return {
    daily: DAILY_ESSENTIALS,
    weekly: WEEKLY_ESSENTIALS,
    monthly: MONTHLY_ESSENTIALS,
    quarterly: QUARTERLY_ESSENTIALS
  };
}

// The 80/20 principle: These prevent 80% of problems
const DAILY_ESSENTIALS: SeasonalTask[] = [
  {
    id: 'daily_001',
    title: 'Ask about her day first',
    detail: 'Before talking about yours - she feels seen',
    category: 'relationship',
    priority: 'disaster-prevention',
    timeEstimate: '30 seconds',
    prevents: 'Roommate syndrome'
  },
  {
    id: 'daily_002', 
    title: 'Real kiss hello/goodbye',
    detail: 'Not while doing something else',
    category: 'relationship',
    priority: 'disaster-prevention',
    timeEstimate: '5 seconds',
    prevents: 'Physical disconnection'
  },
  {
    id: 'daily_003',
    title: 'Take something off her plate',
    detail: 'Like "I\'ll handle bedtime tonight"',
    category: 'relationship', 
    priority: 'disaster-prevention',
    timeEstimate: '2 minutes',
    prevents: 'Partner burnout'
  }
];

const WEEKLY_ESSENTIALS: SeasonalTask[] = [
  {
    id: 'weekly_001',
    title: 'Give her 1 hour alone',
    detail: 'Take kids out Saturday morning',
    category: 'relationship',
    priority: 'disaster-prevention', 
    timeEstimate: '1 hour',
    prevents: 'Burnout and resentment'
  },
  {
    id: 'weekly_002',
    title: 'Plan something for next week',
    detail: 'Date, family activity, anything',
    category: 'relationship',
    priority: 'disaster-prevention',
    timeEstimate: '5 minutes',
    prevents: 'Relationship drift'
  },
  {
    id: 'weekly_003', 
    title: 'Check in with one friend',
    detail: 'Text "How\'s it going?"',
    category: 'personal',
    priority: 'sanity-maintenance',
    timeEstimate: '2 minutes',
    prevents: 'Social isolation'
  }
];

const MONTHLY_ESSENTIALS: SeasonalTask[] = [
  {
    id: 'monthly_001',
    title: 'Look under all sinks',
    detail: '30 seconds per sink, check for leaks',
    category: 'maintenance',
    priority: 'disaster-prevention',
    timeEstimate: '5 minutes',
    prevents: '$5,000 water damage'
  },
  {
    id: 'monthly_002',
    title: 'Check credit card charges', 
    detail: 'Scan for fraud or forgotten subscriptions',
    category: 'admin',
    priority: 'disaster-prevention',
    timeEstimate: '3 minutes',
    prevents: 'Fraud and surprise charges'
  },
  {
    id: 'monthly_003',
    title: 'Schedule something medical',
    detail: 'Yours or kids\', stay ahead of problems',
    category: 'health',
    priority: 'disaster-prevention', 
    timeEstimate: '5 minutes',
    prevents: 'Health emergencies'
  }
];

const QUARTERLY_ESSENTIALS: SeasonalTask[] = [
  {
    id: 'quarterly_001',
    title: 'Change HVAC filter',
    detail: 'Every 3 months prevents AC death',
    category: 'maintenance',
    priority: 'disaster-prevention',
    timeEstimate: '5 minutes', 
    prevents: 'AC repair ($3,000+)'
  },
  {
    id: 'quarterly_002',
    title: 'Test sump pump',
    detail: 'Pour water in pit - if you have one',
    category: 'maintenance',
    priority: 'disaster-prevention',
    timeEstimate: '2 minutes',
    prevents: 'Basement flooding'
  },
  {
    id: 'quarterly_003',
    title: 'Clean gutters',
    detail: 'Or pay someone $150 to do it',
    category: 'maintenance', 
    priority: 'disaster-prevention',
    timeEstimate: '1 hour',
    prevents: 'Foundation damage'
  }
];

// Month-specific tasks (0=January, 11=December)
const SEASONAL_TASKS_BY_MONTH: MonthlyTasks = {
  0: [ // January
    {
      id: 'jan_001',
      title: 'Register for summer camps',
      detail: 'Opens now, fills fast - check community centers',
      category: 'kids',
      priority: 'time-sensitive',
      timeEstimate: '15 minutes',
      deadline: 'End of January'
    },
    {
      id: 'jan_002', 
      title: 'Plan Valentine\'s Day',
      detail: 'Restaurant reservations book up early',
      category: 'relationship',
      priority: 'time-sensitive',
      timeEstimate: '10 minutes',
      deadline: 'Mid January'
    },
    {
      id: 'jan_003',
      title: 'Start tax document gathering',
      detail: 'W2s, receipts - less stress in April',
      category: 'admin',
      priority: 'planning',
      timeEstimate: '5 minutes setup',
      deadline: 'End of January'
    }
  ],

  1: [ // February
    {
      id: 'feb_001',
      title: 'Book spring break travel',
      detail: 'If going anywhere - prices jumping',
      category: 'planning',
      priority: 'time-sensitive',
      timeEstimate: '20 minutes',
      deadline: 'Mid February'
    },
    {
      id: 'feb_002',
      title: 'Schedule AC service',
      detail: 'For May appointment before heat hits',
      category: 'maintenance',
      priority: 'planning',
      timeEstimate: '5 minutes',
      deadline: 'End of February'
    },
    {
      id: 'feb_003',
      title: 'Preschool tours',
      detail: 'For fall enrollment - book tours now',
      category: 'kids',
      priority: 'time-sensitive', 
      timeEstimate: '10 minutes to schedule',
      deadline: 'End of February'
    }
  ],

  2: [ // March
    {
      id: 'mar_001',
      title: 'Summer camp payment',
      detail: 'Usually due now to secure spot',
      category: 'kids',
      priority: 'deadline',
      timeEstimate: '5 minutes',
      deadline: 'Check camp deadlines'
    },
    {
      id: 'mar_002',
      title: 'Test sump pump',
      detail: 'Before spring rain season starts',
      category: 'maintenance',
      priority: 'disaster-prevention',
      timeEstimate: '2 minutes',
      deadline: 'Before April rains'
    },
    {
      id: 'mar_003', 
      title: 'Change smoke detector batteries',
      detail: 'Spring forward = battery change reminder',
      category: 'safety',
      priority: 'disaster-prevention',
      timeEstimate: '10 minutes',
      deadline: 'Daylight saving weekend'
    }
  ],

  3: [ // April
    {
      id: 'apr_001',
      title: 'Clean gutters',
      detail: 'After pollen season, before summer storms',
      category: 'maintenance',
      priority: 'disaster-prevention',
      timeEstimate: '1 hour or hire someone',
      deadline: 'Before May storms'
    },
    {
      id: 'apr_002',
      title: 'Sign up for swim lessons',
      detail: 'Summer spots fill up fast',
      category: 'kids',
      priority: 'time-sensitive',
      timeEstimate: '10 minutes',
      deadline: 'End of April'
    },
    {
      id: 'apr_003',
      title: 'Mother\'s Day planning',
      detail: 'Card, gift, restaurant reservation',
      category: 'relationship',
      priority: 'disaster-prevention',
      timeEstimate: '15 minutes',
      deadline: 'Early April'
    }
  ],

  4: [ // May
    {
      id: 'may_001',
      title: 'Update emergency contacts',
      detail: 'For summer babysitters and camps',
      category: 'safety',
      priority: 'planning',
      timeEstimate: '10 minutes',
      deadline: 'Before summer starts'
    },
    {
      id: 'may_002',
      title: 'Check car AC',
      detail: 'Before road trip season starts',
      category: 'maintenance',
      priority: 'planning',
      timeEstimate: '5 minutes',
      deadline: 'Before summer trips'
    },
    {
      id: 'may_003',
      title: 'Plan Father\'s Day hints',
      detail: 'Tell your wife what you actually want',
      category: 'personal',
      priority: 'planning',
      timeEstimate: '2 minutes',
      deadline: 'Mid May'
    }
  ],

  5: [ // June
    {
      id: 'jun_001', 
      title: 'Fall activity registration',
      detail: 'Soccer, dance, gymnastics - opens now',
      category: 'kids',
      priority: 'time-sensitive',
      timeEstimate: '15 minutes',
      deadline: 'Mid June'
    },
    {
      id: 'jun_002',
      title: 'Back-to-school planning',
      detail: 'Supplies lists usually come out now',
      category: 'kids', 
      priority: 'planning',
      timeEstimate: '5 minutes',
      deadline: 'End of June'
    },
    {
      id: 'jun_003',
      title: 'Check vacation time',
      detail: 'Use it or lose it policies kick in',
      category: 'personal',
      priority: 'planning',
      timeEstimate: '2 minutes',
      deadline: 'Mid June'
    }
  ],

  6: [ // July
    {
      id: 'jul_001',
      title: 'School registration tasks',
      detail: 'Avoid the August panic rush',
      category: 'kids',
      priority: 'time-sensitive',
      timeEstimate: '20 minutes',
      deadline: 'End of July'
    },
    {
      id: 'jul_002',
      title: 'Halloween costume ideas',
      detail: 'Good ones sell out by September',
      category: 'kids',
      priority: 'planning',
      timeEstimate: '5 minutes',
      deadline: 'End of July'
    },
    {
      id: 'jul_003',
      title: 'Schedule fall dentist',
      detail: 'During school breaks when possible',
      category: 'health',
      priority: 'planning',
      timeEstimate: '5 minutes',
      deadline: 'End of July'
    }
  ],

  7: [ // August 
    {
      id: 'aug_001',
      title: 'School supplies shopping',
      detail: 'Before the back-to-school rush',
      category: 'kids',
      priority: 'time-sensitive',
      timeEstimate: '1 hour',
      deadline: 'Early August'
    },
    {
      id: 'aug_002',
      title: 'Update school emergency cards',
      detail: 'New teacher, new contact cards needed',
      category: 'kids',
      priority: 'deadline',
      timeEstimate: '10 minutes',
      deadline: 'Before school starts'
    },
    {
      id: 'aug_003',
      title: 'Fall clothes check',
      detail: 'Kids grew all summer - what fits?',
      category: 'kids',
      priority: 'planning',
      timeEstimate: '15 minutes',
      deadline: 'End of August'
    }
  ],

  8: [ // September
    {
      id: 'sep_001',
      title: 'Holiday travel booking',
      detail: 'Prices jump in October for Thanksgiving/Christmas',
      category: 'planning',
      priority: 'time-sensitive',
      timeEstimate: '30 minutes',
      deadline: 'Mid September'
    },
    {
      id: 'sep_002',
      title: 'Winterize outdoor faucets',
      detail: 'Before first freeze prevents pipe burst',
      category: 'maintenance',
      priority: 'disaster-prevention',
      timeEstimate: '15 minutes',
      deadline: 'End of September'
    },
    {
      id: 'sep_003',
      title: 'Schedule heating service',
      detail: 'Before you need it and everyone calls',
      category: 'maintenance',
      priority: 'planning',
      timeEstimate: '5 minutes',
      deadline: 'End of September'
    }
  ],

  9: [ // October
    {
      id: 'oct_001',
      title: 'Holiday card photos', 
      detail: 'When leaves look good, before everyone books',
      category: 'planning',
      priority: 'time-sensitive',
      timeEstimate: '20 minutes to schedule',
      deadline: 'Mid October'
    },
    {
      id: 'oct_002',
      title: 'Start holiday gift list',
      detail: 'Add ideas as you see them throughout season',
      category: 'planning',
      priority: 'planning',
      timeEstimate: '5 minutes',
      deadline: 'Early October'
    },
    {
      id: 'oct_003',
      title: 'Clean gutters again',
      detail: 'After leaves fall, before winter storms',
      category: 'maintenance',
      priority: 'disaster-prevention',
      timeEstimate: '1 hour',
      deadline: 'End of October'
    }
  ],

  10: [ // November
    {
      id: 'nov_001',
      title: 'Black Friday planning',
      detail: 'Big purchases only - make list now',
      category: 'planning',
      priority: 'planning',
      timeEstimate: '10 minutes',
      deadline: 'Before Thanksgiving'
    },
    {
      id: 'nov_002',
      title: 'Year-end FSA spending',
      detail: 'Use it or lose it deadline approaching',
      category: 'admin',
      priority: 'deadline',
      timeEstimate: '10 minutes',
      deadline: 'Check your deadline'
    },
    {
      id: 'nov_003',
      title: 'Teacher holiday gifts',
      detail: 'Before December chaos hits',
      category: 'kids',
      priority: 'planning',
      timeEstimate: '15 minutes',
      deadline: 'End of November'
    }
  ],

  11: [ // December
    {
      id: 'dec_001',
      title: 'Summer camp research',
      detail: 'For January registration opening',
      category: 'kids',
      priority: 'planning',
      timeEstimate: '20 minutes',
      deadline: 'End of December'
    },
    {
      id: 'dec_002',
      title: 'Update insurance needs',
      detail: 'New year changes coming up',
      category: 'admin',
      priority: 'planning',
      timeEstimate: '15 minutes',
      deadline: 'Before year end'
    },
    {
      id: 'dec_003',
      title: 'Plan next year\'s vacation time',
      detail: 'Coordinate with partner early',
      category: 'planning',
      priority: 'planning',
      timeEstimate: '10 minutes',
      deadline: 'End of December'
    }
  ]
};

// Emergency mode tasks for overwhelmed days
export const EMERGENCY_MODE_TASKS: SeasonalTask[] = [
  {
    id: 'emergency_001',
    title: 'Kids fed and safe',
    detail: 'That\'s enough for today',
    category: 'survival',
    priority: 'emergency'
  },
  {
    id: 'emergency_002', 
    title: 'Order pizza',
    detail: 'No cooking tonight',
    category: 'survival',
    priority: 'emergency'
  },
  {
    id: 'emergency_003',
    title: 'Early bedtime for everyone',
    detail: 'Including you',
    category: 'survival',
    priority: 'emergency'
  },
  {
    id: 'emergency_004',
    title: 'Try again tomorrow',
    detail: 'Today was hard, tomorrow is fresh',
    category: 'survival',
    priority: 'emergency'
  }
];