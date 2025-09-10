/**
 * Contextual Task Generation Engine
 * Creates highly personalized task suggestions based on user profile, patterns, and context
 */

import { getAIContext } from './patternTracking';

/**
 * Main function to generate personalized tasks for a specific user
 */
export async function generatePersonalizedTasks(userId, category, userProfile, currentTasks = []) {
  // Get user's behavioral patterns
  let patterns = null;
  try {
    patterns = await getAIContext(userId);
  } catch (error) {
    console.error('Error fetching patterns:', error);
  }

  // Get current context
  const context = getCurrentContext();
  
  // Generate base tasks for the category
  let tasks = getBaseTasks(category, userProfile, context);
  
  // Apply personalization layers
  tasks = applyProfilePersonalization(tasks, userProfile);
  tasks = applyPatternPersonalization(tasks, patterns);
  tasks = applyContextualPersonalization(tasks, context, userProfile);
  tasks = filterExistingTasks(tasks, currentTasks);
  
  // Score and rank tasks
  tasks = rankTasksByRelevance(tasks, userProfile, patterns, context);
  
  return tasks.slice(0, 10); // Return top 10 most relevant
}

/**
 * Get current temporal and environmental context
 */
function getCurrentContext() {
  const now = new Date();
  const month = now.getMonth();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isEvening = hour >= 17 && hour <= 22;
  const isMorning = hour >= 6 && hour <= 9;
  
  return {
    month,
    season: getSeason(month),
    dayOfWeek,
    hour,
    isWeekend,
    isEvening,
    isMorning,
    timeOfDay: getTimeOfDay(hour),
    energyLevel: getEnergyLevel(hour, isWeekend)
  };
}

/**
 * Generate base tasks for a category
 */
function getBaseTasks(category, userProfile, context) {
  const tasks = [];
  
  switch(category) {
    case 'seasonal':
      tasks.push(...getSeasonalTasks(context.season, context.month, userProfile));
      break;
    case 'quick-wins':
      tasks.push(...getQuickWinTasks(context.timeOfDay, userProfile));
      break;
    case 'personal':
      tasks.push(...getPersonalTasks(userProfile, context));
      break;
    case 'household':
      tasks.push(...getHouseholdTasks(userProfile, context));
      break;
    case 'kids':
      tasks.push(...getKidsTasks(userProfile, context));
      break;
    case 'relationships':
      tasks.push(...getRelationshipTasks(userProfile, context));
      break;
    case 'projects':
      tasks.push(...getProjectTasks(userProfile, context));
      break;
    case 'prevention':
      tasks.push(...getPreventionTasks(userProfile, context));
      break;
  }
  
  return tasks;
}

/**
 * Get seasonal tasks based on location and time of year
 */
function getSeasonalTasks(season, month, profile) {
  const tasks = [];
  const state = profile?.state;
  const isHomeowner = profile?.homeOwnership === 'own';
  const hasKids = profile?.kidsCount > 0;
  
  // Regional seasonal tasks
  const regionalTasks = getRegionalSeasonalTasks(state, season, month);
  tasks.push(...regionalTasks);
  
  // Homeowner-specific seasonal tasks
  if (isHomeowner) {
    if (season === 'fall') {
      tasks.push(
        { title: 'Clean gutters before winter', description: 'Prevent ice dams and water damage', category: 'maintenance', priority: 'high', timeEstimate: '2 hours', isHomeownerOnly: true },
        { title: 'Winterize outdoor faucets', description: 'Prevent frozen pipes', category: 'maintenance', priority: 'high', timeEstimate: '30 minutes', isHomeownerOnly: true },
        { title: 'Schedule furnace inspection', description: 'Ensure heating ready for winter', category: 'maintenance', priority: 'medium', timeEstimate: '10 minutes to schedule', isHomeownerOnly: true }
      );
    } else if (season === 'spring') {
      tasks.push(
        { title: 'Schedule AC service', description: 'Before the first heat wave', category: 'maintenance', priority: 'medium', timeEstimate: '10 minutes to schedule', isHomeownerOnly: true },
        { title: 'Check roof for winter damage', description: 'Catch problems early', category: 'maintenance', priority: 'medium', timeEstimate: '30 minutes', isHomeownerOnly: true }
      );
    }
  }
  
  // Kid-specific seasonal tasks
  if (hasKids) {
    const kidAges = profile.kidsAges || [];
    const hasSchoolAge = kidAges.some(age => age >= 5 && age <= 18);
    
    if (month === 7 || month === 8) { // July/August
      if (hasSchoolAge) {
        tasks.push(
          { title: 'Shop for school supplies', description: 'Beat the back-to-school rush', category: 'baby', priority: 'high', timeEstimate: '1 hour' },
          { title: 'Schedule back-to-school checkups', description: 'Sports physicals, dental, vision', category: 'baby', priority: 'high', timeEstimate: '20 minutes' }
        );
      }
    }
    
    if (month === 9 || month === 10) { // Sept/Oct
      tasks.push(
        { title: 'Plan Halloween costumes', description: 'Before the good ones sell out', category: 'baby', priority: 'medium', timeEstimate: '30 minutes' }
      );
    }
  }
  
  return tasks;
}

