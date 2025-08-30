'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runGlobalCleanup = async () => {
    if (!confirm('⚠️ This will delete ALL problematic template tasks for ALL users!\n\nThis includes tasks with IDs starting with:\n- rel_, baby_, house_, self_, admin_, etc.\n- Template titles like "Ask how her day was"\n- Corrupted or orphaned tasks\n\nAre you sure you want to proceed?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/cleanup-all-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminKey: 'cleanup-all-template-tasks-2025' // Simple admin key
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Cleanup failed');
      }

    } catch (err) {
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
            🔧 Admin Panel - Global Template Task Cleanup
          </h1>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Warning</h2>
            <p className="text-yellow-700 text-sm">
              This action will permanently delete problematic template tasks for ALL users in the database.
              This includes tasks with template IDs (rel_, baby_, house_, etc.) and template titles.
              Use with caution!
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">What will be deleted:</h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>Tasks with template ID prefixes: rel_, baby_, house_, self_, admin_, seas_, work_, health_, maint_, fam_, pers_, home_</li>
              <li>Tasks with template titles like "Ask how her day was", "Clean up after dinner", etc.</li>
              <li>Tasks with suspicious short IDs (likely auto-generated templates)</li>
              <li>Tasks missing critical fields (title, userId, createdAt)</li>
              <li>Orphaned tasks with no valid userId</li>
              <li>Very old tasks from before 2023 (likely test data)</li>
            </ul>
          </div>

          <button
            onClick={runGlobalCleanup}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Running Global Cleanup...
              </>
            ) : (
              <>
                🧹 Run Global Template Task Cleanup
              </>
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
              <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Cleanup Complete</h3>
              <div className="text-green-700 space-y-2">
                <p><strong>Total Tasks:</strong> {result.stats.totalTasks}</p>
                <p><strong>Deleted Tasks:</strong> {result.stats.deletedTasks}</p>
                <p><strong>Remaining Tasks:</strong> {result.stats.remainingTasks}</p>
                <p><strong>Total Users:</strong> {result.stats.userCount}</p>
                <p><strong>Affected Users:</strong> {result.stats.affectedUsers}</p>
              </div>

              {result.tasksByReason && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Tasks deleted by reason:</h4>
                  <ul className="text-sm space-y-1">
                    {Object.entries(result.tasksByReason).map(([reason, data]) => (
                      <li key={reason}>
                        <strong>{reason}:</strong> {data.count} tasks
                        {data.examples.length > 0 && (
                          <span className="text-gray-600">
                            {' '}(e.g., {data.examples.map(ex => `"${ex.title}"`).join(', ')})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.userSummary && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">User Summary:</h4>
                  <div className="text-sm max-h-40 overflow-y-auto">
                    {Object.entries(result.userSummary).map(([userId, stats]) => (
                      <div key={userId} className="py-1">
                        <strong>User {userId.substring(0, 8)}...:</strong> {stats.deleted} tasks deleted 
                        <span className="text-gray-600"> ({stats.reasons.join(', ')})</span>
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