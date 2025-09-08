'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserId } from '@/types/models';
import { BaseProps } from '@/types/components';

interface StreakBannerProps extends BaseProps {
  userId: UserId;
}

const StreakBanner: React.FC<StreakBannerProps> = ({ 
  userId,
  className 
}) => {
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    const unsubscribe: Unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStreak(data.streakCount || 0);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  if (streak === null) {
    return (
      <div className={`bg-gray-100 text-gray-600 px-4 py-2 rounded-lg mb-4 text-sm ${className || ''}`}>
        Loading streak...
      </div>
    );
  }

  if (streak === 0) {
    return (
      <div className={`bg-blue-100 text-blue-800 px-4 py-2 rounded-lg mb-4 text-sm ${className || ''}`}>
        💪 Complete your first task today to start a streak!
      </div>
    );
  }

  // Special messages for milestones
  const getStreakMessage = (streak: number): string => {
    if (streak === 1) {
      return "🌱 Great start! Complete another task tomorrow to build your streak!";
    } else if (streak === 3) {
      return `🔥 3 days strong! You're building momentum!`;
    } else if (streak === 7) {
      return `🏆 One week streak! You're crushing it!`;
    } else if (streak >= 30) {
      return `🏅 ${streak} days! You're a productivity legend!`;
    } else if (streak >= 14) {
      return `⭐ ${streak} days! This is becoming a habit!`;
    }
    return `🔥 You're on a ${streak}-day streak!`;
  };

  return (
    <div className={`bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4 text-sm ${className || ''}`}>
      {getStreakMessage(streak)}
    </div>
  );
};

export default StreakBanner;