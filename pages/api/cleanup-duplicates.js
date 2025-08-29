import { cleanupDuplicatesIfSafe } from '@/lib/duplicateHandler';
import { auth } from '@/lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authorization token' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Run safe duplicate cleanup
    const results = await cleanupDuplicatesIfSafe(userId);

    res.json({
      success: true,
      ...results,
      message: results.deleted > 0 
        ? `Cleaned up ${results.deleted} duplicate tasks`
        : results.found > 0 
          ? `Found ${results.found} potential duplicates but kept them for safety`
          : 'No duplicates found'
    });

  } catch (error) {
    console.error('Cleanup API error:', error);
    res.status(500).json({ 
      error: 'Failed to cleanup duplicates',
      details: error.message 
    });
  }
}