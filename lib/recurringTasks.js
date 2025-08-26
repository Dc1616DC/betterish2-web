// Recurring task utilities
export const RECURRENCE_TYPES = {
  DAILY: 'daily',
  WEEKDAYS: 'weekdays', // Monday-Friday
  WEEKENDS: 'weekends', // Saturday-Sunday
  WEEKLY: 'weekly', // Same day each week
  SPECIFIC_DAYS: 'specific_days' // Custom days of week
};

export const DAYS_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
};

export const DAY_NAMES = {
  0: 'Sunday',
  1: 'Monday', 
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
};

export const DAY_ABBREVIATIONS = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue', 
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat'
};

// Check if a recurring task should be created today
export const shouldCreateToday = (recurringTask, today = new Date()) => {
  const dayOfWeek = today.getDay();
  
  switch (recurringTask.recurrenceType) {
    case RECURRENCE_TYPES.DAILY:
      return true;
      
    case RECURRENCE_TYPES.WEEKDAYS:
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday-Friday
      
    case RECURRENCE_TYPES.WEEKENDS:
      return dayOfWeek === 0 || dayOfWeek === 6; // Saturday-Sunday
      
    case RECURRENCE_TYPES.WEEKLY:
      return dayOfWeek === recurringTask.weekDay;
      
    case RECURRENCE_TYPES.SPECIFIC_DAYS:
      return recurringTask.specificDays?.includes(dayOfWeek);
      
    default:
      return false;
  }
};

// Generate description for recurrence pattern
export const getRecurrenceDescription = (recurringTask) => {
  switch (recurringTask.recurrenceType) {
    case RECURRENCE_TYPES.DAILY:
      return 'Every day';
      
    case RECURRENCE_TYPES.WEEKDAYS:
      return 'Weekdays (Mon-Fri)';
      
    case RECURRENCE_TYPES.WEEKENDS:
      return 'Weekends (Sat-Sun)';
      
    case RECURRENCE_TYPES.WEEKLY:
      return `Every ${DAY_NAMES[recurringTask.weekDay]}`;
      
    case RECURRENCE_TYPES.SPECIFIC_DAYS:
      if (!recurringTask.specificDays?.length) return 'No days selected';
      const dayNames = recurringTask.specificDays
        .sort()
        .map(day => DAY_ABBREVIATIONS[day])
        .join(', ');
      return `${dayNames}`;
      
    default:
      return 'Unknown pattern';
  }
};