/**
 * Get regional seasonal tasks based on state
 */
function getRegionalSeasonalTasks(state, season, month) {
  const tasks = [];
  
  // Southern states (hurricane season)
  const hurricaneStates = ['FL', 'TX', 'LA', 'MS', 'AL', 'GA', 'SC', 'NC'];
  if (hurricaneStates.includes(state) && month >= 5 && month <= 10) {
    tasks.push(
      { title: 'Check hurricane supplies', description: 'Water, batteries, first aid', category: 'household', priority: 'high', timeEstimate: '30 minutes', isRegional: true },
      { title: 'Review evacuation plan', description: 'Know your routes and zones', category: 'household', priority: 'medium', timeEstimate: '15 minutes', isRegional: true }
    );
  }
  
  // Northern states (winter prep)
  const snowStates = ['ME', 'NH', 'VT', 'NY', 'MA', 'CT', 'RI', 'PA', 'MI', 'WI', 'MN', 'ND', 'SD', 'MT', 'ID', 'WY', 'CO', 'UT'];
  if (snowStates.includes(state)) {
    if (month === 9 || month === 10) {
      tasks.push(
        { title: 'Schedule snow removal service', description: 'They book up fast', category: 'maintenance', priority: 'high', timeEstimate: '20 minutes', isRegional: true },
        { title: 'Stock ice melt and sand', description: 'Before the first storm', category: 'household', priority: 'medium', timeEstimate: '30 minutes', isRegional: true }
      );
    }
  }
  
  // Western states (wildfire season)
  const wildfireStates = ['CA', 'OR', 'WA', 'NV', 'AZ', 'NM', 'CO', 'UT', 'ID', 'MT', 'WY'];
  if (wildfireStates.includes(state) && month >= 5 && month <= 10) {
    tasks.push(
      { title: 'Create defensible space', description: 'Clear brush around home', category: 'maintenance', priority: 'high', timeEstimate: '2 hours', isRegional: true },
      { title: 'Pack go-bag for evacuations', description: 'Documents, meds, essentials', category: 'household', priority: 'high', timeEstimate: '45 minutes', isRegional: true }
    );
  }
  
  return tasks;
}

/**
 * Get kid-specific tasks based on ages
 */
