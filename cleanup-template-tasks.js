// Emergency cleanup script for template tasks in Firestore
// Run this in browser console while logged into your dashboard

async function cleanupTemplateTasks() {
  console.log('🧹 Starting cleanup of template tasks...');
  
  if (!user || !db) {
    console.error('❌ User or db not available. Make sure you are logged in.');
    return;
  }
  
  try {
    // Query all user tasks
    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    
    console.log(`📊 Found ${snapshot.docs.length} total tasks`);
    
    const templateTasks = [];
    const templatePrefixes = ['rel_', 'baby_', 'house_', 'self_', 'admin_', 'seas_'];
    
    snapshot.docs.forEach((docSnap) => {
      const isTemplate = templatePrefixes.some(prefix => docSnap.id.startsWith(prefix));
      if (isTemplate) {
        templateTasks.push({
          id: docSnap.id,
          title: docSnap.data().title,
          category: docSnap.data().category
        });
      }
    });
    
    console.log(`🎯 Found ${templateTasks.length} template tasks to delete:`, templateTasks);
    
    if (templateTasks.length === 0) {
      console.log('✅ No template tasks found. Your database is clean!');
      return;
    }
    
    // Confirm deletion
    const confirmed = confirm(`⚠️ This will DELETE ${templateTasks.length} template tasks from your database. Continue?`);
    if (!confirmed) {
      console.log('❌ Cleanup cancelled by user');
      return;
    }
    
    // Delete template tasks
    console.log('🗑️ Deleting template tasks...');
    const deletePromises = templateTasks.map(task => {
      console.log(`   Deleting: ${task.id} - ${task.title}`);
      return deleteDoc(doc(db, 'tasks', task.id));
    });
    
    await Promise.all(deletePromises);
    
    console.log('✅ Successfully deleted all template tasks!');
    console.log('🔄 Refresh your dashboard to see the changes.');
    
    // Refresh dashboard data
    if (typeof refreshAllData === 'function') {
      await refreshAllData();
      console.log('🔄 Dashboard data refreshed automatically.');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Instructions
console.log(`
🧹 TEMPLATE TASK CLEANUP SCRIPT

To clean up template tasks from your database:
1. Make sure you're on your dashboard page and logged in
2. Run: cleanupTemplateTasks()

This will remove all tasks with IDs starting with:
rel_, baby_, house_, self_, admin_, seas_
`);

// Make function available globally
window.cleanupTemplateTasks = cleanupTemplateTasks;