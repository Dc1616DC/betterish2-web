// constants/tasks.js

// ✅ Core Autopopulated Tasks (used in Dashboard and Browse)
export const coreAutoTasks = [
  // RELATIONSHIP (20)
  { id: 'rel_001', title: 'Ask how her day was', detail: 'Before launching into yours', category: 'relationship', simplicity: 'low' },
  { id: 'rel_002', title: 'Put your phone away at dinner', detail: 'Just for 20 minutes', category: 'relationship', simplicity: 'low' },
  { id: 'rel_003', title: 'Text her something appreciative', detail: 'Make it specific', category: 'relationship', simplicity: 'low' },
  { id: 'rel_004', title: 'Clean up after dinner', detail: 'Without being asked', category: 'relationship', simplicity: 'medium' },
  { id: 'rel_005', title: 'Plan something together', detail: 'Even if it’s small', category: 'relationship', simplicity: 'medium' },
  { id: 'rel_006', title: 'Offer her 30 minutes alone', detail: 'Handle baby solo', category: 'relationship', simplicity: 'medium' },
  { id: 'rel_007', title: 'Say thank you for something', detail: 'Not sarcastic', category: 'relationship', simplicity: 'low' },
  { id: 'rel_008', title: 'Bring her a snack or drink', detail: 'Small gesture, big impact', category: 'relationship', simplicity: 'low' },
  { id: 'rel_009', title: 'Sit and talk for 5 mins', detail: 'No screens', category: 'relationship', simplicity: 'low' },
  { id: 'rel_010', title: 'Give her a real compliment', detail: 'Something meaningful', category: 'relationship', simplicity: 'low' },
  { id: 'rel_011', title: 'Handle bedtime solo', detail: 'Let her rest', category: 'relationship', simplicity: 'high' },
  { id: 'rel_012', title: 'Prep her morning coffee', detail: 'Exactly how she likes it', category: 'relationship', simplicity: 'low' },
  { id: 'rel_013', title: 'Schedule a date night', detail: 'Even if it’s just takeout', category: 'relationship', simplicity: 'medium' },
  { id: 'rel_014', title: 'Tell her one thing she’s great at', detail: 'From the heart', category: 'relationship', simplicity: 'low' },
  { id: 'rel_015', title: 'Do something on her mental list', detail: 'Without asking', category: 'relationship', simplicity: 'medium' },
  { id: 'rel_016', title: 'Surprise her with a break', detail: 'No strings', category: 'relationship', simplicity: 'medium' },
  { id: 'rel_017', title: 'Rub her back or shoulders', detail: '2–3 minutes', category: 'relationship', simplicity: 'low' },
  { id: 'rel_018', title: 'Check in about her stress level', detail: 'Just ask and listen', category: 'relationship', simplicity: 'low' },
  { id: 'rel_019', title: 'Share something funny from your day', detail: 'Laughter helps', category: 'relationship', simplicity: 'low' },
  { id: 'rel_020', title: 'Take over baby duty without asking', detail: 'She’ll notice', category: 'relationship', simplicity: 'medium' },

  // BABY (20)
  { id: 'baby_001', title: 'Wash bottles/pump parts', detail: 'For tomorrow', category: 'baby', simplicity: 'medium' },
  { id: 'baby_002', title: 'Refill wipes and diapers', detail: 'Check every bag and room', category: 'baby', simplicity: 'medium' },
  { id: 'baby_003', title: 'Label and prep daycare bottles', detail: 'Tonight not tomorrow', category: 'baby', simplicity: 'medium' },
  { id: 'baby_004', title: 'Wipe down high chair or toys', detail: 'Quick clean', category: 'baby', simplicity: 'medium' },
  { id: 'baby_005', title: 'Trim baby’s nails', detail: 'Best when they’re sleepy', category: 'baby', simplicity: 'medium' },
  { id: 'baby_006', title: 'Restock medicine cabinet', detail: 'Check infant Tylenol, etc.', category: 'baby', simplicity: 'medium' },
  { id: 'baby_007', title: 'Pack a spare outfit', detail: 'For diaper bag or car', category: 'baby', simplicity: 'low' },
  { id: 'baby_008', title: 'Check next pediatrician visit', detail: 'Schedule if needed', category: 'baby', simplicity: 'low' },
  { id: 'baby_009', title: 'Read a book to baby', detail: 'Same one is fine', category: 'baby', simplicity: 'low' },
  { id: 'baby_010', title: 'Sanitize pacifiers or teethers', detail: 'Boil or rinse', category: 'baby', simplicity: 'medium' },
  { id: 'baby_011', title: 'Update daycare info', detail: 'New nap, food, meds?', category: 'baby', simplicity: 'low' },
  { id: 'baby_012', title: 'Take baby outside', detail: '5–10 min fresh air', category: 'baby', simplicity: 'medium' },
  { id: 'baby_013', title: 'Start bedtime routine early', detail: 'Avoid the crash', category: 'baby', simplicity: 'medium' },
  { id: 'baby_014', title: 'Disinfect changing area', detail: 'Quick wipe down', category: 'baby', simplicity: 'medium' },
  { id: 'baby_015', title: 'Prep next size clothes', detail: 'Baby grows fast', category: 'baby', simplicity: 'high' },
  { id: 'baby_016', title: 'Take photos or videos', detail: 'Memory time', category: 'baby', simplicity: 'low' },
  { id: 'baby_017', title: 'Organize toys', detail: 'Clear a space', category: 'baby', simplicity: 'medium' },
  { id: 'baby_018', title: 'Make a backup daycare kit', detail: 'Leave in car or bag', category: 'baby', simplicity: 'high' },
  { id: 'baby_019', title: 'Make a batch of puree/snacks', detail: 'Freeze or store', category: 'baby', simplicity: 'high' },
  { id: 'baby_020', title: 'Rotate toys or books', detail: 'Freshens engagement', category: 'baby', simplicity: 'medium' },

  // HOUSEHOLD (20)
  { id: 'house_001', title: 'Start the dishwasher', detail: 'Before bed', category: 'household', simplicity: 'low' },
  { id: 'house_002', title: 'Wipe kitchen counters', detail: '2-minute reset', category: 'household', simplicity: 'low' },
  { id: 'house_003', title: 'Take out the trash', detail: 'Check all bins', category: 'household', simplicity: 'low' },
  { id: 'house_004', title: 'Change the bed sheets', detail: 'Fresh start', category: 'household', simplicity: 'high' },
  { id: 'house_005', title: 'Run a load of laundry', detail: 'Just start it', category: 'household', simplicity: 'medium' },
  { id: 'house_006', title: 'Tidy main living area', detail: '5 minute reset', category: 'household', simplicity: 'medium' },
  { id: 'house_007', title: 'Wipe down bathroom sink', detail: 'Quick clean', category: 'household', simplicity: 'low' },
  { id: 'house_008', title: 'Restock paper goods', detail: 'Toilet paper, tissues', category: 'household', simplicity: 'medium' },
  { id: 'house_009', title: 'Check grocery essentials', detail: 'Add to list', category: 'household', simplicity: 'low' },
  { id: 'house_010', title: 'Empty diaper trash', detail: 'The smell adds up', category: 'household', simplicity: 'low' },
  { id: 'house_011', title: 'Clean out the fridge', detail: 'Old leftovers out', category: 'household', simplicity: 'high' },
  { id: 'house_012', title: 'Set up coffee for morning', detail: 'Future you thanks you', category: 'household', simplicity: 'low' },
  { id: 'house_013', title: 'Clean microwave', detail: 'Fast and satisfying', category: 'household', simplicity: 'medium' },
  { id: 'house_014', title: 'Declutter entryway', detail: 'Shoes, bags, mail', category: 'household', simplicity: 'medium' },
  { id: 'house_015', title: 'Water the plants', detail: 'They’re part of the home too', category: 'household', simplicity: 'low' },
  { id: 'house_016', title: 'Sweep high-traffic zone', detail: 'Kitchen or hallway', category: 'household', simplicity: 'medium' },
  { id: 'house_017', title: 'Vacuum for 5 minutes', detail: 'Start somewhere', category: 'household', simplicity: 'medium' },
  { id: 'house_018', title: 'Wipe remote controls/handles', detail: 'Germ hotspots', category: 'household', simplicity: 'low' },
  { id: 'house_019', title: 'Check and sort mail pile', detail: 'Recycle junk now', category: 'household', simplicity: 'medium' },
  { id: 'house_020', title: 'Organize one drawer', detail: 'Pick your messiest', category: 'household', simplicity: 'medium' },
];
// Add this to your constants/tasks.js file

