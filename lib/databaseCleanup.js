import { collection, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Clean up tasks with undefined fields
export async function cleanupCorruptedTasks(userId) {
  try {
    console.log('🧹 Starting database cleanup for corrupted tasks...');
    
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const results = {
      fixed: 0,
      deleted: 0,
      total: snapshot.docs.length,
      errors: []
    };

    for (const docSnap of snapshot.docs) {
      try {
        const data = docSnap.data();
        const taskId = docSnap.id;
        
        // Check for corrupted fields
        const hasUndefinedFields = (
          data.title === undefined ||
          data.detail === undefined ||
          data.createdAt === undefined ||
          data.userId === undefined
        );
        
        const hasNullFields = (
          data.title === null ||
          data.detail === null ||
          data.createdAt === null ||
          data.userId === null
        );

        if (hasUndefinedFields || hasNullFields) {
          console.log(`⚠️ Found corrupted task: ${taskId}`, data);
          
          // Try to fix if possible
          if (data.title && data.userId && data.createdAt) {
            // Fix missing detail field
            const fixedData = {
              ...data,
              title: data.title || 'Untitled Task',
              detail: data.detail || '',
              userId: data.userId,
              createdAt: data.createdAt
            };
            
            // Remove any undefined fields
            Object.keys(fixedData).forEach(key => {
              if (fixedData[key] === undefined || fixedData[key] === null) {
                delete fixedData[key];
              }
            });
            
            await updateDoc(doc(db, 'tasks', taskId), fixedData);
            console.log(`✅ Fixed corrupted task: ${taskId}`);
            results.fixed++;
          } else {
            // Delete completely corrupted tasks
            await deleteDoc(doc(db, 'tasks', taskId));
            console.log(`🗑️ Deleted completely corrupted task: ${taskId}`);
            results.deleted++;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing task ${docSnap.id}:`, error);
        results.errors.push({ id: docSnap.id, error: error.message });
      }
    }

    console.log('🧹 Cleanup complete:', results);
    return results;
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

// Find and list potentially corrupted tasks
export async function findCorruptedTasks(userId) {
  try {
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const corrupted = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      // Check for various corruption indicators
      const issues = [];
      
      if (data.title === undefined || data.title === null) issues.push('title undefined/null');
      if (data.detail === undefined || data.detail === null) issues.push('detail undefined/null');
      if (data.createdAt === undefined || data.createdAt === null) issues.push('createdAt undefined/null');
      if (data.userId === undefined || data.userId === null) issues.push('userId undefined/null');
      
      if (issues.length > 0) {
        corrupted.push({
          id: docSnap.id,
          issues,
          data
        });
      }
    }

    return corrupted;
  } catch (error) {
    console.error('Error finding corrupted tasks:', error);
    throw error;
  }
}