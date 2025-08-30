#!/usr/bin/env node

// Simple task cleanup utility - run this to delete problematic tasks
// Usage: node cleanup-problematic-tasks.js YOUR_USER_ID

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Firebase config - will use environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function cleanupProblematicTasks(userId) {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('🔍 Finding problematic tasks for user:', userId);
    
    const q = query(collection(db, 'tasks'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    let deletedCount = 0;
    let checkedCount = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const id = docSnap.id;
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
        reason = 'missing critical fields (title, userId, or createdAt)';
      }
      
      // Delete tasks with invalid date objects
      else if (data.createdAt && typeof data.createdAt.toDate !== 'function') {
        shouldDelete = true;
        reason = 'invalid createdAt date format';
      }
      
      // Check date ranges and conversions
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
          reason = 'date conversion error: ' + e.message;
        }
      }
      
      // Delete tasks with malformed data types
      if (!shouldDelete) {
        if ((data.title && typeof data.title !== 'string') ||
            (data.detail && typeof data.detail !== 'string') ||
            (data.category && typeof data.category !== 'string')) {
          shouldDelete = true;
          reason = 'malformed data types (non-string title/detail/category)';
        }
      }
      
      if (shouldDelete) {
        console.log(`🗑️ Deleting task ${id}: ${reason}`);
        console.log(`   Title: ${data.title || 'N/A'}`);
        console.log(`   Created: ${data.createdAt ? 'present' : 'missing'}`);
        
        try {
          await deleteDoc(doc(db, 'tasks', id));
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
      console.log('🤔 No problematic tasks found. The issue might be elsewhere.');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Get user ID from command line argument
const userId = process.argv[2];
if (!userId) {
  console.log('Usage: node cleanup-problematic-tasks.js YOUR_USER_ID');
  console.log('');
  console.log('To find your user ID:');
  console.log('1. Open your dashboard in the browser');
  console.log('2. Open Developer Tools (F12)');
  console.log('3. Look in Console for lines like "[LoadTasks] Loading tasks for user: YOUR_USER_ID"');
  console.log('4. Or check localStorage: localStorage.getItem("firebase:authUser:[project-id]")');
  process.exit(1);
}

console.log('🚀 Starting cleanup process...');
cleanupProblematicTasks(userId);