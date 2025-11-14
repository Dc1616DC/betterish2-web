'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { db } from '@/lib/instantdb';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, user, error } = db.useAuth();

  // Query user profile to check onboarding status
  const { data: userData, isLoading: isLoadingProfile } = db.useQuery(
    user ? { users: { $: { where: { id: user.id } } } } : null
  );

  const userProfile = userData?.users?.[0];

  useEffect(() => {
    // Skip auth check on public pages
    if (pathname === '/login') {
      return;
    }

    // Redirect to login if not authenticated
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    // Redirect to dashboard if authenticated and on login page
    if (!isLoading && user && pathname === '/login') {
      router.push('/dashboard');
      return;
    }

    // Check onboarding status once profile is loaded
    if (!isLoading && !isLoadingProfile && user && pathname !== '/onboarding') {
      // If user profile doesn't exist or onboarding not completed, redirect to onboarding
      if (!userProfile || !userProfile.onboardingCompleted) {
        router.push('/onboarding');
      }
    }
  }, [isLoading, isLoadingProfile, user, userProfile, pathname, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
