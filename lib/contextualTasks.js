// Enhanced time-based and context-aware task suggestions
import { coreAutoTasks } from '@/constants/tasks';

export const CONTEXT_TYPES = {
  MORNING_RUSH: 'morning_rush',
  PEACEFUL_MORNING: 'peaceful_morning',
  AFTERNOON_LULL: 'afternoon_lull',
  EVENING_WIND_DOWN: 'evening_wind_down',
  WEEKEND_ENERGY: 'weekend_energy',
  SICK_DAY: 'sick_day',
  DATE_NIGHT_PREP: 'date_night_prep'
};

// Enhanced time-based task suggestions with context awareness
export function getContextualTasks(preferences = {}) {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  const { partnerName = 'your partner', childAge = '1-2y' } = preferences;

  // Determine context based on time and day
  let context = CONTEXT_TYPES.PEACEFUL_MORNING;
  
  if (hour >= 6 && hour < 9) {
    context = isWeekend ? CONTEXT_TYPES.PEACEFUL_MORNING : CONTEXT_TYPES.MORNING_RUSH;
  } else if (hour >= 9 && hour < 17) {
    context = CONTEXT_TYPES.AFTERNOON_LULL;
  } else if (hour >= 17 && hour < 21) {
    context = CONTEXT_TYPES.EVENING_WIND_DOWN;
  } else if (isWeekend && hour >= 9 && hour < 18) {
    context = CONTEXT_TYPES.WEEKEND_ENERGY;
  }

  return getTasksByContext(context, { partnerName, childAge, hour, isWeekend });
}

function getTasksByContext(context, { partnerName, childAge, hour, isWeekend }) {
  const taskSets = {
    [CONTEXT_TYPES.MORNING_RUSH]: [
      { title: `Make ${partnerName} coffee`, detail: 'Start the day right', category: 'relationship', simplicity: 'low' },
      { title: 'Pack daycare bag efficiently', detail: 'Grab essentials quickly', category: 'baby', simplicity: 'medium' },
      { title: 'Set out clothes for tomorrow', detail: 'Avoid morning decisions', category: 'household', simplicity: 'medium' }
    ],
    
    [CONTEXT_TYPES.PEACEFUL_MORNING]: [
      { title: `Ask ${partnerName} about her dreams`, detail: 'While coffee is brewing', category: 'relationship', simplicity: 'low' },
      { title: 'Extra tummy time with baby', detail: 'Unhurried bonding', category: 'baby', simplicity: 'medium' },
      { title: 'Prep a nice breakfast', detail: 'Take your time', category: 'household', simplicity: 'high' }
    ],
    
    [CONTEXT_TYPES.AFTERNOON_LULL]: [
      { title: `Send ${partnerName} encouragement text`, detail: 'Mid-day check-in', category: 'relationship', simplicity: 'low' },
      { title: 'Order diapers/supplies online', detail: 'While you\'re thinking about it', category: 'baby', simplicity: 'low' },
      { title: 'Quick kitchen reset', detail: 'Prep for dinner rush', category: 'household', simplicity: 'medium' }
    ],
    
    [CONTEXT_TYPES.EVENING_WIND_DOWN]: [
      { title: `Give ${partnerName} 30min break`, detail: 'Handle bedtime solo', category: 'relationship', simplicity: 'high' },
      { title: 'Prep bottles for tomorrow', detail: 'Morning self will thank you', category: 'baby', simplicity: 'medium' },
      { title: 'Set coffee for morning', detail: 'Small win for tomorrow', category: 'household', simplicity: 'low' }
    ],
    
    [CONTEXT_TYPES.WEEKEND_ENERGY]: [
      { title: `Plan something fun with ${partnerName}`, detail: 'Even 2 hours counts', category: 'relationship', simplicity: 'medium' },
      { title: 'Take baby to park/outside', detail: 'Fresh air for everyone', category: 'baby', simplicity: 'high' },
      { title: 'Deep clean one room', detail: 'Weekend project mode', category: 'household', simplicity: 'high' }
    ]
  };

  // Get base tasks for context
  let contextTasks = taskSets[context] || taskSets[CONTEXT_TYPES.PEACEFUL_MORNING];
  
  // Personalize with partner name
  contextTasks = contextTasks.map(task => ({
    ...task,
    title: task.title.replace(/your partner/g, partnerName),
    detail: task.detail?.replace(/your partner/g, partnerName)
  }));

  return contextTasks;
}

// Get tasks based on recent completion patterns
export function getVariedTasks(recentCompletions = [], preferences = {}) {
  const allTasks = coreAutoTasks;
  
  // Get categories from recent completions
  const recentCategories = recentCompletions.map(task => task.category);
  const categoryCount = recentCategories.reduce((acc, cat) => {
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // Prioritize under-represented categories
  const availableCategories = ['relationship', 'baby', 'household'];
  const suggestedCategories = availableCategories.sort((a, b) => {
    const aCount = categoryCount[a] || 0;
    const bCount = categoryCount[b] || 0;
    return aCount - bCount; // Lower count = higher priority
  });

  // Pick one task from each category, prioritizing variety
  const variedTasks = suggestedCategories.map(category => {
    const categoryTasks = allTasks.filter(task => task.category === category);
    // Avoid recently completed tasks
    const recentTitles = recentCompletions.map(task => task.title);
    const freshTasks = categoryTasks.filter(task => !recentTitles.includes(task.title));
    
    const availableTasks = freshTasks.length > 0 ? freshTasks : categoryTasks;
    return availableTasks[Math.floor(Math.random() * availableTasks.length)];
  }).filter(Boolean);

  return variedTasks;
}

// Get energy-appropriate tasks
export function getEnergyMatchedTasks(energyLevel = 'medium', preferences = {}) {
  const allTasks = coreAutoTasks;
  
  const energyMap = {
    low: ['low'],
    medium: ['low', 'medium'],
    high: ['low', 'medium', 'high']
  };
  
  const appropriateTasks = allTasks.filter(task => 
    energyMap[energyLevel].includes(task.simplicity)
  );
  
  // Get mix of categories
  const categories = ['relationship', 'baby', 'household'];
  const selectedTasks = categories.map(category => {
    const categoryTasks = appropriateTasks.filter(task => task.category === category);
    return categoryTasks[Math.floor(Math.random() * categoryTasks.length)];
  }).filter(Boolean);

  return selectedTasks;
}

// Smart task generation that considers multiple factors
export function generateSmartContextualTasks(preferences = {}, recentCompletions = [], userEnergyLevel = 'medium') {
  const contextualTasks = getContextualTasks(preferences);
  const variedTasks = getVariedTasks(recentCompletions, preferences);
  const energyTasks = getEnergyMatchedTasks(userEnergyLevel, preferences);
  
  // Combine and deduplicate
  const allSuggestions = [...contextualTasks, ...variedTasks, ...energyTasks];
  const uniqueTasks = allSuggestions.filter((task, index, self) => 
    index === self.findIndex(t => t.title === task.title)
  );
  
  // Return top 3 most relevant
  return uniqueTasks.slice(0, 3);
}
