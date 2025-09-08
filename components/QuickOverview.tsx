'use client';

import { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  CheckIcon, 
  ClockIcon, 
  SparklesIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserId } from '@/types/models';
import { BaseProps } from '@/types/components';

interface UpcomingDeadline {
  id: string;
  title: string;
  createdAt: any; // Firestore Timestamp
  completedAt?: any;
}

interface OverviewData {
  remainingTasks: number;
  completedTasks: number;
  upcomingDeadlines: UpcomingDeadline[];
  completionPercentage: number;
  motivationalMessage: string;
}

interface QuickOverviewProps extends BaseProps {
  userId: UserId;
}

const QuickOverview: React.FC<QuickOverviewProps> = ({ 
  userId,
  className 
}) => {
  const [overview, setOverview] = useState<OverviewData>({
    remainingTasks: 0,
    completedTasks: 0,
    upcomingDeadlines: [],
    completionPercentage: 0,
    motivationalMessage: ''
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) return;

    const fetchOverviewData = async (): Promise<void> => {
      try {
        setLoading(true);
        
        // Get today's date at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfToday = Timestamp.fromDate(today);
        
        // Get next 7 days for upcoming deadlines
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const nextWeekTimestamp = Timestamp.fromDate(nextWeek);
        
        // Query for today's tasks
        const todayTasksQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', userId),
          where('createdAt', '>=', startOfToday)
        );
        
        // Query for upcoming deadlines
        const upcomingDeadlinesQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', userId),
          where('createdAt', '>=', startOfToday),
          where('createdAt', '<=', nextWeekTimestamp)
        );
        
        // Execute queries
        const [todayTasksSnapshot, upcomingDeadlinesSnapshot] = await Promise.all([
          getDocs(todayTasksQuery),
          getDocs(upcomingDeadlinesQuery)
        ]);
        
        // Process today's tasks
        const todayTasks = todayTasksSnapshot.docs.map(doc => ({ 
          ...doc.data(), 
          id: doc.id 
        })) as any[];
        const completedTasks = todayTasks.filter((task: any) => task.completedAt).length;
        const remainingTasks = todayTasks.length - completedTasks;
        const completionPercentage = todayTasks.length > 0 
          ? Math.round((completedTasks / todayTasks.length) * 100) 
          : 0;
        
        // Process upcoming deadlines
        const deadlines: UpcomingDeadline[] = upcomingDeadlinesSnapshot.docs
          .map(doc => ({ 
            ...doc.data(), 
            id: doc.id 
          } as any))
          .filter((task: any) => !task.completedAt)
          .sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate())
          .slice(0, 3); // Get top 3 upcoming deadlines
        
        // Generate motivational message based on completion percentage
        const motivationalMessage = getMotivationalMessage(completionPercentage, remainingTasks);
        
        setOverview({
          remainingTasks,
          completedTasks,
          upcomingDeadlines: deadlines,
          completionPercentage,
          motivationalMessage
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching overview data:", error);
        setLoading(false);
      }
    };
    
    fetchOverviewData();
  }, [userId]);
  
  // Helper function to generate motivational messages
  const getMotivationalMessage = (percentage: number, remaining: number): string => {
    const hour = new Date().getHours();
    
    // Morning messages
    if (hour < 12) {
      if (percentage === 0) return "Start your day with a small win!";
      if (percentage < 30) return "Great start to the day!";
      if (percentage >= 30) return "You're crushing it this morning!";
    }
    // Afternoon messages
    else if (hour < 17) {
      if (percentage === 0) return "The afternoon is full of possibilities!";
      if (percentage < 50) return "Keep the momentum going!";
      if (percentage >= 50) return "You're making great progress today!";
    }
    // Evening messages
    else {
      if (percentage < 30) return "There's still time to accomplish something!";
      if (percentage < 70) return "Solid progress today!";
      if (percentage >= 70) return "What a productive day you've had!";
    }
    
    // Fallback message
    return "Every completed task is a step forward!";
  };
  
  // Format date to show day and month
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-xl p-4 mb-6 ${className || ''}`}>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100 hover:shadow-md transition-all duration-300 ${className || ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-700">Today&apos;s Overview</h2>
        <ClockIcon className="w-5 h-5 text-blue-500" />
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500">Daily Progress</span>
          <span className="text-sm font-medium text-blue-600">
            {overview.completionPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overview.completionPercentage}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <CheckIcon className="w-3 h-3 mr-1 text-green-500" />
            <span>{overview.completedTasks} completed</span>
          </div>
          <div>
            <span>{overview.remainingTasks} remaining</span>
          </div>
        </div>
      </div>
      
      {/* Motivational Message */}
      <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-100 flex items-start">
        <SparklesIcon className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 italic">
          {overview.motivationalMessage}
        </p>
      </div>
      
      {/* Upcoming Deadlines */}
      {overview.upcomingDeadlines.length > 0 && (
        <div>
          <div className="flex items-center mb-2">
            <CalendarIcon className="w-4 h-4 text-orange-500 mr-1" />
            <h3 className="text-sm font-medium text-gray-700">Upcoming</h3>
          </div>
          <ul className="space-y-2">
            {overview.upcomingDeadlines.map(task => (
              <li 
                key={task.id} 
                className="flex items-center text-sm group hover:bg-gray-50 p-1 rounded transition-colors"
              >
                <div className="w-12 text-xs text-gray-500">
                  {formatDate(task.createdAt)}
                </div>
                <div className="flex-1 truncate">
                  <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                    {task.title}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Tip of the Day */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-start">
        <LightBulbIcon className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600">
          {overview.completionPercentage < 50 
            ? "Break large tasks into smaller, manageable steps for easier progress."
            : "Take short breaks between tasks to maintain productivity and focus."}
        </p>
      </div>
    </div>
  );
};

export default QuickOverview;