// Age-specific baby tasks
export const babyTasksByAge = {
  '0-6m': [
    { title: 'Check diaper supply', detail: 'Size 1-2 running low?', category: 'baby', simplicity: 'low' },
    { title: 'Sanitize bottles', detail: 'Sterilize for tomorrow', category: 'baby', simplicity: 'medium' },
    { title: 'Tummy time session', detail: '5-10 minutes', category: 'baby', simplicity: 'low' },
    { title: 'Check formula supply', detail: 'Need more?', category: 'baby', simplicity: 'low' },
    { title: 'Wash pump parts', detail: 'For tomorrow', category: 'baby', simplicity: 'medium' },
    { title: '4-month checkup', detail: 'Schedule if due', category: 'baby', simplicity: 'low' },
    { title: 'Rotate crib mobile', detail: 'New view', category: 'baby', simplicity: 'low' },
  ],
  
  '6-12m': [
    { title: 'Prep finger foods', detail: 'Cut up soft fruits', category: 'baby', simplicity: 'medium' },
    { title: 'Baby-proof outlets', detail: 'They\'re crawling!', category: 'baby', simplicity: 'medium' },
    { title: 'Check shoe size', detail: 'First shoes?', category: 'baby', simplicity: 'low' },
    { title: 'Stock baby food', detail: 'New flavors to try', category: 'baby', simplicity: 'low' },
    { title: 'Schedule 9-month checkup', detail: 'If due', category: 'baby', simplicity: 'low' },
    { title: 'Check car seat height', detail: 'Adjust straps?', category: 'baby', simplicity: 'low' },
  ],
  
  '1-2y': [
    { title: 'Prep daycare snacks', detail: 'Goldfish, fruit', category: 'baby', simplicity: 'medium' },
    { title: 'Potty supplies check', detail: 'Getting ready?', category: 'baby', simplicity: 'low' },
    { title: 'Schedule 18-month checkup', detail: 'If due', category: 'baby', simplicity: 'low' },
    { title: 'Toddler-proof cabinets', detail: 'They reach everything', category: 'baby', simplicity: 'medium' },
    { title: 'Check diaper size', detail: 'Size 4-5?', category: 'baby', simplicity: 'low' },
    { title: 'Rotate toys', detail: 'Hide some, bring others out', category: 'baby', simplicity: 'medium' },
  ],
  
  '2-3y': [
    { title: 'Pack preschool bag', detail: 'Extra clothes, pull-ups', category: 'baby', simplicity: 'medium' },
    { title: 'Prep easy dinners', detail: 'Toddler-friendly', category: 'baby', simplicity: 'medium' },
    { title: 'Schedule 2-year checkup', detail: 'If due', category: 'baby', simplicity: 'low' },
    { title: 'Update car seat', detail: 'Forward-facing?', category: 'baby', simplicity: 'medium' },
    { title: 'Practice bedtime routine', detail: 'Big kid bed soon?', category: 'baby', simplicity: 'medium' },
  ],
  
  '3-5y': [
    { title: 'Pack school snack', detail: 'Nut-free', category: 'baby', simplicity: 'low' },
    { title: 'Sign permission slips', detail: 'Check backpack', category: 'baby', simplicity: 'low' },
    { title: 'Schedule dental visit', detail: 'Every 6 months', category: 'baby', simplicity: 'low' },
    { title: 'Update booster seat', detail: 'Height/weight check', category: 'baby', simplicity: 'low' },
    { title: 'Plan weekend activity', detail: 'Park, museum, library?', category: 'baby', simplicity: 'medium' },
  ]
};

