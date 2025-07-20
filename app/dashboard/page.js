'use client';

import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues with Firebase Auth  
const DashboardClient = dynamic(() => import('./DashboardClient'), {
  ssr: false,
  loading: () => (
    <main className="max-w-2xl mx-auto p-4">
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading dashboard...</p>
      </div>
    </main>
  )
});

export default function Dashboard() {
  return <DashboardClient />;
}
