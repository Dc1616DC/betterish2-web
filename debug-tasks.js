// Debug script to identify problematic tasks
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  // Add your Firebase config here - you can copy from lib/firebase.js
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugTasks(userId) {
  try {
    console.log('🔍 Analyzing tasks for user:', userId);
    
    const q = query(collection(db, 'tasks'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    const problematicTasks = [];
    const validTasks = [];
    
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      
      // Check for various issues
      const issues = [];
      
      // Missing required fields
      if (!data.title) issues.push('missing title');
      if (!data.userId) issues.push('missing userId');
      if (!data.createdAt) issues.push('missing createdAt');
      
      // Invalid dates
      if (data.createdAt && typeof data.createdAt.toDate !== 'function') {
        issues.push('invalid createdAt format');
      } else if (data.createdAt) {
        try {
          const date = data.createdAt.toDate();
          if (date > new Date()) issues.push('future date');
          if (date.getFullYear() < 2020) issues.push('very old date');
        } catch (e) {
          issues.push('createdAt conversion error');
        }
      }
      
      // Malformed task structure
      if (data.title && typeof data.title !== 'string') issues.push('non-string title');
      if (data.detail && typeof data.detail !== 'string') issues.push('non-string detail');
      if (data.category && typeof data.category !== 'string') issues.push('non-string category');
      
      // Template task IDs that shouldn't be in user data
      const templatePatterns = ['rel_', 'baby_', 'house_', 'self_', 'admin_', 'seas_'];
      if (templatePatterns.some(pattern => id.startsWith(pattern))) {
        issues.push('template task ID');
      }
      
      // Very short IDs (likely templates)
      if (id.length < 10) issues.push('suspiciously short ID');
      
      if (issues.length > 0) {
        problematicTasks.push({ id, data, issues });
      } else {
        validTasks.push({ id, data });
      }
    });
    
    console.log(`✅ Valid tasks: ${validTasks.length}`);
    console.log(`⚠️ Problematic tasks: ${problematicTasks.length}`);
    
    if (problematicTasks.length > 0) {
      console.log('\n🔍 PROBLEMATIC TASKS:');
      problematicTasks.forEach(task => {
        console.log(`- ID: ${task.id}`);
        console.log(`  Issues: ${task.issues.join(', ')}`);
        console.log(`  Title: ${task.data.title || 'MISSING'}`);
        console.log(`  Created: ${task.data.createdAt ? 'present' : 'MISSING'}`);
        console.log('');
      });
      
      console.log('\n🧹 CLEANUP SCRIPT:');
      console.log('Run this to delete problematic tasks:');
      problematicTasks.forEach(task => {
        console.log(`// Delete task ${task.id}: ${task.issues.join(', ')}`);
        console.log(`await deleteDoc(doc(db, 'tasks', '${task.id}'));`);
      });
    }
    
    return { valid: validTasks.length, problematic: problematicTasks.length, tasks: problematicTasks };
    
  } catch (error) {
    console.error('Error debugging tasks:', error);
    return null;
  }
}

// Export for manual use
console.log('To debug tasks, run: debugTasks("YOUR_USER_ID")');
export { debugTasks };