/**
 * API endpoint for AI Dad Mentor Daily Check-In
 * Now powered by Grok AI for personalized, varied suggestions
 */

import { NextResponse } from 'next/server';
import { createDadMentor } from '@/lib/aiMentor';
import { getAiService } from '@/lib/ai/AiService';
import { Task, User, TaskStatus } from '@/types/models';

export async function POST(request: Request) {
  try {
    const { userId, action = 'check_in', taskTitle = null, userTasks = [], category = null, userProfile = null } = await request.json();
    
    console.log('🔥 NEW AI CHECK-IN API CALLED:', { userId, action, userTasksCount: userTasks?.length });
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // For morning check-in, use the new Grok-powered AI service
    if (action === 'check_in') {
      try {
        // Create a simple user object with the provided data
        const userData: User = {
          uid: userId,
          email: userProfile?.email || '',
          profile: userProfile || {}
        } as User;
        
        // Use existing tasks from the request (sent from client)
        const existingTasks: Task[] = userTasks || [];
        
        // Use the new AI service with Grok
        const aiService = getAiService();
        const aiResponse = await aiService.generateDailyMix(userData, existingTasks);
        
        if (aiResponse.data) {
          // Format response for the UI
          const suggestions = aiResponse.data.tasks.slice(0, 3); // Limit to 3 suggestions
          
          // Check if it's morning, afternoon, or evening for personalized message
          const hour = new Date().getHours();
          let greeting = "How's your day going?";
          if (hour < 12) {
            greeting = "Morning! Here's what might help you win at home today:";
          } else if (hour < 17) {
            greeting = "Afternoon check-in. Still time to knock out a few things:";
          } else {
            greeting = "Evening's here. What can we wrap up before calling it a day?";
          }
          
          return NextResponse.json({
            message: greeting,
            type: 'ai_suggestions',
            suggestions,
            rationale: aiResponse.data.rationale,
            actions: [
              { type: 'add_suggestion', label: 'Add these to my list' },
              { type: 'remind_later', label: 'Remind me in a week' },
              { type: 'dismiss', label: 'Not relevant for me' },
              { type: 'skip_checkin', label: 'I\'m good, thanks' }
            ],
            metadata: {
              source: aiResponse.metadata?.mock ? 'mock' : 'grok',
              confidence: aiResponse.data.confidence
            }
          });
        }
      } catch (aiError) {
        console.error('AI service error, falling back to legacy system:', aiError);
        // Fall back to the old system if AI service fails
      }
    }

    // Fall back to legacy Dad Mentor for other actions or if AI fails
    const dadMentor = createDadMentor();

    switch (action) {
      case 'check_in':
        const checkInResponse = await dadMentor.morningCheckIn(userId, userTasks);
        return NextResponse.json(checkInResponse);

      case 'break_down':
        if (!taskTitle) {
          return NextResponse.json(
            { error: 'Task title is required for breakdown' },
            { status: 400 }
          );
        }
        const breakdown = await dadMentor.breakDownTask(taskTitle);
        return NextResponse.json(breakdown);

      case 'get_help':
        if (!taskTitle) {
          return NextResponse.json(
            { error: 'Task title is required for help' },
            { status: 400 }
          );
        }
        const help = dadMentor.getTaskHelp(taskTitle);
        return NextResponse.json(help);

      case 'browse_category':
        if (!category) {
          return NextResponse.json(
            { error: 'Category is required for browsing' },
            { status: 400 }
          );
        }
        const browseSuggestions = await dadMentor.getBrowseSuggestions(category, userTasks, userProfile);
        return NextResponse.json({ suggestions: browseSuggestions });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in AI check-in:', error);
    
    // Graceful degradation - return simple fallback
    return NextResponse.json({
      message: "How's your day going?",
      type: 'fallback',
      suggestions: [],
      actions: [
        { type: 'manual_add', label: 'Add a task' },
        { type: 'skip_checkin', label: 'Skip check-in' }
      ]
    });
  }
}

export async function GET(request: Request) {
  // Health check endpoint
  return NextResponse.json({ 
    status: 'AI Mentor is running with Grok integration',
    timestamp: new Date().toISOString(),
    grokEnabled: !!process.env.GROK_API_KEY
  });
}