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

  // HOME PROJECTS (20)
  { id: 'home_001', title: 'Fix squeaky door hinge', detail: 'Apply WD-40 or oil', category: 'home_projects', simplicity: 'low' },
  { id: 'home_002', title: 'Replace burnt out light bulb', detail: 'Check wattage first', category: 'home_projects', simplicity: 'low' },
  { id: 'home_003', title: 'Touch up paint on scuffed wall', detail: 'Small spot repair', category: 'home_projects', simplicity: 'medium' },
  { id: 'home_004', title: 'Tighten loose cabinet handles', detail: 'Just need a screwdriver', category: 'home_projects', simplicity: 'low' },
  { id: 'home_005', title: 'Caulk around bathtub edge', detail: 'Prevent water damage', category: 'home_projects', simplicity: 'medium' },
  { id: 'home_006', title: 'Install new shower head', detail: 'Upgrade the experience', category: 'home_projects', simplicity: 'medium' },
  { id: 'home_007', title: 'Fix loose toilet seat', detail: 'Tighten or replace bolts', category: 'home_projects', simplicity: 'low' },
  { id: 'home_008', title: 'Replace weather stripping', detail: 'Around doors/windows', category: 'home_projects', simplicity: 'medium' },
  { id: 'home_009', title: 'Unclog bathroom drain', detail: 'Hair catcher or snake', category: 'home_projects', simplicity: 'medium' },
  { id: 'home_010', title: 'Mount that picture frame', detail: 'Finally get it on the wall', category: 'home_projects', simplicity: 'medium' },
  { id: 'home_011', title: 'Fix running toilet', detail: 'Adjust flapper chain', category: 'home_projects', simplicity: 'medium' },
  { id: 'home_012', title: 'Install baby gates', detail: 'Safety first', category: 'home_projects', simplicity: 'high' },
  { id: 'home_013', title: 'Organize garage/basement', detail: '1 hour declutter session', category: 'home_projects', simplicity: 'high' },
  { id: 'home_014', title: 'Fix loose deck railing', detail: 'Safety check and repair', category: 'home_projects', simplicity: 'high' },
  { id: 'home_015', title: 'Install outlet covers', detail: 'Childproof the house', category: 'home_projects', simplicity: 'low' },
  { id: 'home_016', title: 'Patch hole in drywall', detail: 'Small repair kit', category: 'home_projects', simplicity: 'medium' },
  { id: 'home_017', title: 'Replace furnace filter', detail: 'Check size first', category: 'home_projects', simplicity: 'low' },
  { id: 'home_018', title: 'Insulate basement windows', detail: 'Winter prep', category: 'home_projects', simplicity: 'medium' },
  { id: 'home_019', title: 'Install smoke detector batteries', detail: 'Test while you\'re at it', category: 'home_projects', simplicity: 'low' },
  { id: 'home_020', title: 'Repair fence gate latch', detail: 'Keep it secure', category: 'home_projects', simplicity: 'medium' },

  // HEALTH & APPOINTMENTS (15)
  { id: 'health_001', title: 'Schedule annual physical', detail: 'Due for checkup?', category: 'health', simplicity: 'low' },
  { id: 'health_002', title: 'Book dentist appointment', detail: 'Every 6 months', category: 'health', simplicity: 'low' },
  { id: 'health_003', title: 'Schedule eye exam', detail: 'Vision check', category: 'health', simplicity: 'low' },
  { id: 'health_004', title: 'Refill prescription medications', detail: 'Check dates', category: 'health', simplicity: 'low' },
  { id: 'health_005', title: 'Schedule baby wellness visit', detail: 'Keep up with checkups', category: 'health', simplicity: 'low' },
  { id: 'health_006', title: 'Update emergency contacts', detail: 'Medical forms', category: 'health', simplicity: 'medium' },
  { id: 'health_007', title: 'Get flu shot', detail: 'Seasonal protection', category: 'health', simplicity: 'low' },
  { id: 'health_008', title: 'Schedule partner mammogram/gyn', detail: 'Annual check', category: 'health', simplicity: 'low' },
  { id: 'health_009', title: 'Update insurance beneficiaries', detail: 'Life changes matter', category: 'health', simplicity: 'medium' },
  { id: 'health_010', title: 'Organize medicine cabinet', detail: 'Check expiration dates', category: 'health', simplicity: 'medium' },
  { id: 'health_011', title: 'Schedule therapy session', detail: 'Mental health check', category: 'health', simplicity: 'low' },
  { id: 'health_012', title: 'Book kids sports physical', detail: 'Required for activities', category: 'health', simplicity: 'low' },
  { id: 'health_013', title: 'Update family medical history', detail: 'For doctor visits', category: 'health', simplicity: 'medium' },
  { id: 'health_014', title: 'Schedule specialist referral', detail: 'Follow up needed?', category: 'health', simplicity: 'medium' },
  { id: 'health_015', title: 'Book couples counseling', detail: 'Relationship maintenance', category: 'health', simplicity: 'low' },

  // EVENTS & CELEBRATIONS (15)
  { id: 'event_001', title: 'Plan birthday celebration', detail: 'Family member coming up', category: 'events', simplicity: 'high' },
  { id: 'event_002', title: 'Buy anniversary gift', detail: 'Mark calendar first', category: 'events', simplicity: 'medium' },
  { id: 'event_003', title: 'Book holiday travel', detail: 'Before prices go up', category: 'events', simplicity: 'high' },
  { id: 'event_004', title: 'Send thank you cards', detail: 'From recent event', category: 'events', simplicity: 'medium' },
  { id: 'event_005', title: 'Plan date night', detail: 'Babysitter and reservations', category: 'events', simplicity: 'medium' },
  { id: 'event_006', title: 'Schedule family photos', detail: 'Annual tradition', category: 'events', simplicity: 'medium' },
  { id: 'event_007', title: 'Plan kids birthday party', detail: 'Theme and guest list', category: 'events', simplicity: 'high' },
  { id: 'event_008', title: 'Buy holiday decorations', detail: 'Before they sell out', category: 'events', simplicity: 'medium' },
  { id: 'event_009', title: 'Plan weekend family outing', detail: 'Something fun together', category: 'events', simplicity: 'medium' },
  { id: 'event_010', title: 'RSVP to wedding invitation', detail: 'Do not forget the deadline', category: 'events', simplicity: 'low' },
  { id: 'event_011', title: 'Plan graduation celebration', detail: 'School milestone', category: 'events', simplicity: 'high' },
  { id: 'event_012', title: 'Book vacation rental', detail: 'Summer trip planning', category: 'events', simplicity: 'high' },
  { id: 'event_013', title: 'Plan surprise for partner', detail: 'Just because', category: 'events', simplicity: 'medium' },
  { id: 'event_014', title: 'Organize playdate', detail: 'Kids social time', category: 'events', simplicity: 'medium' },
  { id: 'event_015', title: 'Plan family game night', detail: 'Quality time at home', category: 'events', simplicity: 'low' },

  // MAINTENANCE & ANNUAL TASKS (15)
  { id: 'maint_001', title: 'Schedule HVAC service', detail: 'Annual maintenance', category: 'maintenance', simplicity: 'medium' },
  { id: 'maint_002', title: 'Clean gutters', detail: 'Twice yearly', category: 'maintenance', simplicity: 'high' },
  { id: 'maint_003', title: 'Service lawn mower', detail: 'Sharpen blades, oil change', category: 'maintenance', simplicity: 'medium' },
  { id: 'maint_004', title: 'Inspect roof for damage', detail: 'After storm season', category: 'maintenance', simplicity: 'high' },
  { id: 'maint_005', title: 'Drain water heater', detail: 'Annual flush', category: 'maintenance', simplicity: 'high' },
  { id: 'maint_006', title: 'Test smoke detectors', detail: 'Monthly check', category: 'maintenance', simplicity: 'low' },
  { id: 'maint_007', title: 'Schedule car oil change', detail: 'Every 3-6 months', category: 'maintenance', simplicity: 'low' },
  { id: 'maint_008', title: 'Winterize outdoor faucets', detail: 'Prevent pipe freeze', category: 'maintenance', simplicity: 'medium' },
  { id: 'maint_009', title: 'Clean dryer vent', detail: 'Fire prevention', category: 'maintenance', simplicity: 'medium' },
  { id: 'maint_010', title: 'Inspect deck/patio safety', detail: 'Loose boards or rails', category: 'maintenance', simplicity: 'medium' },
  { id: 'maint_011', title: 'Service garage door opener', detail: 'Lubricate and test', category: 'maintenance', simplicity: 'medium' },
  { id: 'maint_012', title: 'Check home security system', detail: 'Test alarms and cameras', category: 'maintenance', simplicity: 'low' },
  { id: 'maint_013', title: 'Rotate car tires', detail: 'Even wear pattern', category: 'maintenance', simplicity: 'medium' },
  { id: 'maint_014', title: 'Schedule pest control', detail: 'Seasonal treatment', category: 'maintenance', simplicity: 'medium' },
  { id: 'maint_015', title: 'Organize important documents', detail: 'Insurance, warranties, etc', category: 'maintenance', simplicity: 'high' },

  // PERSONAL TIME & INTERESTS (15)
  { id: 'personal_001', title: 'Block 30 minutes for yourself', detail: 'Read, hobby, or just think', category: 'personal', simplicity: 'low' },
  { id: 'personal_002', title: 'Plan your weekend activity', detail: 'Something you actually want to do', category: 'personal', simplicity: 'medium' },
  { id: 'personal_003', title: 'Call a friend', detail: '10 minute catch-up', category: 'personal', simplicity: 'low' },
  { id: 'personal_004', title: 'Watch that show you want to see', detail: 'Actually relax for once', category: 'personal', simplicity: 'low' },
  { id: 'personal_005', title: 'Take a walk alone', detail: '15 minutes of peace', category: 'personal', simplicity: 'low' },
  { id: 'personal_006', title: 'Work on your hobby', detail: 'Even if just 20 minutes', category: 'personal', simplicity: 'medium' },
  { id: 'personal_007', title: 'Listen to your music', detail: 'Headphones and zone out', category: 'personal', simplicity: 'low' },
  { id: 'personal_008', title: 'Read something interesting', detail: 'Not work or parent related', category: 'personal', simplicity: 'low' },
  { id: 'personal_009', title: 'Plan a solo errand run', detail: 'Coffee shop, bookstore, whatever', category: 'personal', simplicity: 'medium' },
  { id: 'personal_010', title: 'Exercise for 15 minutes', detail: 'Even a quick workout counts', category: 'personal', simplicity: 'medium' },
  { id: 'personal_011', title: 'Sit in car and do nothing', detail: 'Before going inside', category: 'personal', simplicity: 'low' },
  { id: 'personal_012', title: 'Check out that podcast', detail: 'You bookmarked 3 months ago', category: 'personal', simplicity: 'low' },
  { id: 'personal_013', title: 'Plan a guys night', detail: 'Text the group', category: 'personal', simplicity: 'medium' },
  { id: 'personal_014', title: 'Buy something small for yourself', detail: 'You deserve it', category: 'personal', simplicity: 'low' },
  { id: 'personal_015', title: 'Take a proper lunch break', detail: 'Not at your desk', category: 'personal', simplicity: 'low' },
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
    { title: 'Baby-proof outlets', detail: 'They are crawling!', category: 'baby', simplicity: 'medium' },
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