// Home-specific tasks
export const householdTasksByType = {
  apartment: [
    { title: 'Take trash to chute', detail: 'Before bed', category: 'household', simplicity: 'low' },
    { title: 'Check mail', detail: 'Clear the box', category: 'household', simplicity: 'low' },
    { title: 'Wipe down balcony', detail: 'If you have one', category: 'household', simplicity: 'low' },
    { title: 'Test smoke detector', detail: 'Monthly check', category: 'household', simplicity: 'low' },
    { title: 'Clean air vents', detail: 'Dust buildup', category: 'household', simplicity: 'medium' },
  ],
  
  house: [
    { title: 'Check gutters', detail: 'Clear debris', category: 'household', simplicity: 'high' },
    { title: 'Mow lawn', detail: 'Before it\'s a jungle', category: 'household', simplicity: 'high' },
    { title: 'Water outdoor plants', detail: 'They\'re thirsty', category: 'household', simplicity: 'low' },
    { title: 'Check HVAC filter', detail: 'Monthly', category: 'household', simplicity: 'low' },
    { title: 'Test garage door', detail: 'Safety check', category: 'household', simplicity: 'low' },
  ]
};

// Enhanced task generation with preferences
export function generateSmartDailyTasks(preferences = {}) {
  const { partnerName = 'your partner', childAge = '1-2y', homeType = 'house' } = preferences;
  
  // Get age-appropriate baby tasks
  const babyTasks = babyTasksByAge[childAge] || babyTasksByAge['1-2y'];
  
  // Get home-specific tasks
  const homeTasks = householdTasksByType[homeType] || householdTasksByType['house'];
  
  // Get relationship tasks and personalize them
  const relationshipTasks = coreAutoTasks
    .filter(t => t.category === 'relationship')
    .map(task => ({
      ...task,
      title: task.title.replace(/her/g, partnerName),
      detail: task.detail?.replace(/her/g, partnerName)
    }));
  
  // Get general household tasks
  const generalHouseTasks = coreAutoTasks.filter(t => t.category === 'household');
  
  // Mix home-specific and general household tasks
  const allHouseholdTasks = [...homeTasks, ...generalHouseTasks];
  
  // Pick random tasks
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  const selected = [
    pick(relationshipTasks),
    pick(babyTasks),
    pick(allHouseholdTasks)
  ];
  
  // Remove id field from each task
  return selected.map(({ id, ...task }) => task);
}