// Sample recurring tasks for different dad scenarios
export const SAMPLE_RECURRING_TASKS = {
  // Daily routines
  daily: [
    {
      title: 'Make her morning coffee',
      detail: 'Start her day right',
      category: 'relationship',
      priority: 'low',
      recurrenceType: RECURRENCE_TYPES.DAILY
    },
    {
      title: 'Check diaper bag supplies',
      detail: 'Diapers, wipes, bottles',
      category: 'baby',
      priority: 'medium',
      recurrenceType: RECURRENCE_TYPES.DAILY
    }
  ],
  
  // Weekday routines
  weekdays: [
    {
      title: 'Prep daycare bottles',
      detail: 'Label and pack for tomorrow',
      category: 'baby',
      priority: 'medium',
      recurrenceType: RECURRENCE_TYPES.WEEKDAYS
    },
    {
      title: 'Check work calendar together',
      detail: 'Coordinate schedules',
      category: 'relationship',
      priority: 'low',
      recurrenceType: RECURRENCE_TYPES.WEEKDAYS
    }
  ],
  
  // Weekend routines
  weekends: [
    {
      title: 'Plan family activity',
      detail: 'Park, zoo, or stay-in fun',
      category: 'relationship',
      priority: 'medium',
      recurrenceType: RECURRENCE_TYPES.WEEKENDS
    },
    {
      title: 'Deep clean kitchen',
      detail: 'Weekly reset',
      category: 'household',
      priority: 'high',
      recurrenceType: RECURRENCE_TYPES.WEEKENDS
    }
  ],
  
  // Specific day routines
  weekly: [
    {
      title: 'Take out trash',
      detail: 'Pickup is Tuesday',
      category: 'household',
      priority: 'low',
      recurrenceType: RECURRENCE_TYPES.WEEKLY,
      weekDay: DAYS_OF_WEEK.MONDAY
    },
    {
      title: 'Grocery shopping',
      detail: 'Weekly food run',
      category: 'household',
      priority: 'high',
      recurrenceType: RECURRENCE_TYPES.WEEKLY,
      weekDay: DAYS_OF_WEEK.SATURDAY
    },
    {
      title: 'Date night planning',
      detail: 'Book sitter, plan activity',
      category: 'relationship',
      priority: 'medium',
      recurrenceType: RECURRENCE_TYPES.WEEKLY,
      weekDay: DAYS_OF_WEEK.FRIDAY
    }
  ],
  
  // Monthly maintenance tasks
  monthly: [
    {
      title: 'Test smoke detectors',
      detail: 'Check batteries and functionality',
      category: 'maintenance',
      priority: 'high',
      recurrenceType: RECURRENCE_TYPES.WEEKLY,
      weekDay: DAYS_OF_WEEK.SUNDAY,
      monthlyInterval: 1 // Every 4 weeks
    },
    {
      title: 'Check HVAC filter',
      detail: 'Replace if dirty',
      category: 'maintenance',
      priority: 'medium',
      recurrenceType: RECURRENCE_TYPES.WEEKLY,
      weekDay: DAYS_OF_WEEK.SATURDAY,
      monthlyInterval: 1
    },
    {
      title: 'Clean dryer vent',
      detail: 'Remove lint buildup',
      category: 'maintenance',
      priority: 'high',
      recurrenceType: RECURRENCE_TYPES.WEEKLY,
      weekDay: DAYS_OF_WEEK.SUNDAY,
      monthlyInterval: 3 // Every 3 months
    }
  ],
  
  // Health & appointment reminders
  health: [
    {
      title: 'Schedule dentist cleanings',
      detail: 'Family checkups every 6 months',
      category: 'health',
      priority: 'medium',
      recurrenceType: RECURRENCE_TYPES.WEEKLY,
      weekDay: DAYS_OF_WEEK.MONDAY,
      monthlyInterval: 6 // Every 6 months
    },
    {
      title: 'Annual physical reminder',
      detail: 'Book for you and partner',
      category: 'health', 
      priority: 'medium',
      recurrenceType: RECURRENCE_TYPES.WEEKLY,
      weekDay: DAYS_OF_WEEK.FRIDAY,
      monthlyInterval: 12 // Once per year
    },
    {
      title: 'Kids wellness checkup',
      detail: 'Pediatrician visit',
      category: 'health',
      priority: 'high',
      recurrenceType: RECURRENCE_TYPES.WEEKLY,
      weekDay: DAYS_OF_WEEK.TUESDAY,
      monthlyInterval: 6 // Every 6 months for young kids
    }
  ],
  
  // Seasonal tasks
  seasonal: [
    {
      title: 'Winterize outdoor faucets',
      detail: 'Prevent pipe freeze',
      category: 'maintenance',
      priority: 'high',
      recurrenceType: RECURRENCE_TYPES.WEEKLY,
      weekDay: DAYS_OF_WEEK.SATURDAY,
      seasonalTiming: 'fall'
    },
    {
      title: 'Schedule HVAC service',
      detail: 'Before heating/cooling season',
      category: 'maintenance',
      priority: 'medium',
      recurrenceType: RECURRENCE_TYPES.WEEKLY,
      weekDay: DAYS_OF_WEEK.SUNDAY,
      seasonalTiming: 'spring_fall'
    },
    {
      title: 'Inspect roof and gutters',
      detail: 'Check for winter damage',
      category: 'maintenance',
      priority: 'high',
      recurrenceType: RECURRENCE_TYPES.WEEKLY,
      weekDay: DAYS_OF_WEEK.SATURDAY,
      seasonalTiming: 'spring'
    }
  ]
};
