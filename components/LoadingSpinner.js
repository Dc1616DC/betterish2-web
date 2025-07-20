'use client';

import { useState } from 'react';

export default function LoadingSpinner({ size = 'medium', text = 'Loading...' }) {
  const sizes = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8', 
    large: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`${sizes[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-500`}></div>
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
}
