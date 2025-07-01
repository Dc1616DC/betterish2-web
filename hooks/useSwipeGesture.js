'use client';

import { useState, useRef, useCallback } from 'react';

const SWIPE_RIGHT_THRESHOLD = 30;
const SWIPE_LEFT_THRESHOLD = -40;
const SWIPE_FAR_LEFT_THRESHOLD = -120;
const RESISTANCE_FACTOR = 0.85;

export const useSwipeGesture = ({
  onSwipeRight,
  onSwipeLeft,
  onSwipeFarLeft,
  isDisabled = false,
}) => {
  const [swipeDistance, setSwipeDistance] = useState(0);
  const touchStartX = useRef(0);
  const isSwiping = useRef(false);
  const actionTriggered = useRef(false);

  const handleTouchStart = useCallback((e) => {
    if (isDisabled) return;
    actionTriggered.current = false;
    touchStartX.current = e.targetTouches[0].clientX;
    isSwiping.current = true;
    setSwipeDistance(0);
  }, [isDisabled]);

  const handleTouchMove = useCallback((e) => {
    if (isDisabled || !isSwiping.current) return;
    const currentX = e.targetTouches[0].clientX;
    const distance = currentX - touchStartX.current;
    setSwipeDistance(distance * RESISTANCE_FACTOR);
  }, [isDisabled]);

  const handleTouchEnd = useCallback(() => {
    if (isDisabled || !isSwiping.current || actionTriggered.current) return;

    if (swipeDistance > SWIPE_RIGHT_THRESHOLD) {
      actionTriggered.current = true;
      if (onSwipeRight) onSwipeRight();
    } else if (swipeDistance < SWIPE_FAR_LEFT_THRESHOLD) {
      actionTriggered.current = true;
      if (onSwipeFarLeft) onSwipeFarLeft();
    } else if (swipeDistance < SWIPE_LEFT_THRESHOLD) {
      actionTriggered.current = true;
      if (onSwipeLeft) onSwipeLeft();
    }

    isSwiping.current = false;
    if (!actionTriggered.current) {
        setSwipeDistance(0);
    }
  }, [isDisabled, swipeDistance, onSwipeRight, onSwipeLeft, onSwipeFarLeft]);

  return {
    swipeDistance,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};
