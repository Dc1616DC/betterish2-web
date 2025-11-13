import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getDevelopmentalContext } from '@/lib/developmental-stages';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Category mapping for task generation
const CATEGORIES = {
  'Dad & Kids': 'dad_and_kids',
  'Home & Maintenance': 'home_maintenance',
  'Partner & Relationship': 'relationship',
  'Personal Care': 'personal',
  'Work': 'work',
  'Household': 'household',
  'Events': 'events',
  'Health': 'health',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userProfile } = body;

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile is required' },
        { status: 400 }
      );
    }

    // Get current time context
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const month = now.toLocaleString('en-US', { month: 'long' });
    const season = getSeason(now.getMonth());

    // Get developmental context if child's age is available
    let developmentalContext = '';
    if (userProfile?.children?.[0]?.ageInMonths) {
      developmentalContext = getDevelopmentalContext(userProfile.children[0].ageInMonths);
    }

    // Build user context
    const contextParts = [
      '=== USER CONTEXT ===',
      userProfile.name ? `Name: ${userProfile.name}` : '',
      userProfile.hasPartner !== undefined ? `Has Partner: ${userProfile.hasPartner ? 'Yes' : 'No'}` : '',
      userProfile.state ? `Location: ${userProfile.state}` : '',
      userProfile.isHomeowner !== undefined ? `Homeowner: ${userProfile.isHomeowner ? 'Yes (can do maintenance tasks)' : 'No (renter - focus on non-maintenance tasks)'}` : '',
      userProfile.homeType ? `Home Type: ${userProfile.homeType}` : '',
      userProfile.workSituation ? `Work: ${userProfile.workSituation}` : '',
      '',
      '=== TIME CONTEXT ===',
      `Current time: ${timeOfDay}`,
      `Month: ${month}`,
      `Season: ${season}`,
    ];

    if (developmentalContext) {
      contextParts.push('', developmentalContext);
    }

    const context = contextParts.filter(Boolean).join('\n');

    const prompt = `Generate 3 specific, actionable task suggestions for a dad based on the following context:

${context}

Requirements:
1. Generate EXACTLY 3 tasks
2. Prioritize tasks for these categories (Tier 1):
   - "Dad & Kids" (developmental activities, quality time)
   - "Home & Maintenance" (seasonal tasks, repairs - only if homeowner)
   - "Partner & Relationship" (date nights, partner support)
   - "Personal Care" (self-care, mental health)

3. Each task should:
   - Be specific and actionable (not vague like "spend time with kids")
   - Be appropriate for the time of day (${timeOfDay})
   - Consider the season (${season}) and month (${month})
   - If about child: be age-appropriate based on developmental stage
   - If home maintenance: only suggest if user is a homeowner
   - Be realistic (15-60 minutes to complete)

4. Provide reasoning for each suggestion that:
   - Explains WHY this task matters now
   - References the child's developmental stage if applicable
   - Considers seasonal/time factors

Format your response as a JSON array with this exact structure:
[
  {
    "title": "Task title (be specific)",
    "description": "What to do (2-3 sentences max)",
    "category": "Dad & Kids|Home & Maintenance|Partner & Relationship|Personal Care|Work|Household|Events|Health",
    "priority": "low|medium|high",
    "reasoning": "Why this task matters now (1-2 sentences)"
  }
]

IMPORTANT: Return ONLY the JSON array, no additional text.`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      temperature: 0.8, // Higher temperature for more creative suggestions
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const aiResponse = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse the JSON response
    let tasks;
    try {
      // Extract JSON from response (in case AI adds extra text)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        tasks = JSON.parse(jsonMatch[0]);
      } else {
        tasks = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('AI returned invalid JSON format');
    }

    // Validate and enhance tasks
    const validatedTasks = tasks.slice(0, 3).map((task: any) => ({
      title: task.title,
      description: task.description || '',
      category: task.category || 'Personal Care',
      priority: task.priority || 'medium',
      reasoning: task.reasoning || '',
      aiGenerated: true,
    }));

    return NextResponse.json({
      tasks: validatedTasks,
      context: {
        timeOfDay,
        season,
        month,
      },
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (error: any) {
    console.error('Daily Check-in API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate task suggestions' },
      { status: 500 }
    );
  }
}

// Helper function to get season
function getSeason(month: number): string {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}
