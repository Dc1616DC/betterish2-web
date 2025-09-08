'use client';

import React from 'react';

interface SwipeGestureOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  onSwipeFarLeft?: () => void;
  isDisabled?: boolean;
}

interface SwipeGestureReturn {
  swipeDistance: number;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onMouseDown: (e: React.MouseEvent) => void;
  };
}

// DEPRECATED: Swipe gestures have been removed from the app
// This hook is kept for compatibility but will not function
export const useSwipeGesture = ({
  onSwipeRight,
  onSwipeLeft,
  onSwipeFarLeft,
  isDisabled = true, // Always disabled now
}: SwipeGestureOptions): SwipeGestureReturn => {
  // Return disabled handlers
  return {
    swipeDistance: 0,
    handlers: {
      onTouchStart: () => {},
      onTouchMove: () => {},
      onTouchEnd: () => {},
      onMouseDown: () => {},
    },
  };
};