function getKidsTasks(profile, context) {
  const tasks = [];
  
  if (!profile?.kidsCount || profile.kidsCount === 0) {
    return tasks;
  }
  
  const kidsAges = profile.kidsAges || [];
  
  kidsAges.forEach((age, index) => {
    const ageNum = parseInt(age);
    const kidLabel = profile.kidsCount > 1 ? `Kid ${index + 1}` : 'Your child';
    
    // Baby/Toddler (0-3)
    if (ageNum <= 3) {
      // Time-specific baby tasks
      if (context.isEvening) {
        tasks.push(
          { title: `Prep ${kidLabel}'s bottles for tonight`, description: 'Set up for night feeds', category: 'baby', priority: 'high', timeEstimate: '10 minutes', ageSpecific: ageNum }
        );
      }
      if (context.isMorning) {
        tasks.push(
          { title: `Pack diaper bag for ${kidLabel}`, description: 'Ready for today\'s outings', category: 'baby', priority: 'medium', timeEstimate: '5 minutes', ageSpecific: ageNum }
        );
      }
      
      // Age-milestone tasks
      if (ageNum === 1) {
        tasks.push(
          { title: 'Schedule 12-month checkup', description: 'Important developmental milestone', category: 'baby', priority: 'high', timeEstimate: '10 minutes', ageSpecific: ageNum }
        );
      } else if (ageNum === 2) {
        tasks.push(
          { title: 'Research preschools', description: 'Good ones have 6+ month waitlists', category: 'baby', priority: 'medium', timeEstimate: '30 minutes', ageSpecific: ageNum }
        );
      }
    }
    
    // Preschool (4-5)
    else if (ageNum <= 5) {
      if (context.isEvening) {
        tasks.push(
          { title: `Read with ${kidLabel}`, description: '15 minutes of connection', category: 'baby', priority: 'high', timeEstimate: '15 minutes', ageSpecific: ageNum }
        );
      }
      tasks.push(
        { title: `Plan ${kidLabel}'s playdate`, description: 'Social skills development', category: 'baby', priority: 'medium', timeEstimate: '10 minutes', ageSpecific: ageNum }
      );
    }
    
    // School age (6-12)
    else if (ageNum <= 12) {
      if (context.dayOfWeek >= 1 && context.dayOfWeek <= 5 && context.isEvening) {
        tasks.push(
          { title: `Check ${kidLabel}'s homework`, description: 'Stay involved in their education', category: 'baby', priority: 'high', timeEstimate: '15 minutes', ageSpecific: ageNum },
          { title: `Ask ${kidLabel} about their day`, description: 'Build communication habits now', category: 'baby', priority: 'high', timeEstimate: '10 minutes', ageSpecific: ageNum }
        );
      }
      if (context.isWeekend) {
        tasks.push(
          { title: `Plan weekend activity with ${kidLabel}`, description: 'Make memories together', category: 'baby', priority: 'medium', timeEstimate: '20 minutes', ageSpecific: ageNum }
        );
      }
    }
    
    // Teen (13-18)
    else if (ageNum <= 18) {
      tasks.push(
        { title: `Check in with ${kidLabel}`, description: 'Teen years need connection too', category: 'baby', priority: 'high', timeEstimate: '10 minutes', ageSpecific: ageNum }
      );
      
      if (ageNum >= 15) {
        tasks.push(
          { title: 'Discuss driving plans', description: 'Permits, lessons, insurance', category: 'baby', priority: 'medium', timeEstimate: '20 minutes', ageSpecific: ageNum }
        );
      }
      if (ageNum >= 16) {
        tasks.push(
          { title: 'Review college savings', description: `Time is running out for ${kidLabel}`, category: 'personal', priority: 'high', timeEstimate: '30 minutes', ageSpecific: ageNum }
        );
      }
    }
  });
  
  return tasks;
}

/**
 * Get household tasks based on living situation
 */
function getHouseholdTasks(profile, context) {
  const tasks = [];
  const isHomeowner = profile?.homeOwnership === 'own';
  
  // Time-of-day specific
  if (context.isMorning) {
    tasks.push(
      { title: 'Make your bed', description: 'Start the day with a win', category: 'household', priority: 'low', timeEstimate: '2 minutes' }
    );
  }
  
  if (context.isEvening) {
    tasks.push(
      { title: 'Prep coffee for tomorrow', description: 'Future you will thank you', category: 'household', priority: 'low', timeEstimate: '2 minutes' },
      { title: '10-minute tidy', description: 'Reset main living areas', category: 'household', priority: 'medium', timeEstimate: '10 minutes' }
    );
  }
  
  // Weekend tasks
  if (context.isWeekend) {
    if (isHomeowner) {
      tasks.push(
        { title: 'Mow the lawn', description: 'Before it gets too long', category: 'household', priority: 'medium', timeEstimate: '45 minutes', isHomeownerOnly: true },
        { title: 'Check for home repairs', description: 'Walk through and make a list', category: 'maintenance', priority: 'low', timeEstimate: '20 minutes', isHomeownerOnly: true }
      );
    } else {
      tasks.push(
        { title: 'Deep clean one room', description: 'Rotate through apartment weekly', category: 'household', priority: 'medium', timeEstimate: '30 minutes' }
      );
    }
  }
  
  // Day-specific tasks
  const dayTasks = {
    0: [ // Sunday
      { title: 'Meal prep for the week', description: 'Save time on busy weekdays', category: 'household', priority: 'medium', timeEstimate: '1 hour' }
    ],
    1: [ // Monday
      { title: 'Take out trash', description: 'Start the week fresh', category: 'household', priority: 'medium', timeEstimate: '5 minutes' }
    ],
    5: [ // Friday
      { title: 'Clean out fridge', description: 'Before weekend shopping', category: 'household', priority: 'low', timeEstimate: '10 minutes' }
    ],
    6: [ // Saturday
      { title: 'Change bed sheets', description: 'Fresh sheets for the weekend', category: 'household', priority: 'medium', timeEstimate: '10 minutes' }
    ]
  };
  
  if (dayTasks[context.dayOfWeek]) {
    tasks.push(...dayTasks[context.dayOfWeek]);
  }
  
  return tasks;
}

