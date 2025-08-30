'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function SuperAdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const TEMPLATE_PREFIXES = ['rel_', 'baby_', 'house_', 'self_', 'admin_', 'seas_', 'work_', 'health_', 'maint_', 'fam_', 'pers_', 'home_'];
  
  const TEMPLATE_TITLES = [
    'Ask how her day was',
    'Put your phone away at dinner',
    'Text her something appreciative',
    'Clean up after dinner',
    'Sit and talk for 5 mins',
    'Tell her one thing she\'s great at',
    'Wipe kitchen counters',
    'Quick toy pickup',
    'Take out trash',
    'Make the bed',
    'Do laundry',
    'Schedule dentist',
    'Check car oil',
    'Water plants',
    'Call mom',
    'Plan date night',
    'Read bedtime story'
  ];

  const runGlobalCleanup = async () => {
    if (!confirm('⚠️ This will scan ALL tasks in the database and delete problematic ones!\n\nThis includes:\n- Template ID prefixes (rel_, house_, etc.)\n- Template titles\n- Corrupted tasks\n\nContinue?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🚀 Starting global cleanup...');
      
      // Get ALL tasks from Firestore (no user filter)
      const tasksRef = collection(db, 'tasks');
      const snapshot = await getDocs(tasksRef);
      
      console.log(`📊 Found ${snapshot.size} total tasks`);
      
      const tasksToDelete = [];
      const userStats = new Map();
      
      snapshot.docs.forEach((docSnap) => {
        const taskId = docSnap.id;
        const taskData = docSnap.data();
        const userId = taskData.userId || 'unknown';
        
        let shouldDelete = false;
        let reason = '';
        
        // Check template ID prefixes
        if (TEMPLATE_PREFIXES.some(prefix => taskId.startsWith(prefix))) {
          shouldDelete = true;
          reason = 'Template ID prefix';
        }
        
        // Check template titles
        else if (taskData.title && TEMPLATE_TITLES.some(title => 
          taskData.title.toLowerCase().trim() === title.toLowerCase()
        )) {
          shouldDelete = true;
          reason = 'Template title match';
        }
        
        // Check for short suspicious IDs
        else if (taskId.length < 15 && /^[a-z]+_?\d*$/i.test(taskId)) {
          shouldDelete = true;
          reason = 'Suspicious short ID';
        }
        
        // Check missing critical fields
        else if (!taskData.title || !taskData.userId || !taskData.createdAt) {
          shouldDelete = true;
          reason = 'Missing critical fields';
        }
        
        // Check for old tasks
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
            ref: docSnap.ref
          });
          
          // Track by user
          if (!userStats.has(userId)) {
            userStats.set(userId, 0);
          }
          userStats.set(userId, userStats.get(userId) + 1);
        }
      });
      
      if (tasksToDelete.length === 0) {
        setResult({
          message: 'No problematic tasks found! Database is clean.',
          stats: { totalTasks: snapshot.size, deletedTasks: 0 }
        });
        return;
      }
      
      console.log(`⚠️ Found ${tasksToDelete.length} problematic tasks`);
      
      // Delete in batches
      const batchSize = 50;
      let deletedCount = 0;
      
      for (let i = 0; i < tasksToDelete.length; i += batchSize) {
        const batch = tasksToDelete.slice(i, i + batchSize);
        await Promise.all(batch.map(task => deleteDoc(task.ref)));
        deletedCount += batch.length;
        console.log(`Deleted ${deletedCount}/${tasksToDelete.length} tasks`);
      }
      
      setResult({
        message: 'Global cleanup completed!',
        stats: {
          totalTasks: snapshot.size,
          deletedTasks: deletedCount,
          remainingTasks: snapshot.size - deletedCount,
          affectedUsers: userStats.size
        },
        userStats: Object.fromEntries(userStats)
      });
      
    } catch (err) {
      console.error('Cleanup error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔧 Super Admin - Global Database Cleanup
          </h1>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">⚠️ Warning</h2>
            <p className="text-red-700 text-sm">
              This will permanently delete problematic tasks for ALL users in the database.
              Use with extreme caution!
            </p>
          </div>

          <button
            onClick={runGlobalCleanup}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Running Global Cleanup...
              </>
            ) : (
              '🧹 Run Global Template Task Cleanup'
            )}
          </button>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">✅ {result.message}</h3>
              <div className="text-green-700 space-y-2">
                <p><strong>Total Tasks:</strong> {result.stats.totalTasks}</p>
                <p><strong>Deleted Tasks:</strong> {result.stats.deletedTasks}</p>
                <p><strong>Remaining Tasks:</strong> {result.stats.remainingTasks}</p>
                {result.stats.affectedUsers && (
                  <p><strong>Affected Users:</strong> {result.stats.affectedUsers}</p>
                )}
              </div>
              
              {result.userStats && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Tasks deleted per user:</h4>
                  <div className="text-sm max-h-40 overflow-y-auto">
                    {Object.entries(result.userStats).map(([userId, count]) => (
                      <div key={userId}>
                        User {userId.substring(0, 8)}...: {count} tasks
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}