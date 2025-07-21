'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { initializeFirebaseClient } from '@/lib/firebase-client';  // Use client-only Firebase factory
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [auth, setAuth] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Initialize Firebase auth on client side
    const { auth: firebaseAuth } = initializeFirebaseClient();
    setAuth(firebaseAuth);
    
    console.log('Login: Component mounted, checking auth...');
    console.log('Auth object:', firebaseAuth);
    
    // Check if user is already logged in with debouncing to prevent redirect loops
    if (firebaseAuth) {
      let authStabilized = false;
      const stabilizationTimer = setTimeout(() => {
        authStabilized = true;
      }, 1000); // Wait 1 second for auth state to stabilize

      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
        
        // Only redirect if auth state has stabilized
        if (user && authStabilized) {
          clearTimeout(stabilizationTimer);
          router.push('/dashboard');
        }
      });
      
      return () => {
        clearTimeout(stabilizationTimer);
        unsubscribe();
      };
    } else {
      console.log('Auth object is null');
    }
  }, [router]);

  // Show loading until component is mounted
  if (!mounted) {
    return (
      <main className="max-w-md mx-auto p-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      </main>
    );
  }

  // If Firebase auth is still not available after mounting, show error
  if (!auth) {
    console.error('Firebase auth not available');
    return (
      <main className="max-w-md mx-auto p-4 min-h-screen flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="mb-2">⚠️ Firebase authentication is not available.</p>
          <p className="text-sm mt-2 mb-4">This could be due to missing environment variables.</p>
          <div className="text-left text-xs bg-gray-100 p-3 rounded mb-4">
            <p>Check that these env vars are set:</p>
            <ul className="mt-2 space-y-1">
              <li>• NEXT_PUBLIC_FIREBASE_API_KEY</li>
              <li>• NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
              <li>• NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
              <li>• NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</li>
              <li>• NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</li>
              <li>• NEXT_PUBLIC_FIREBASE_APP_ID</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // onAuthStateChanged will handle the redirect
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
      <h1 className="text-2xl font-bold mb-4">{isRegistering ? 'Create Account' : 'Log In'}</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="email"
          placeholder="Email"
          autoFocus
          className="w-full p-3 border border-gray-300 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border border-gray-300 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
        >
          {loading ? 'Loading...' : isRegistering ? 'Create Account' : 'Log In'}
        </button>
      </form>
      <button
        onClick={() => setIsRegistering(!isRegistering)}
        className="mt-4 text-sm text-blue-600 hover:underline"
      >
        {isRegistering ? 'Already have an account? Log in' : "Don't have an account? Create one"}
      </button>
    </div>
  );
}
