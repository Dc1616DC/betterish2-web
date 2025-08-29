// Emergency script to clean up corrupted tasks directly
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBEQQYw9B6ZMw3_dqMXhpjjkj9CnZkl4Fo",
  authDomain: "betterish.firebaseapp.com",
  projectId: "betterish",
  storageBucket: "betterish.appspot.com",
  messagingSenderId: "558419583052",
  appId: "1:558419583052:web:2c5e3c7c8c3b2a4f9b8c1d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupCorruptedTasks(userId) {
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

    console.log(`Found ${snapshot.docs.length} total tasks`);

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
          console.log(`⚠️ Found corrupted task: ${taskId}`, { title: data.title, detail: data.detail, createdAt: data.createdAt, userId: data.userId });
          
          // Try to fix if possible
          if (data.title && data.userId && data.createdAt) {
            // Fix missing detail field
            const fixedData = {
              title: data.title || 'Untitled Task',
              detail: data.detail || '',
              userId: data.userId,
              createdAt: data.createdAt,
              source: data.source || 'manual'
            };
            
            // Only include fields that are not undefined/null
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

// Run the cleanup with your user ID
const USER_ID = '1YEUy17ns7gJ8J3VEQWOPcbjqjq2'; // From your console output
cleanupCorruptedTasks(USER_ID)
  .then(results => {
    console.log('\n🎉 Cleanup finished successfully!');
    console.log(`Fixed: ${results.fixed} tasks`);
    console.log(`Deleted: ${results.deleted} tasks`);
    console.log(`Errors: ${results.errors.length} tasks`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });