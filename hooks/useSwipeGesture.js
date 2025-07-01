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

  // Touch Events (Mobile)
  const handleTouchStart = useCallback((e) => {
    if (isDisabled) return;
    e.preventDefault();
    actionTriggered.current = false;
    touchStartX.current = e.targetTouches[0].clientX;
    isSwiping.current = true;
    setSwipeDistance(0);
    console.log('Touch start');
  }, [isDisabled]);

  const handleTouchMove = useCallback((e) => {
    if (isDisabled || !isSwiping.current) return;
    e.preventDefault();
    const currentX = e.targetTouches[0].clientX;
    const distance = currentX - touchStartX.current;
    setSwipeDistance(distance * RESISTANCE_FACTOR);
  }, [isDisabled]);

  const handleTouchEnd = useCallback(() => {
    if (isDisabled || !isSwiping.current || actionTriggered.current) return;

    if (swipeDistance > SWIPE_RIGHT_THRESHOLD) {
      actionTriggered.current = true;
      console.log('Swipe right - mark done');
      if (onSwipeRight) onSwipeRight();
    } else if (swipeDistance < SWIPE_FAR_LEFT_THRESHOLD) {
      actionTriggered.current = true;
      console.log('Swipe far left - dismiss');
      if (onSwipeFarLeft) onSwipeFarLeft();
    } else if (swipeDistance < SWIPE_LEFT_THRESHOLD) {
      actionTriggered.current = true;
      console.log('Swipe left - snooze');
      if (onSwipeLeft) onSwipeLeft();
    }

    isSwiping.current = false;
    if (!actionTriggered.current) {
      setSwipeDistance(0);
    }
  }, [isDisabled, swipeDistance, onSwipeRight, onSwipeLeft, onSwipeFarLeft]);

  // Mouse Events (Desktop)
  const handleMouseDown = useCallback((e) => {
    if (isDisabled) return;
    e.preventDefault();
    actionTriggered.current = false;
    touchStartX.current = e.clientX;
    isSwiping.current = true;
    setSwipeDistance(0);
    console.log('Mouse down');

    const handleMouseMove = (e) => {
      if (isDisabled || !isSwiping.current) return;
      const distance = e.clientX - touchStartX.current;
      setSwipeDistance(distance * RESISTANCE_FACTOR);
    };

    const handleMouseUp = () => {
      if (isSwiping.current) {
        handleTouchEnd();
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [isDisabled, handleTouchEnd]);

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
