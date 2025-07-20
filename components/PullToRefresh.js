'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function PullToRefresh({ onRefresh, children }) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const startY = useRef(0);
  const scrollElement = useRef(null);
  const maxPullDistance = 100;
  const triggerDistance = 60;

  const handleTouchStart = (e) => {
    if (scrollElement.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, (currentY - startY.current) * 0.6); // Resistance factor
    
    if (distance > 0 && scrollElement.current?.scrollTop === 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, maxPullDistance));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= triggerDistance) {
      setIsRefreshing(true);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(25);
      }
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 500);
      }
    } else {
      setPullDistance(0);
    }
  };

  const getRefreshText = () => {
    if (isRefreshing) return 'Refreshing...';
    if (pullDistance >= triggerDistance) return 'Release to refresh';
    if (pullDistance > 0) return 'Pull to refresh';
    return '';
  };

  const getRotation = () => {
    if (isRefreshing) return 'rotate-180';
    return pullDistance >= triggerDistance ? 'rotate-180' : 'rotate-0';
  };

  return (
    <div 
      ref={scrollElement}
      className="relative h-full overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${Math.min(pullDistance, maxPullDistance)}px)`,
        transition: isPulling || isRefreshing ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull to refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center bg-blue-50 border-b border-blue-100"
          style={{ 
            height: `${Math.min(pullDistance, maxPullDistance)}px`,
            transform: `translateY(-${Math.min(pullDistance, maxPullDistance)}px)`
          }}
        >
          <div className="flex items-center gap-2 text-blue-600">
            <ArrowPathIcon 
              className={`w-5 h-5 transition-transform duration-200 ${getRotation()} ${
                isRefreshing ? 'animate-spin' : ''
              }`} 
            />
            <span className="text-sm font-medium">{getRefreshText()}</span>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}
