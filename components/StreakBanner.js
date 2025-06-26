'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function StreakBanner({ userId }) {
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStreak(data.streakCount || 0);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  if (streak === null) {
    return (
      <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg mb-4 text-sm">
        Loading streak...
      </div>
    );
  }

  return (
    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4 text-sm">
      🔥 You’re on a {streak}-day streak!
    </div>
  );
}