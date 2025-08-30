#!/usr/bin/env node

// Admin cleanup utility using Firebase Admin SDK
// Usage: node admin-cleanup.js YOUR_USER_ID

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

async function cleanupProblematicTasks(userId) {
  try {
    console.log('🔍 Finding problematic tasks for user:', userId);
    
    const tasksRef = db.collection('tasks');
    const snapshot = await tasksRef.where('userId', '==', userId).get();
    
    console.log(`📋 Found ${snapshot.size} total tasks to check`);
    
    let deletedCount = 0;
    let checkedCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const id = doc.id;
      checkedCount++;
      
      let shouldDelete = false;
      let reason = '';
      
      // Delete template tasks that shouldn't be in user data
      const templatePatterns = ['rel_', 'baby_', 'house_', 'self_', 'admin_', 'seas_'];
      if (templatePatterns.some(pattern => id.startsWith(pattern))) {
        shouldDelete = true;
        reason = 'template task ID';
      }
      
      // Delete tasks with very short IDs (likely templates) 
      else if (id.length < 10) {
        shouldDelete = true;
        reason = 'suspiciously short ID';
      }
      
      // Delete tasks with missing critical fields
      else if (!data.title || !data.userId || !data.createdAt) {
        shouldDelete = true;
        reason = 'missing critical fields';
      }
      
      // Check for malformed timestamps
      else if (data.createdAt && !(data.createdAt instanceof admin.firestore.Timestamp)) {
        shouldDelete = true;
        reason = 'invalid timestamp format';
      }
      
      // Check date ranges
      else if (data.createdAt) {
        try {
          const date = data.createdAt.toDate();
          if (date > new Date()) {
            shouldDelete = true;
            reason = 'future-dated task';
          } else if (date.getFullYear() < 2020) {
            shouldDelete = true;
            reason = 'suspiciously old date';
          }
        } catch (e) {
          shouldDelete = true;
          reason = 'date conversion error';
        }
      }
      
      // Delete tasks with malformed data types
      if (!shouldDelete) {
        if ((data.title && typeof data.title !== 'string') ||
            (data.detail && typeof data.detail !== 'string') ||
            (data.category && typeof data.category !== 'string')) {
          shouldDelete = true;
          reason = 'malformed data types';
        }
      }
      
      if (shouldDelete) {
        console.log(`🗑️ Deleting task ${id}: ${reason}`);
        console.log(`   Title: ${data.title || 'N/A'}`);
        
        try {
          await doc.ref.delete();
          deletedCount++;
          console.log(`   ✅ Deleted successfully`);
        } catch (deleteError) {
          console.log(`   ❌ Failed to delete: ${deleteError.message}`);
        }
        console.log('');
      }
    }
    
    console.log(`📊 Summary:`);
    console.log(`   Checked: ${checkedCount} tasks`);
    console.log(`   Deleted: ${deletedCount} problematic tasks`);
    console.log(`   Remaining: ${checkedCount - deletedCount} tasks`);
    
    if (deletedCount > 0) {
      console.log('🎉 Cleanup complete! Try refreshing your dashboard now.');
    } else {
      console.log('🤔 No problematic tasks found. The error might be elsewhere.');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    if (error.message.includes('could not be reached')) {
      console.log('💡 Try checking your internet connection and Firebase project settings.');
    }
    process.exit(1);
  }
}

// Get user ID from command line argument
const userId = process.argv[2];
if (!userId) {
  console.log('Usage: node admin-cleanup.js YOUR_USER_ID');
  console.log('Your user ID: 1YEUy17ns7gJ8J3VEQWOPcbjqjq2');
  process.exit(1);
}

console.log('🚀 Starting admin cleanup process...');
cleanupProblematicTasks(userId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });