import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

// Template patterns to delete globally
const TEMPLATE_ID_PREFIXES = [
  'rel_',      // relationship tasks
  'baby_',     // baby care tasks
  'house_',    // household tasks
  'self_',     // self care tasks
  'admin_',    // admin tasks
  'seas_',     // seasonal tasks
  'work_',     // work tasks
  'health_',   // health tasks
  'maint_',    // maintenance tasks
  'fam_',      // family tasks
  'pers_',     // personal tasks
  'home_',     // home tasks
];

// Template titles that shouldn't be in user data
const TEMPLATE_TITLES = [
  // Relationship tasks
  'Ask how her day was',
  'Put your phone away at dinner',
  'Text her something appreciative',
  'Clean up after dinner',
  'Sit and talk for 5 mins',
  'Tell her one thing she\'s great at',
  'Ask how she slept',
  'Say I love you before work',
  'Plan date night',
  'Give a genuine compliment',
  
  // Household tasks
  'Wipe kitchen counters',
  'Quick toy pickup',
  'Take out trash',
  'Make the bed',
  'Do laundry',
  'Clean bathroom',
  'Vacuum living room',
  'Load dishwasher',
  'Grocery shopping',
  'Water plants',
  
  // Self care tasks
  'Schedule dentist',
  'Check car oil',
  'Call mom',
  'Exercise 30 mins',
  'Take vitamins',
  'Read bedtime story',
  
  // Work tasks
  'Check emails',
  'Review calendar',
  'Update project status',
];

export async function POST(request) {
  try {
    const { adminKey } = await request.json();
    
    // Simple admin key check (you should change this)
    if (adminKey !== 'cleanup-all-template-tasks-2025') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Firebase Admin not configured' },
        { status: 500 }
      );
    }

    console.log('🚀 Starting global template task cleanup...');
    
    // Get ALL tasks from the database
    const tasksSnapshot = await db.collection('tasks').get();
    console.log(`📊 Found ${tasksSnapshot.size} total tasks in database`);
    
    let deletedCount = 0;
    let userTaskCounts = new Map();
    const tasksToDelete = [];
    const userSummary = new Map();
    
    // Analyze each task
    tasksSnapshot.docs.forEach((doc) => {
      const taskId = doc.id;
      const taskData = doc.data();
      const userId = taskData.userId || 'unknown';
      
      // Count tasks per user
      userTaskCounts.set(userId, (userTaskCounts.get(userId) || 0) + 1);
      
      let shouldDelete = false;
      let reason = '';
      
      // Check for template ID prefixes
      if (TEMPLATE_ID_PREFIXES.some(prefix => taskId.toLowerCase().startsWith(prefix))) {
        shouldDelete = true;
        reason = 'Template ID prefix';
      }
      
      // Check for template titles
      else if (taskData.title && TEMPLATE_TITLES.some(title => 
        taskData.title.toLowerCase().trim() === title.toLowerCase()
      )) {
        shouldDelete = true;
        reason = 'Template title match';
      }
      
      // Check for very short IDs (likely templates)
      else if (taskId.length < 15 && /^[a-z]+_?\d*$/i.test(taskId)) {
        shouldDelete = true;
        reason = 'Suspicious short ID';
      }
      
      // Check for missing critical fields
      else if (!taskData.title || !taskData.userId || !taskData.createdAt) {
        shouldDelete = true;
        reason = 'Missing critical fields';
      }
      
      // Check for tasks with no userId (orphaned)
      else if (!taskData.userId || taskData.userId === 'undefined' || taskData.userId === 'null') {
        shouldDelete = true;
        reason = 'Orphaned task (no valid userId)';
      }
      
      // Check for very old tasks that might be test data
      else if (taskData.createdAt && taskData.createdAt.toDate) {
        try {
          const date = taskData.createdAt.toDate();
          if (date.getFullYear() < 2023) {
            shouldDelete = true;
            reason = 'Very old task (pre-2023)';
          }
        } catch (e) {
          shouldDelete = true;
          reason = 'Date conversion error';
        }
      }
      
      if (shouldDelete) {
        tasksToDelete.push({
          id: taskId,
          userId: userId,
          title: taskData.title || 'NO TITLE',
          reason: reason,
          ref: doc.ref
        });
        
        // Track deletions per user
        if (!userSummary.has(userId)) {
          userSummary.set(userId, { deleted: 0, reasons: new Set() });
        }
        const userStats = userSummary.get(userId);
        userStats.deleted++;
        userStats.reasons.add(reason);
      }
    });
    
    if (tasksToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No problematic tasks found! Database is clean.',
        stats: {
          totalTasks: tasksSnapshot.size,
          deletedTasks: 0,
          remainingTasks: tasksSnapshot.size,
          userCount: userTaskCounts.size
        }
      });
    }
    
    console.log(`⚠️ Found ${tasksToDelete.length} problematic tasks to delete`);
    
    // Delete tasks in batches to avoid timeouts
    const batchSize = 500;
    for (let i = 0; i < tasksToDelete.length; i += batchSize) {
      const batch = db.batch();
      const batchTasks = tasksToDelete.slice(i, Math.min(i + batchSize, tasksToDelete.length));
      
      batchTasks.forEach(task => {
        batch.delete(task.ref);
      });
      
      await batch.commit();
      deletedCount += batchTasks.length;
      console.log(`Deleted batch: ${deletedCount}/${tasksToDelete.length} tasks`);
    }
    
    // Create summary by reason
    const tasksByReason = {};
    tasksToDelete.forEach(task => {
      if (!tasksByReason[task.reason]) {
        tasksByReason[task.reason] = [];
      }
      tasksByReason[task.reason].push(task);
    });
    
    console.log('✅ Global cleanup complete!');
    console.log(`Deleted ${deletedCount} problematic tasks`);
    console.log(`Remaining tasks: ${tasksSnapshot.size - deletedCount}`);
    
    return NextResponse.json({
      success: true,
      message: 'Global cleanup completed successfully!',
      stats: {
        totalTasks: tasksSnapshot.size,
        deletedTasks: deletedCount,
        remainingTasks: tasksSnapshot.size - deletedCount,
        userCount: userTaskCounts.size,
        affectedUsers: userSummary.size
      },
      tasksByReason: Object.fromEntries(
        Object.entries(tasksByReason).map(([reason, tasks]) => [
          reason, 
          { count: tasks.length, examples: tasks.slice(0, 3).map(t => ({ id: t.id, title: t.title })) }
        ])
      ),
      userSummary: Object.fromEntries(
        Array.from(userSummary.entries()).map(([userId, stats]) => [
          userId,
          { deleted: stats.deleted, reasons: Array.from(stats.reasons) }
        ])
      )
    });

  } catch (error) {
    console.error('Global cleanup error:', error);
    return NextResponse.json(
      { 
        error: 'Cleanup failed', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}