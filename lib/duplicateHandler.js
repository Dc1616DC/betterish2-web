import { collection, query, where, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Safe duplicate detection and cleanup
export async function findAndHandleDuplicates(userId, options = {}) {
  const {
    autoDelete = false,           // Set to true to auto-delete
    timeWindow = 24,              // Hours to look back
    requireExactMatch = true,     // Require exact title AND detail match
    dryRun = true                // Just return duplicates, don't delete
  } = options;

  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - timeWindow);

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', userId),
      where('createdAt', '>=', Timestamp.fromDate(cutoffTime))
    );

    const snapshot = await getDocs(q);
    
    // Group tasks by similarity key
    const taskGroups = new Map();
    const allTasks = [];

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      
      // Skip completed or dismissed tasks
      if (data.completedAt || data.dismissed || data.status === 'dismissed') {
        return;
      }

      const task = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate()
      };

      allTasks.push(task);

      // Create similarity key
      const similarityKey = requireExactMatch 
        ? `${data.title?.toLowerCase()}-${data.detail?.toLowerCase()}`
        : data.title?.toLowerCase();

      if (!taskGroups.has(similarityKey)) {
        taskGroups.set(similarityKey, []);
      }
      taskGroups.get(similarityKey).push(task);
    });

    // Find groups with duplicates
    const duplicateGroups = [];
    for (const [key, tasks] of taskGroups) {
      if (tasks.length > 1) {
        // Sort by creation time - keep the MOST RECENT
        tasks.sort((a, b) => b.createdAt - a.createdAt);
        
        duplicateGroups.push({
          key,
          keepTask: tasks[0],           // Most recent
          duplicateTasks: tasks.slice(1) // Older duplicates
        });
      }
    }

    // Process duplicates
    const results = {
      found: duplicateGroups.length,
      totalDuplicates: duplicateGroups.reduce((sum, group) => sum + group.duplicateTasks.length, 0),
      deleted: 0,
      groups: duplicateGroups
    };

    if (!dryRun && autoDelete) {
      for (const group of duplicateGroups) {
        for (const duplicate of group.duplicateTasks) {
          try {
            await deleteDoc(doc(db, 'tasks', duplicate.id));
            results.deleted++;
            console.log(`Deleted duplicate: ${duplicate.title} (${duplicate.id})`);
          } catch (error) {
            console.error(`Failed to delete duplicate ${duplicate.id}:`, error);
          }
        }
      }
    }

    return results;

  } catch (error) {
    console.error('Error finding duplicates:', error);
    return { error: error.message, found: 0, deleted: 0 };
  }
}

// Safe wrapper for automatic cleanup
export async function cleanupDuplicatesIfSafe(userId) {
  // First, do a dry run to see what we'd find
  const dryRun = await findAndHandleDuplicates(userId, {
    dryRun: true,
    timeWindow: 2, // Only look at last 2 hours for safety
    requireExactMatch: true
  });

  // Only proceed if we find a reasonable number of duplicates
  if (dryRun.found > 0 && dryRun.found < 10) {
    return await findAndHandleDuplicates(userId, {
      autoDelete: true,
      dryRun: false,
      timeWindow: 2,
      requireExactMatch: true
    });
  }

  return { message: 'No safe cleanup performed', ...dryRun };
}

// Manual duplicate resolution for user review
export async function getDuplicatesForReview(userId) {
  return await findAndHandleDuplicates(userId, {
    dryRun: true,
    timeWindow: 168, // Look back 1 week
    requireExactMatch: false // More lenient matching for review
  });
}