// Enhanced task generation with seasonal and priority intelligence
export function generateSmartDailyTasks(preferences = {}) {
  const { partnerName = 'your partner', childAge = '1-2y', homeType = 'house' } = preferences;
  
  // Import seasonal tasks
  const { getCurrentSeasonalTasks, getEssentialTasks } = require('../lib/seasonalTasks');
  
  // Get current seasonal tasks for this month
  const seasonalTasks = getCurrentSeasonalTasks();
  
  // Get essential tasks by priority
  const essentials = getEssentialTasks();
  
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
  
  // Get other useful categories
  const homeProjectTasks = coreAutoTasks.filter(t => t.category === 'home_projects');
  const maintenanceTasks = coreAutoTasks.filter(t => t.category === 'maintenance');
  const healthTasks = coreAutoTasks.filter(t => t.category === 'health');
  const eventTasks = coreAutoTasks.filter(t => t.category === 'events');
  
  // Mix home-specific and general household tasks
  const allHouseholdTasks = [...homeTasks, ...generalHouseTasks];
  
  // Pick random tasks
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  // PRIORITY SYSTEM: 80/20 rule - always include disaster prevention tasks
  const suggestions = [];
  
  // 1. Always include ONE daily essential (relationship saver)
  if (essentials.daily && essentials.daily.length > 0) {
    suggestions.push(pick(essentials.daily));
  }
  
  // 2. Include seasonal task if it's time-sensitive
  const urgentSeasonal = seasonalTasks.filter(t => t.priority === 'time-sensitive' || t.priority === 'deadline');
  if (urgentSeasonal.length > 0) {
    suggestions.push(pick(urgentSeasonal));
  } else if (seasonalTasks.length > 0) {
    suggestions.push(pick(seasonalTasks));
  }
  
  // 3. Fill remaining slots with variety (keep existing logic but reduced)
  const remainingSlots = Math.max(0, 5 - suggestions.length);
  const varietyTasks = [
    ...relationshipTasks,
    ...babyTasks,
    ...allHouseholdTasks,
    ...homeProjectTasks,
    ...maintenanceTasks,
    ...healthTasks,
    ...eventTasks
  ];
  
  // Add variety tasks but avoid duplicates
  for (let i = 0; i < remainingSlots && varietyTasks.length > 0; i++) {
    const selected = pick(varietyTasks);
    suggestions.push(selected);
    
    // Remove similar tasks to avoid repetition
    const indexToRemove = varietyTasks.findIndex(t => t.id === selected.id);
    if (indexToRemove > -1) {
      varietyTasks.splice(indexToRemove, 1);
    }
  }
  
  // Remove id field and add priority indicators
  return suggestions.map(({ id, ...task }) => ({
    ...task,
    isEssential: essentials?.daily?.some(e => e.title === task.title) || false,
    isSeasonal: seasonalTasks?.some(s => s.title === task.title) || false,
    timeEstimate: task.timeEstimate || (task.simplicity === 'low' ? '< 2 min' : task.simplicity === 'medium' ? '2-10 min' : '10+ min'),
    prevents: task.prevents || null
  }));
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
  const personal = coreAutoTasks.filter(t => t.category === 'personal');
  const relationship = coreAutoTasks.filter(t => t.category === 'relationship');
  const baby = coreAutoTasks.filter(t => t.category === 'baby');
  const household = coreAutoTasks.filter(t => t.category === 'household');
  const homeProjects = coreAutoTasks.filter(t => t.category === 'home_projects');
  const health = coreAutoTasks.filter(t => t.category === 'health');
  const events = coreAutoTasks.filter(t => t.category === 'events');
  const maintenance = coreAutoTasks.filter(t => t.category === 'maintenance');

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  // Mix of different types of tasks for variety - always include one personal task
  const selected = [
    pick(personal), // Always include personal time
    pick([...relationship, ...baby]), // Family focused
    pick([...household, ...homeProjects, ...maintenance, ...health, ...events]) // Everything else
  ];
  
  // Remove id field from each task
  return selected.map(({ id, ...task }) => task);
}

// Category definitions for UI components
export const TASK_CATEGORIES = {
  personal: 'Personal Time',
  relationship: 'Relationship',
  baby: 'Kids & Baby',
  household: 'Household',
  home_projects: 'Home Projects',
  health: 'Health & Medical',
  events: 'Events & Celebrations', 
  maintenance: 'Maintenance & Annual'
};