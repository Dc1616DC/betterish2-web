#!/usr/bin/env node

/**
 * Delete ALL tasks from Firestore
 * This gives us a clean slate to work with the new architecture
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'betterish'
  });
}

const db = admin.firestore();

async function deleteAllTasks() {
  console.log('🗑️  Starting complete task deletion...\n');
  
  try {
    // Get all tasks
    const tasksRef = db.collection('tasks');
    const snapshot = await tasksRef.get();
    
    if (snapshot.empty) {
      console.log('✅ No tasks found. Database is already clean.');
      return;
    }
    
    console.log(`Found ${snapshot.size} tasks to delete.\n`);
    
    // Delete in batches of 500 (Firestore limit)
    const batchSize = 500;
    let batch = db.batch();
    let operationCount = 0;
    let totalDeleted = 0;
    
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      operationCount++;
      
      if (operationCount === batchSize) {
        // Commit this batch
        await batch.commit();
        totalDeleted += operationCount;
        console.log(`Deleted ${totalDeleted} tasks...`);
        
        // Start new batch
        batch = db.batch();
        operationCount = 0;
      }
    }
    
    // Commit any remaining operations
    if (operationCount > 0) {
      await batch.commit();
      totalDeleted += operationCount;
    }
    
    console.log(`\n✅ Successfully deleted ${totalDeleted} tasks.`);
    console.log('🎯 Database is now clean and ready for fresh data!\n');
    
  } catch (error) {
    console.error('❌ Error deleting tasks:', error);
    process.exit(1);
  }
}

// Run with confirmation
console.log('⚠️  WARNING: This will delete ALL tasks from Firestore!');
console.log('This action cannot be undone.\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Type "DELETE ALL" to confirm: ', (answer) => {
  if (answer === 'DELETE ALL') {
    deleteAllTasks().then(() => {
      console.log('Done!');
      process.exit(0);
    });
  } else {
    console.log('Cancelled. No tasks were deleted.');
    process.exit(0);
  }
  rl.close();
});