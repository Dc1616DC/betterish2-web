/**
 * API endpoint for AI Dad Mentor Daily Check-In
 * Provides contextual guidance based on user patterns and current situation
 */

import { NextResponse } from 'next/server';
import { createDadMentor } from '@/lib/aiMentor';

export async function POST(request) {
  try {
    const { userId, action = 'check_in', taskTitle = null, userTasks = [], category = null } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

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
        const browseSuggestions = dadMentor.getBrowseSuggestions(category, userTasks);
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

export async function GET(request) {
  // Health check endpoint
  return NextResponse.json({ 
    status: 'AI Mentor is running',
    timestamp: new Date().toISOString()
  });
}