/**
 * Get relationship tasks personalized with spouse name
 */
function getRelationshipTasks(profile, context) {
  const tasks = [];
  const spouseName = profile?.spouseName;
  const hasPartner = !!spouseName;
  
  if (hasPartner) {
    // Personalized with spouse name
    if (context.isEvening) {
      tasks.push(
        { title: `Ask ${spouseName} about their day`, description: 'Show genuine interest', category: 'relationship', priority: 'high', timeEstimate: '10 minutes' }
      );
    }
    
    if (context.dayOfWeek === 5) { // Friday
      tasks.push(
        { title: `Plan weekend with ${spouseName}`, description: 'Coordinate schedules and fun', category: 'relationship', priority: 'medium', timeEstimate: '15 minutes' }
      );
    }
    
    if (context.isWeekend) {
      tasks.push(
        { title: `Date activity with ${spouseName}`, description: 'Even 30 minutes counts', category: 'relationship', priority: 'high', timeEstimate: '30 minutes' }
      );
    }
    
    // Random acts of love
    tasks.push(
      { title: `Surprise ${spouseName} with their favorite`, description: 'Coffee, snack, or note', category: 'relationship', priority: 'low', timeEstimate: '5 minutes' },
      { title: `Thank ${spouseName} for something specific`, description: 'Appreciation matters', category: 'relationship', priority: 'medium', timeEstimate: '2 minutes' }
    );
  } else {
    // Generic relationship tasks
    tasks.push(
      { title: 'Text an old friend', description: 'Maintain connections', category: 'relationship', priority: 'low', timeEstimate: '5 minutes' },
      { title: 'Call family member', description: 'They miss hearing from you', category: 'relationship', priority: 'medium', timeEstimate: '15 minutes' }
    );
  }
  
  return tasks;
}

/**
 * Get quick win tasks based on time of day
 */
function getQuickWinTasks(timeOfDay, profile) {
  const tasks = [];
  
  const quickWins = {
    morning: [
      { title: 'Drink a full glass of water', description: 'Start hydrated', category: 'personal', priority: 'low', timeEstimate: '1 minute' },
      { title: 'Write 3 priorities for today', description: 'Focus your energy', category: 'personal', priority: 'medium', timeEstimate: '3 minutes' }
    ],
    afternoon: [
      { title: 'Take a 5-minute walk', description: 'Reset your energy', category: 'personal', priority: 'low', timeEstimate: '5 minutes' },
      { title: 'Clear your desk', description: 'Fresh space, fresh mind', category: 'household', priority: 'low', timeEstimate: '3 minutes' }
    ],
    evening: [
      { title: 'Set out tomorrow\'s clothes', description: 'Smoother morning', category: 'personal', priority: 'low', timeEstimate: '2 minutes' },
      { title: 'Charge all devices', description: 'Ready for tomorrow', category: 'household', priority: 'low', timeEstimate: '1 minute' }
    ],
    night: [
      { title: 'Brain dump tomorrow\'s tasks', description: 'Sleep better', category: 'personal', priority: 'low', timeEstimate: '5 minutes' },
      { title: 'Set coffee timer', description: 'Wake up to fresh coffee', category: 'household', priority: 'low', timeEstimate: '1 minute' }
    ]
  };
  
  tasks.push(...(quickWins[timeOfDay] || quickWins.afternoon));
  
  // Universal quick wins
  tasks.push(
    { title: 'Delete 10 photos', description: 'Free up phone space', category: 'personal', priority: 'low', timeEstimate: '2 minutes' },
    { title: 'Unsubscribe from 1 email', description: 'Reduce inbox noise', category: 'personal', priority: 'low', timeEstimate: '1 minute' },
    { title: 'Text someone thanks', description: 'Spread gratitude', category: 'relationship', priority: 'low', timeEstimate: '2 minutes' }
  );
  
  return tasks;
}

