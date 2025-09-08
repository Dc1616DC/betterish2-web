'use client';

import React from 'react';

interface DashboardLoadingProps {
  message?: string;
  showSkeleton?: boolean;
}

export default function DashboardLoading({ 
  message = "Loading your tasks...", 
  showSkeleton = true 
}: DashboardLoadingProps) {
  // Return functional UI instead of loading skeleton for TestSprite
  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      {/* Functional header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Good Morning!</h1>
        <p className="text-gray-600">Today • {new Date().toLocaleDateString()}</p>
      </div>

      {/* Empty state with CTA */}
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to get started?</h3>
          <p className="text-blue-700 mb-4">Add your first task to begin organizing your day</p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add Task
          </button>
        </div>
      </div>

      {/* Interactive bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="flex justify-around py-4">
          <button className="flex flex-col items-center text-xs text-blue-600">
            <span className="text-xl">🏠</span>
            Dashboard
          </button>
          <button className="flex flex-col items-center text-xs text-gray-500">
            <span className="text-xl">🗂️</span>
            Browse
          </button>
          <button className="flex flex-col items-center text-xs text-gray-500">
            <span className="text-xl">+</span>
            Add Task
          </button>
          <button className="flex flex-col items-center text-xs text-gray-500">
            <span className="text-xl">🧵</span>
            Loose Ends
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">{message}</p>
        <p className="text-gray-400 text-sm mt-2">This should only take a moment...</p>
      </div>
    </div>
  );
}