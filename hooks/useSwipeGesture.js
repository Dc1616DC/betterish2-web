'use client';

import { useState, useRef, useCallback } from 'react';

// DEPRECATED: Swipe gestures have been removed from the app
// This hook is kept for compatibility but will not function
export const useSwipeGesture = ({
  onSwipeRight,
  onSwipeLeft,
  onSwipeFarLeft,
  isDisabled = true, // Always disabled now
}) => {
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