/**
 * Get personal care tasks
 */
function getPersonalTasks(profile, context) {
  const tasks = [];
  const hasKids = profile?.kidsCount > 0;
  
  // Parent-specific self-care
  if (hasKids) {
    if (context.isEvening) {
      tasks.push(
        { title: 'Take 10 minutes for yourself', description: 'After kids are in bed', category: 'personal', priority: 'high', timeEstimate: '10 minutes' }
      );
    }
    tasks.push(
      { title: 'Schedule your own checkup', description: 'Parents need care too', category: 'personal', priority: 'medium', timeEstimate: '10 minutes' }
    );
  }
  
  // Time-based personal tasks
  if (context.energyLevel === 'high') {
    tasks.push(
      { title: 'Tackle hardest task first', description: 'Use peak energy wisely', category: 'personal', priority: 'high', timeEstimate: '30 minutes' }
    );
  } else if (context.energyLevel === 'low') {
    tasks.push(
      { title: 'Do easy wins only', description: 'Match tasks to energy', category: 'personal', priority: 'medium', timeEstimate: '10 minutes' }
    );
  }
  
  // Always include some general personal tasks
  tasks.push(
    { title: 'Drink a full glass of water', description: 'Stay hydrated', category: 'personal', priority: 'low', timeEstimate: '1 minute' },
    { title: 'Take 10 deep breaths', description: 'Reset your nervous system', category: 'personal', priority: 'low', timeEstimate: '2 minutes' },
    { title: 'Schedule doctor checkup', description: 'When did you last go?', category: 'personal', priority: 'medium', timeEstimate: '5 minutes' },
    { title: 'Update LinkedIn profile', description: 'Keep career options open', category: 'personal', priority: 'low', timeEstimate: '15 minutes' },
    { title: 'Listen to 1 podcast episode', description: 'Learn something new', category: 'personal', priority: 'low', timeEstimate: '30 minutes' },
    { title: 'Read for 15 minutes', description: 'Expand your knowledge', category: 'personal', priority: 'low', timeEstimate: '15 minutes' },
    { title: 'Stretch for 5 minutes', description: 'Relieve tension', category: 'personal', priority: 'low', timeEstimate: '5 minutes' },
    { title: 'Review weekly goals', description: 'Stay on track', category: 'personal', priority: 'medium', timeEstimate: '10 minutes' },
    { title: 'Call a friend', description: 'Maintain connections', category: 'personal', priority: 'medium', timeEstimate: '15 minutes' },
    { title: 'Plan tomorrow', description: 'Set yourself up for success', category: 'personal', priority: 'medium', timeEstimate: '10 minutes' }
  );
  
  return tasks;
}

/**
 * Get home project tasks
 */
function getProjectTasks(profile, context) {
  const tasks = [];
  const isHomeowner = profile?.homeOwnership === 'own';
  
  if (context.isWeekend && context.energyLevel === 'high') {
    if (isHomeowner) {
      tasks.push(
        { title: 'Start one house project', description: 'Pick from your list and begin', category: 'home_projects', priority: 'medium', timeEstimate: '2 hours', isProject: true },
        { title: 'Fix one annoying thing', description: 'That drawer, squeak, or drip', category: 'home_projects', priority: 'medium', timeEstimate: '30 minutes' }
      );
    } else {
      tasks.push(
        { title: 'Rearrange one room', description: 'Fresh perspective, no cost', category: 'home_projects', priority: 'low', timeEstimate: '1 hour' },
        { title: 'Deep organize one closet', description: 'Donate what you don\'t use', category: 'home_projects', priority: 'medium', timeEstimate: '45 minutes' }
      );
    }
  }
  
  return tasks;
}

