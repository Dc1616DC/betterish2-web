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

  if (streak === 0) {
    return (
      <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg mb-4 text-sm">
        💪 Complete your first task today to start a streak!
      </div>
    );
  }

  // Special messages for milestones
  let message = `🔥 You're on a ${streak}-day streak!`;
  if (streak === 1) {
    message = "🌱 Great start! Complete another task tomorrow to build your streak!";
  } else if (streak === 3) {
    message = `🔥 3 days strong! You're building momentum!`;
  } else if (streak === 7) {
    message = `🏆 One week streak! You're crushing it!`;
  } else if (streak >= 30) {
    message = `🏅 ${streak} days! You're a productivity legend!`;
  } else if (streak >= 14) {
    message = `⭐ ${streak} days! This is becoming a habit!`;
  }

  return (
    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4 text-sm">
      {message}
    </div>
  );
}