// Time-based task suggestions
export function getTimeBasedTasks(hour, preferences = {}) {
  const { partnerName = 'your partner' } = preferences;
  
  if (hour < 9) {
    // Morning tasks
    return [
      { title: `Make ${partnerName} coffee`, detail: 'Start the day right', category: 'relationship', simplicity: 'low' },
      { title: 'Pack daycare bag', detail: 'Before the rush', category: 'baby', simplicity: 'medium' },
      { title: 'Empty dishwasher', detail: 'Fresh start', category: 'household', simplicity: 'low' }
    ];
  } else if (hour < 17) {
    // Daytime tasks
    return [
      { title: `Text ${partnerName} check-in`, detail: 'How\'s the day?', category: 'relationship', simplicity: 'low' },
      { title: 'Order diapers online', detail: 'Running low?', category: 'baby', simplicity: 'low' },
      { title: 'Start laundry', detail: 'Get ahead', category: 'household', simplicity: 'medium' }
    ];
  } else {
    // Evening tasks
    return [
      { title: `Give ${partnerName} 30min break`, detail: 'Take over', category: 'relationship', simplicity: 'medium' },
      { title: 'Prep tomorrow\'s bottles', detail: 'Save morning time', category: 'baby', simplicity: 'medium' },
      { title: 'Kitchen reset', detail: 'Clean slate', category: 'household', simplicity: 'medium' }
    ];
  }
}
// ✅ Generator for dashboard daily suggestions
export function generateDailyTasks() {
  const relationship = coreAutoTasks.filter(t => t.category === 'relationship');
  const baby = coreAutoTasks.filter(t => t.category === 'baby');
  const household = coreAutoTasks.filter(t => t.category === 'household');

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  const selected = [pick(relationship), pick(baby), pick(household)];
  
  // Remove id field from each task
  return selected.map(({ id, ...task }) => task);
}