/**
 * Get prevention/maintenance tasks
 */
function getPreventionTasks(profile, context) {
  const tasks = [];
  const isHomeowner = profile?.homeOwnership === 'own';
  const month = context.month;
  
  // Monthly prevention tasks
  const monthlyTasks = {
    0: [ // January
      { title: 'Review insurance policies', description: 'New year, check coverage', category: 'personal', priority: 'medium', timeEstimate: '30 minutes', prevents: 'Underinsurance' }
    ],
    3: [ // April  
      { title: 'Check tax documents', description: 'Before deadline panic', category: 'personal', priority: 'high', timeEstimate: '45 minutes', prevents: 'Tax penalties' }
    ],
    5: [ // June
      { title: 'Test smoke detectors', description: 'Replace batteries if needed', category: 'household', priority: 'high', timeEstimate: '10 minutes', prevents: 'Fire danger' }
    ],
    9: [ // October
      { title: 'Flu shots for family', description: 'Before flu season peaks', category: 'health', priority: 'high', timeEstimate: '45 minutes', prevents: 'Flu outbreak' }
    ]
  };
  
  if (monthlyTasks[month]) {
    tasks.push(...monthlyTasks[month]);
  }
  
  // Always include general prevention tasks
  tasks.push(
    { title: 'Check tire pressure', description: 'Prevents uneven wear', category: 'personal', priority: 'medium', timeEstimate: '10 minutes', prevents: 'Expensive tire replacement' },
    { title: 'Clean dryer vent', description: 'Fire prevention', category: 'household', priority: 'high', timeEstimate: '15 minutes', prevents: 'House fires' },
    { title: 'Update important passwords', description: 'Security maintenance', category: 'personal', priority: 'medium', timeEstimate: '15 minutes', prevents: 'Identity theft' },
    { title: 'Back up phone photos', description: 'Protect memories', category: 'personal', priority: 'medium', timeEstimate: '10 minutes', prevents: 'Lost memories' },
    { title: 'Schedule car maintenance', description: 'Keep vehicle healthy', category: 'personal', priority: 'medium', timeEstimate: '5 minutes', prevents: 'Expensive repairs' },
    { title: 'Check water heater', description: 'Look for rust or leaks', category: 'maintenance', priority: 'medium', timeEstimate: '2 minutes', prevents: 'Flooding disaster' },
    { title: 'Review subscriptions', description: 'Cancel unused services', category: 'personal', priority: 'low', timeEstimate: '15 minutes', prevents: 'Wasted money' },
    { title: 'Check credit report', description: 'Spot issues early', category: 'personal', priority: 'medium', timeEstimate: '20 minutes', prevents: 'Credit problems' }
  );
  
  // Homeowner prevention
  if (isHomeowner) {
    tasks.push(
      { title: 'Check HVAC filter', description: 'Monthly = better air & efficiency', category: 'maintenance', priority: 'medium', timeEstimate: '5 minutes', prevents: 'System failure' },
      { title: 'Inspect roof shingles', description: 'Catch damage early', category: 'maintenance', priority: 'medium', timeEstimate: '15 minutes', prevents: 'Water damage' },
      { title: 'Test sump pump', description: 'Before rainy season', category: 'maintenance', priority: 'high', timeEstimate: '5 minutes', prevents: 'Basement flooding' }
    );
  }
  
  return tasks;
}

/**
 * Apply profile-based personalization
 */
function applyProfilePersonalization(tasks, profile) {
  if (!profile) return tasks;
  
  return tasks.map(task => {
    // Add context about why this task matters to them
    if (task.isHomeownerOnly && profile.homeOwnership === 'own') {
      task.relevance = 'homeowner';
      task.personalNote = 'Important for protecting your investment';
    }
    
    if (task.ageSpecific !== undefined) {
      task.relevance = 'parent';
      task.personalNote = `Relevant for your ${task.ageSpecific} year old`;
    }
    
    if (task.isRegional) {
      task.relevance = 'location';
      task.personalNote = `Important for ${profile.state} residents`;
    }
    
    // Boost priority for user's concern areas
    if (profile.primaryConcerns?.includes(task.category)) {
      task.priority = task.priority === 'low' ? 'medium' : 'high';
      task.relevance = 'priority-area';
      task.personalNote = 'This is one of your priority areas';
    }
    
    return task;
  });
}

