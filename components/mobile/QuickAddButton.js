'use client';

import { PlusIcon } from '@heroicons/react/24/outline';

export default function QuickAddButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30"
      style={{ 
        bottom: `calc(5rem + env(safe-area-inset-bottom) + 1rem)` 
      }}
    >
      <PlusIcon className="w-6 h-6" />
    </button>
  );
}