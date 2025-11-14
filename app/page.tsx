'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/instantdb';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = db.useAuth();
  const [timeout, setTimeout] = useState(false);

  useEffect(() => {
    // Timeout after 5 seconds - just go to login if InstantDB is slow
    const timer = window.setTimeout(() => {
      setTimeout(true);
      router.push('/login');
    }, 5000);

    if (!isLoading) {
      clearTimeout(timer);
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }

    return () => clearTimeout(timer);
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">{timeout ? 'Redirecting to login...' : 'Loading...'}</p>
      </div>
    </div>
  );
}