/**
 * Apply pattern-based personalization
 */
function applyPatternPersonalization(tasks, patterns) {
  if (!patterns) return tasks;
  
  return tasks.map(task => {
    // Boost neglected categories
    if (patterns.neglectedCategories?.includes(task.category)) {
      task.priority = 'high';
      task.personalNote = `You haven't done ${task.category} tasks recently`;
    }
    
    // Adjust for productive times
    if (patterns.isProductive) {
      // Suggest harder tasks during productive times
      if (task.timeEstimate && task.timeEstimate.includes('hour')) {
        task.priority = task.priority === 'low' ? 'medium' : task.priority;
        task.personalNote = 'Good time for bigger tasks';
      }
    } else if (patterns.isOverwhelmed) {
      // Only suggest essential/quick tasks when overwhelmed
      if (task.timeEstimate && !task.timeEstimate.includes('minute')) {
        task.priority = 'low';
        task.personalNote = 'Save this for when you have more energy';
      }
    }
    
    return task;
  });
}

/**
 * Apply contextual personalization
 */
function applyContextualPersonalization(tasks, context, profile) {
  return tasks.map(task => {
    // Adjust for energy levels
    if (context.energyLevel === 'low' && task.timeEstimate?.includes('hour')) {
      task.priority = 'low';
      task.timing = 'save-for-later';
    } else if (context.energyLevel === 'high' && task.priority === 'high') {
      task.timing = 'do-now';
      task.personalNote = 'You have energy - tackle this now';
    }
    
    // Weekend vs weekday adjustments
    if (!context.isWeekend && task.timeEstimate?.includes('hour')) {
      task.timing = 'weekend';
      task.personalNote = 'Better for the weekend';
    }
    
    return task;
  });
}

/**
 * Filter out tasks user already has
 */
function filterExistingTasks(suggestedTasks, currentTasks) {
  const currentTitles = currentTasks.map(t => t.title?.toLowerCase());
  
  return suggestedTasks.filter(task => {
    const taskTitle = task.title.toLowerCase();
    // Check if task or similar already exists
    return !currentTitles.some(current => 
      current.includes(taskTitle.slice(0, 10)) || 
      taskTitle.includes(current.slice(0, 10))
    );
  });
}

/**
 * Rank tasks by relevance score
 */
function rankTasksByRelevance(tasks, profile, patterns, context) {
  return tasks.map(task => {
    let score = 0;
    
    // Priority scoring
    score += task.priority === 'high' ? 30 : task.priority === 'medium' ? 20 : 10;
    
    // Relevance scoring
    if (task.relevance === 'priority-area') score += 25;
    if (task.relevance === 'parent' && profile?.kidsCount > 0) score += 20;
    if (task.relevance === 'homeowner' && profile?.homeOwnership === 'own') score += 15;
    if (task.relevance === 'location') score += 15;
    
    // Pattern scoring
    if (patterns?.neglectedCategories?.includes(task.category)) score += 20;
    if (patterns?.favoriteCategories?.includes(task.category)) score += 10;
    
    // Timing scoring
    if (task.timing === 'do-now') score += 15;
    if (task.timing === 'save-for-later') score -= 10;
    if (task.timing === 'weekend' && !context.isWeekend) score -= 15;
    
    // Prevention scoring
    if (task.prevents) score += 15;
    
    // Seasonal urgency
    if (task.isSeasonal) score += 10;
    
    task.relevanceScore = score;
    return task;
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Helper: Get season from month
 */
function getSeason(month) {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

/**
 * Helper: Get time of day label
 */
function getTimeOfDay(hour) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Helper: Estimate energy level
 */
function getEnergyLevel(hour, isWeekend) {
  if (isWeekend && hour >= 9 && hour <= 11) return 'high';
  if (!isWeekend && hour >= 9 && hour <= 11) return 'medium';
  if (hour >= 14 && hour <= 16) return 'low'; // Post-lunch dip
  if (hour >= 19 && hour <= 21) return 'low'; // Evening wind-down
  if (hour >= 8 && hour <= 10) return 'high';
  return 'medium';
}

export default {
  generatePersonalizedTasks,
  getCurrentContext
};