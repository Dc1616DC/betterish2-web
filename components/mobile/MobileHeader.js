'use client';

export default function MobileHeader({ greeting, taskCount, streak, onLogout }) {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  
  return (
    <div className="px-4 py-4" style={{ paddingTop: `max(1rem, env(safe-area-inset-top))` }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {timeOfDay}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'} today
            {streak > 0 && ` • ${streak} day streak 🔥`}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="p-2 text-gray-500 hover:text-red-600 active:text-red-700"
          title="Sign out"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
}