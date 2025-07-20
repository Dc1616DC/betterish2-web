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
  const currentDistance = useRef(0);

  // Shared end logic for both touch and mouse
  const handleEnd = useCallback(() => {
    if (isDisabled || !isSwiping.current) return;

    const finalDistance = currentDistance.current;

    // Only trigger actions if we haven't already triggered one
    if (!actionTriggered.current) {
      if (finalDistance > SWIPE_RIGHT_THRESHOLD) {
        actionTriggered.current = true;
        if (onSwipeRight) onSwipeRight();
      } else if (finalDistance < SWIPE_FAR_LEFT_THRESHOLD) {
        actionTriggered.current = true;
        if (onSwipeFarLeft) onSwipeFarLeft();
      } else if (finalDistance < SWIPE_LEFT_THRESHOLD) {
        actionTriggered.current = true;
        if (onSwipeLeft) onSwipeLeft();
      }
    }

    // Reset state
    isSwiping.current = false;
    currentDistance.current = 0;
    
    // Reset swipe distance with a small delay to allow action to complete
    setTimeout(() => {
      if (!actionTriggered.current) {
        setSwipeDistance(0);
      } else {
        // Reset for next gesture
        actionTriggered.current = false;
        setSwipeDistance(0);
      }
    }, 100);
  }, [isDisabled, onSwipeRight, onSwipeLeft, onSwipeFarLeft]);

  // Touch Events (Mobile)
  const handleTouchStart = useCallback((e) => {
    if (isDisabled) return;
    e.preventDefault();
    actionTriggered.current = false;
    touchStartX.current = e.targetTouches[0].clientX;
    isSwiping.current = true;
    currentDistance.current = 0;
    setSwipeDistance(0);
  }, [isDisabled]);

  const handleTouchMove = useCallback((e) => {
    if (isDisabled || !isSwiping.current) return;
    e.preventDefault();
    const currentX = e.targetTouches[0].clientX;
    const distance = currentX - touchStartX.current;
    const adjustedDistance = distance * RESISTANCE_FACTOR;
    currentDistance.current = adjustedDistance;
    setSwipeDistance(adjustedDistance);
  }, [isDisabled]);

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Mouse Events (Desktop)
  const handleMouseDown = useCallback((e) => {
    if (isDisabled) return;
    e.preventDefault();
    actionTriggered.current = false;
    touchStartX.current = e.clientX;
    isSwiping.current = true;
    currentDistance.current = 0;
    setSwipeDistance(0);

    const handleMouseMove = (e) => {
      if (isDisabled || !isSwiping.current) return;
      const distance = e.clientX - touchStartX.current;
      const adjustedDistance = distance * RESISTANCE_FACTOR;
      currentDistance.current = adjustedDistance;
      setSwipeDistance(adjustedDistance);
    };

    const handleMouseUp = () => {
      if (isSwiping.current) {
        handleEnd();
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [isDisabled, handleEnd]);

  return {
    swipeDistance,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
    },
  };
};
