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
    if (isDisabled || !isSwiping.current || actionTriggered.current) return;

    const finalDistance = currentDistance.current;
    console.log('Swipe end, distance:', finalDistance);
    
    // MOBILE DEBUG: Show which threshold we're hitting
    alert(`Swipe end: ${finalDistance}. Thresholds: Right>${SWIPE_RIGHT_THRESHOLD}, Left<${SWIPE_LEFT_THRESHOLD}, FarLeft<${SWIPE_FAR_LEFT_THRESHOLD}`);

    if (finalDistance > SWIPE_RIGHT_THRESHOLD) {
      actionTriggered.current = true;
      console.log('✅ Swipe right - mark done');
      alert('TRIGGER: Swipe right - mark done');
      if (onSwipeRight) onSwipeRight();
    } else if (finalDistance < SWIPE_FAR_LEFT_THRESHOLD) {
      actionTriggered.current = true;
      console.log('🗑️ Swipe far left - dismiss');
      alert('TRIGGER: Swipe far left - dismiss');
      if (onSwipeFarLeft) onSwipeFarLeft();
    } else if (finalDistance < SWIPE_LEFT_THRESHOLD) {
      actionTriggered.current = true;
      console.log('😴 Swipe left - snooze');
      alert('TRIGGER: Swipe left - snooze');
      if (onSwipeLeft) onSwipeLeft();
    } else {
      alert(`NO ACTION: Distance ${finalDistance} not in any threshold range`);
    }

    isSwiping.current = false;
    currentDistance.current = 0;
    if (!actionTriggered.current) {
      setSwipeDistance(0);
    }
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
    console.log('📱 Touch start');
    alert('📱 Touch start at: ' + e.targetTouches[0].clientX);
  }, [isDisabled]);

  const handleTouchMove = useCallback((e) => {
    if (isDisabled || !isSwiping.current) return;
    e.preventDefault();
    const currentX = e.targetTouches[0].clientX;
    const distance = currentX - touchStartX.current;
    const adjustedDistance = distance * RESISTANCE_FACTOR;
    currentDistance.current = adjustedDistance;
    setSwipeDistance(adjustedDistance);
    console.log('📱 Touch move:', distance, '→', adjustedDistance);
  }, [isDisabled]);

  const handleTouchEnd = useCallback(() => {
    console.log('📱 Touch end');
    alert('📱 Touch end - calling handleEnd');
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
    console.log('🖱️ Mouse down');

    const handleMouseMove = (e) => {
      if (isDisabled || !isSwiping.current) return;
      const distance = e.clientX - touchStartX.current;
      const adjustedDistance = distance * RESISTANCE_FACTOR;
      currentDistance.current = adjustedDistance;
      setSwipeDistance(adjustedDistance);
      console.log('Mouse move distance:', distance, '→ adjusted:', adjustedDistance);
    };

    const handleMouseUp = () => {
      console.log('🖱️ Mouse up');
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
