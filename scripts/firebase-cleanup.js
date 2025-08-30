#!/usr/bin/env node

/**
 * Firebase Admin Cleanup Script
 * This script permanently removes problematic template tasks from Firebase
 * Run with: node scripts/firebase-cleanup.js
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'betterish',
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'betterish'
  });
}

const db = admin.firestore();

// Template patterns to delete
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

async function cleanupAllUsers() {
  console.log('🚀 Starting comprehensive Firebase cleanup...\n');
  
  try {
    // Get ALL tasks from the database
    const tasksSnapshot = await db.collection('tasks').get();
    console.log(`📊 Found ${tasksSnapshot.size} total tasks in database\n`);
    
    let deletedCount = 0;
    let userTaskCounts = new Map();
    const tasksToDelete = [];
    
    // Analyze each task
    tasksSnapshot.forEach((doc) => {
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
      
      // Check for corrupted timestamps
      else if (taskData.createdAt && !(taskData.createdAt instanceof admin.firestore.Timestamp)) {
        shouldDelete = true;
        reason = 'Invalid timestamp format';
      }
      
      // Check for very old tasks that might be test data
      else if (taskData.createdAt) {
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
      }
    });
    
    // Display user statistics
    console.log('📊 User Statistics:');
    userTaskCounts.forEach((count, userId) => {
      console.log(`   User ${userId}: ${count} tasks`);
    });
    console.log('');
    
    if (tasksToDelete.length === 0) {
      console.log('✅ No problematic tasks found! Database is clean.\n');
      return;
    }
    
    // Group tasks by reason
    const tasksByReason = {};
    tasksToDelete.forEach(task => {
      if (!tasksByReason[task.reason]) {
        tasksByReason[task.reason] = [];
      }
      tasksByReason[task.reason].push(task);
    });
    
    console.log(`⚠️  Found ${tasksToDelete.length} problematic tasks to delete:\n`);
    
    Object.entries(tasksByReason).forEach(([reason, tasks]) => {
      console.log(`   ${reason}: ${tasks.length} tasks`);
      if (tasks.length <= 5) {
        tasks.forEach(task => {
          console.log(`      - ${task.id}: "${task.title}"`);
        });
      } else {
        tasks.slice(0, 3).forEach(task => {
          console.log(`      - ${task.id}: "${task.title}"`);
        });
        console.log(`      ... and ${tasks.length - 3} more`);
      }
    });
    
    console.log('\n🗑️  Starting deletion process...\n');
    
    // Delete tasks in batches
    const batchSize = 500;
    for (let i = 0; i < tasksToDelete.length; i += batchSize) {
      const batch = db.batch();
      const batchTasks = tasksToDelete.slice(i, Math.min(i + batchSize, tasksToDelete.length));
      
      batchTasks.forEach(task => {
        batch.delete(task.ref);
      });
      
      await batch.commit();
      deletedCount += batchTasks.length;
      console.log(`   Deleted batch: ${deletedCount}/${tasksToDelete.length} tasks`);
    }
    
    console.log('\n✅ Cleanup complete!');
    console.log(`   Deleted ${deletedCount} problematic tasks`);
    console.log(`   Remaining tasks: ${tasksSnapshot.size - deletedCount}`);
    console.log('\n🎉 Your Firebase database is now clean!');
    console.log('   Refresh your dashboard to see the results.\n');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    console.error('\nPlease check your Firebase admin credentials and try again.');
    process.exit(1);
  }
}

// Run the cleanup
console.log('========================================');
console.log('   FIREBASE TEMPLATE TASK CLEANUP');
console.log('========================================\n');

cleanupAllUsers()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });