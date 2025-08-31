/**
 * API endpoint for AI Daily Check-In
 * Provides contextual guidance based on user patterns and current situation
 */

import { NextResponse } from 'next/server';
import { createDadMentor } from '@/lib/aiMentor';
import { getAIContext } from '@/lib/patternTracking';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const { userId, action = 'check_in', taskTitle = null } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Use Firebase Admin for server-side access
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }
    
    // Get user's current tasks
    const tasksRef = adminDb.collection('tasks');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = tasksRef
      .where('userId', '==', userId)
      .where('completed', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(20);
    
    const tasksSnapshot = await q.get();
    const userTasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const mentor = createDadMentor();

    switch (action) {
      case 'check_in':
        const checkInResponse = await mentor.morningCheckIn(userId, userTasks);
        return NextResponse.json(checkInResponse);

      case 'break_down':
        if (!taskTitle) {
          return NextResponse.json(
            { error: 'Task title is required for breakdown' },
            { status: 400 }
          );
        }
        const breakdown = await mentor.breakDownTask(taskTitle);
        return NextResponse.json(breakdown);

      case 'get_help':
        if (!taskTitle) {
          return NextResponse.json(
            { error: 'Task title is required for help' },
            { status: 400 }
          );
        }
        const help = mentor.getTaskHelp(taskTitle);
        return NextResponse.json(help);

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