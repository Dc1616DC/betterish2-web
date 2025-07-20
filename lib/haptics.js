// Haptic feedback utility for mobile devices
export const hapticFeedback = {
  // Light tap for button presses
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  // Medium vibration for completed tasks
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  },
  
  // Strong vibration for important actions
  strong: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 10, 50]);
    }
  },
  
  // Success pattern for task completion
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10, 50]);
    }
  },
  
  // Error pattern for failed actions
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }
};

// Check if device supports haptic feedback
export const supportsHaptic = () => {
  return 'vibrate' in navigator;
};
