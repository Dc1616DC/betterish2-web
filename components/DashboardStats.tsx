'use client';

import { useState, useEffect } from 'react';
import { 
  FireIcon, 
  CheckCircleIcon, 
  ChartBarIcon, 
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserId } from '@/types/models';
import { BaseProps } from '@/types/components';

interface DashboardStatsProps extends BaseProps {
  userId: UserId;
  streakCount?: number;
}

interface DashboardStats {
  tasksCompletedToday: number;
  completionRate: number;
  weeklyTasks: number[]; // Sun-Sat
  trend: 'up' | 'down' | 'stable';
}

const DashboardStatsComponent: React.FC<DashboardStatsProps> = ({ 
  userId, 
  streakCount,
  className 
}) => {
  const [stats, setStats] = useState<DashboardStats>({
    tasksCompletedToday: 0,
    completionRate: 0,
    weeklyTasks: [0, 0, 0, 0, 0, 0, 0], // Sun-Sat
    trend: 'stable'
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) return;

    const fetchStats = async (): Promise<void> => {
      try {
        setLoading(true);
        
        // Get today's date at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfToday = Timestamp.fromDate(today);
        
        // Get start of week (Sunday)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfWeekTimestamp = Timestamp.fromDate(startOfWeek);
        
        // Query for today's completed tasks
        const todayCompletedQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', userId),
          where('completedAt', '>=', startOfToday)
        );
        
        // Query for all tasks created today
        const todayCreatedQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', userId),
          where('createdAt', '>=', startOfToday)
        );
        
        // Query for this week's tasks
        const weeklyTasksQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', userId),
          where('createdAt', '>=', startOfWeekTimestamp)
        );
        
        // Execute queries
        const [todayCompletedSnapshot, todayCreatedSnapshot, weeklyTasksSnapshot] = await Promise.all([
          getDocs(todayCompletedQuery),
          getDocs(todayCreatedQuery),
          getDocs(weeklyTasksQuery)
        ]);
        
        // Calculate completion rate
        const tasksCompletedToday = todayCompletedSnapshot.size;
        const totalTasksToday = todayCreatedSnapshot.size;
        const completionRate = totalTasksToday > 0 
          ? Math.round((tasksCompletedToday / totalTasksToday) * 100) 
          : 0;
        
        // Calculate weekly distribution
        const weeklyDistribution: number[] = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
        
        weeklyTasksSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.completedAt) {
            const completedDate = data.completedAt.toDate();
            const dayOfWeek = completedDate.getDay();
            weeklyDistribution[dayOfWeek]++;
          }
        });
        
        // Calculate trend (comparing today with yesterday)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayCompleted = weeklyDistribution[yesterday.getDay()];
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (tasksCompletedToday > yesterdayCompleted) trend = 'up';
        else if (tasksCompletedToday < yesterdayCompleted) trend = 'down';
        
        setStats({
          tasksCompletedToday,
          completionRate,
          weeklyTasks: weeklyDistribution,
          trend
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [userId]);
  
  // Helper function to determine the highest day in the week
  const getHighestDay = (): number => {
    const max = Math.max(...stats.weeklyTasks);
    return stats.weeklyTasks.indexOf(max);
  };
  
  // Convert day index to name
  const getDayName = (index: number): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[index];
  };
  
  // Get color for trend
  const getTrendColor = (): string => {
    if (stats.trend === 'up') return 'text-green-500';
    if (stats.trend === 'down') return 'text-red-500';
    return 'text-gray-500';
  };
  
  // Get icon for trend
  const getTrendIcon = (): React.ReactElement | null => {
    if (stats.trend === 'up') return <ArrowUpIcon className="w-4 h-4 text-green-500" />;
    if (stats.trend === 'down') return <ArrowDownIcon className="w-4 h-4 text-red-500" />;
    return null;
  };
  
  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-xl p-6 mb-6 ${className || ''}`}>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100 ${className || ''}`}>
      <h2 className="text-lg font-semibold mb-4 text-gray-700">Dashboard Stats</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Completed Today */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-blue-600 font-medium">Completed</span>
            <CheckCircleIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-2 flex items-end gap-1">
            <span className="text-2xl font-bold text-blue-700">{stats.tasksCompletedToday}</span>
            <span className="text-sm text-blue-500 mb-1">today</span>
            <div className="ml-auto">{getTrendIcon()}</div>
          </div>
        </div>
        
        {/* Current Streak */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-orange-600 font-medium">Streak</span>
            <FireIcon className="w-5 h-5 text-orange-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-orange-700">{streakCount || 0}</span>
            <span className="text-sm text-orange-500 ml-1">days</span>
          </div>
        </div>
        
        {/* Completion Rate */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-green-600 font-medium">Success Rate</span>
            <ChartBarIcon className="w-5 h-5 text-green-500" />
          </div>
          <div className="mt-2 flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
            <span className="ml-2 text-lg font-bold text-green-700">{stats.completionRate}%</span>
          </div>
        </div>
        
        {/* Best Day */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-purple-600 font-medium">Best Day</span>
            <CalendarIcon className="w-5 h-5 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-purple-700">
              {getDayName(getHighestDay())}
            </span>
            <span className="text-sm text-purple-500 ml-1">
              {stats.weeklyTasks[getHighestDay()]} tasks
            </span>
          </div>
        </div>
      </div>
      
      {/* Weekly Chart */}
      <div className="mt-6">
        <div className="flex items-end h-24 gap-1">
          {stats.weeklyTasks.map((count, index) => {
            const today = new Date().getDay();
            const maxCount = Math.max(...stats.weeklyTasks, 1);
            const height = count > 0 ? (count / maxCount) * 100 : 5;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full rounded-t-sm ${
                    index === today 
                      ? 'bg-blue-500' 
                      : count > 0 ? 'bg-blue-200' : 'bg-gray-100'
                  }`}
                  style={{ height: `${height}%` }}
                ></div>
                <div className={`text-xs mt-1 ${index === today ? 'font-bold' : ''}`}>
                  {getDayName(index)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardStatsComponent;