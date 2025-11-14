// Developmental stages for children aged 0-24 months
// This knowledge base helps the AI provide age-appropriate task suggestions

export interface DevelopmentalStage {
  ageRange: string;
  ageInMonths: [number, number];
  skills: string[];
  activities: string[];
  toys: string[];
  dadTips: string[];
  watchFor: string[];
}

export const DEVELOPMENTAL_STAGES: DevelopmentalStage[] = [
  {
    ageRange: '0-3 months',
    ageInMonths: [0, 3],
    skills: [
      'Developing neck strength and head control',
      'Beginning to focus on faces and high-contrast patterns',
      'Starting to make cooing sounds',
      'Developing early bonding and attachment',
    ],
    activities: [
      'Tummy time (3-5 minutes, several times daily)',
      'High-contrast visual stimulation (black and white patterns)',
      'Gentle talking and singing',
      'Skin-to-skin contact',
      'Gentle rocking and swaying',
    ],
    toys: [
      'High-contrast black and white cards',
      'Soft rattles with gentle sounds',
      'Soft textured books',
      'Baby-safe mirror',
    ],
    dadTips: [
      'Respond to cries quickly to build trust',
      'Make eye contact during feeding and changing',
      'Learn baby\'s different cries (hungry, tired, uncomfortable)',
      'Take turns with partner for nighttime duties to prevent burnout',
      'Baby-wear during the day to bond while getting things done',
    ],
    watchFor: [
      'Tracking objects with eyes',
      'Responding to sounds',
      'Beginning to smile socially (around 6-8 weeks)',
      'Lifting head during tummy time',
    ],
  },
  {
    ageRange: '3-6 months',
    ageInMonths: [3, 6],
    skills: [
      'Rolling over (tummy to back, then back to tummy)',
      'Reaching for and grasping objects',
      'Babbling and vocal play',
      'Sitting with support',
      'Hand-eye coordination improving',
    ],
    activities: [
      'Extended tummy time sessions',
      'Encourage reaching for toys just out of reach',
      'Read simple board books together',
      'Play peek-a-boo',
      'Introduce water play during bath time',
      'Go for walks and narrate what you see',
    ],
    toys: [
      'Soft blocks',
      'Teething rings (if teething begins)',
      'Crinkly fabric books',
      'Soft balls',
      'Activity gym with hanging toys',
    ],
    dadTips: [
      'Babyproof now - they\'ll be mobile soon',
      'Create a consistent bedtime routine',
      'Take photos/videos regularly - they change fast',
      'Give partner breaks - take baby for walks or outings',
      'Learn basic baby massage - great for bonding',
    ],
    watchFor: [
      'Rolling both directions',
      'Bringing hands to mouth',
      'Responding to own name',
      'Showing interest in solid foods (around 6 months)',
    ],
  },
  {
    ageRange: '6-9 months',
    ageInMonths: [6, 9],
    skills: [
      'Sitting independently',
      'Beginning to crawl or scoot',
      'Transferring objects between hands',
      'Developing pincer grasp',
      'Responding to simple words',
    ],
    activities: [
      'Create safe crawling spaces',
      'Practice sitting and playing',
      'Introduce simple cause-and-effect toys',
      'Read interactive books (lift-the-flap, touch-and-feel)',
      'Play simple games (pat-a-cake, peek-a-boo)',
      'Supervised exploration of safe household items',
    ],
    toys: [
      'Stacking cups',
      'Soft blocks',
      'Shape sorters (simple)',
      'Musical instruments (shakers, drums)',
      'Board books',
      'Bath toys',
    ],
    dadTips: [
      'Childproofing is critical now - outlets, cords, cabinets',
      'Lower crib mattress if not already done',
      'Start teaching "no" and "gentle touch"',
      'Take videos of crawling attempts - so fun to watch later',
      'Schedule regular date nights with partner',
    ],
    watchFor: [
      'Sitting without support',
      'Beginning mobility (crawling, scooting, rolling)',
      'Picking up small objects with thumb and finger',
      'Responding to simple words like "no" and their name',
    ],
  },
  {
    ageRange: '9-12 months',
    ageInMonths: [9, 12],
    skills: [
      'Crawling proficiently',
      'Pulling to stand',
      'Cruising along furniture',
      'Saying first words',
      'Understanding simple instructions',
      'Showing preferences and personality',
    ],
    activities: [
      'Encourage cruising with furniture arranged in a circle',
      'Read books and point to pictures',
      'Play with balls (rolling, soft throwing)',
      'Simple hiding games (hide toy under blanket)',
      'Outdoor exploration (grass, leaves, safe nature items)',
      'Music and movement activities',
    ],
    toys: [
      'Push toys for walking practice',
      'Simple puzzles (2-3 large pieces)',
      'Balls of various sizes',
      'Toy phones',
      'Stuffed animals',
      'Simple musical toys',
    ],
    dadTips: [
      'Baby may become clingy - separation anxiety is normal',
      'Accident-proof everything - they\'re fearless now',
      'Document first words and steps',
      'Practice patience - tantrums may begin',
      'Plan first birthday celebration',
    ],
    watchFor: [
      'First steps (may happen now or later - both normal)',
      'First words beyond "mama" and "dada"',
      'Pointing at things',
      'Imitating actions',
    ],
  },
  {
    ageRange: '12-18 months',
    ageInMonths: [12, 18],
    skills: [
      'Walking independently',
      'Vocabulary explosion',
      'Following simple instructions',
      'Stacking blocks',
      'Using utensils (messily)',
      'Showing independence ("me do it!")',
    ],
    activities: [
      'Outdoor play (playground, park)',
      'Reading together daily',
      'Simple art (large crayons, finger painting)',
      'Playing with other children (parallel play)',
      'Dancing to music',
      'Helping with simple tasks (putting toys away)',
    ],
    toys: [
      'Ride-on toys',
      'Simple dolls or action figures',
      'Building blocks',
      'Shape sorters',
      'Play kitchen items',
      'Outdoor toys (sandbox, water table)',
    ],
    dadTips: [
      'Toddler-proof beyond baby-proofing (climbers!)',
      'Set consistent boundaries and follow through',
      'Expect tantrums - stay calm',
      'Take toddler on "dad dates" - one-on-one time',
      'Photograph the chaos - you\'ll miss it someday',
    ],
    watchFor: [
      'Walking well, beginning to run',
      'Saying 10-20 words',
      'Following simple instructions',
      'Stacking 2-4 blocks',
    ],
  },
  {
    ageRange: '18-24 months',
    ageInMonths: [18, 24],
    skills: [
      'Running and climbing',
      'Speaking in 2-word phrases',
      'Showing empathy',
      'Pretend play beginning',
      'Learning to jump',
      'Increasing independence',
    ],
    activities: [
      'Active outdoor play',
      'Pretend play (cooking, caring for dolls)',
      'Simple crafts and coloring',
      'Singing songs with actions',
      'Playing with other kids',
      'Helping with household tasks',
    ],
    toys: [
      'Tricycles or balance bikes',
      'Play kitchen and food',
      'Dolls and stuffed animals',
      'Simple puzzles (4-8 pieces)',
      'Art supplies',
      'Dress-up clothes',
    ],
    dadTips: [
      'Power struggles are normal - pick your battles',
      'Offer choices ("red shirt or blue shirt?")',
      'Consistent routines prevent meltdowns',
      'Plan for terrible twos - they\'re coming',
      'Celebrate their personality emerging',
    ],
    watchFor: [
      'Speaking 50+ words',
      'Combining words ("more milk", "daddy bye-bye")',
      'Following 2-step instructions',
      'Parallel play with other children',
    ],
  },
];

// Helper function to get developmental stage based on age in months
export function getDevelopmentalStage(ageInMonths: number): DevelopmentalStage | null {
  return DEVELOPMENTAL_STAGES.find(
    stage => ageInMonths >= stage.ageInMonths[0] && ageInMonths <= stage.ageInMonths[1]
  ) || null;
}

// Helper function to get developmental context for AI
export function getDevelopmentalContext(ageInMonths: number): string {
  const stage = getDevelopmentalStage(ageInMonths);
  if (!stage) {
    return 'No specific developmental information available for this age.';
  }

  return `
Developmental Stage: ${stage.ageRange}

Key Skills Developing:
${stage.skills.map(s => `- ${s}`).join('\n')}

Recommended Activities:
${stage.activities.map(a => `- ${a}`).join('\n')}

Appropriate Toys:
${stage.toys.map(t => `- ${t}`).join('\n')}

Dad Tips:
${stage.dadTips.map(tip => `- ${tip}`).join('\n')}

Milestones to Watch For:
${stage.watchFor.map(m => `- ${m}`).join('\n')}
  `.trim();
}
