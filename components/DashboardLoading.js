'use client';

export default function DashboardLoading({ 
  message = "Loading your tasks...", 
  showSkeleton = true 
}) {
  if (showSkeleton) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>

        {/* Task list skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-20 w-full"></div>
          ))}
        </div>

        {/* Bottom nav skeleton */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t animate-pulse">
          <div className="flex justify-around py-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 w-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
