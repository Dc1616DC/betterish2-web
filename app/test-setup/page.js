'use client';

import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { initializeFirebaseClient } from '@/lib/firebase-client';
import { useRouter } from 'next/navigation';

export default function TestSetupPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [auth, setAuth] = useState(null);
  const router = useRouter();

  // Test credentials that TestSprite will use
  const TEST_EMAIL = 'test@example.com';
  const TEST_PASSWORD = 'Test123!';

  useEffect(() => {
    const { auth: firebaseAuth } = initializeFirebaseClient();
    setAuth(firebaseAuth);
  }, []);

  const createTestUser = async () => {
    if (!auth) {
      setError('Firebase auth not initialized');
      return;
    }

    setMessage('Creating test user...');
    setError('');

    try {
      // Try to sign in first to check if user exists
      try {
        await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
        setMessage(`✅ Test user already exists: ${TEST_EMAIL}`);
        return;
      } catch (signInError) {
        // User doesn't exist, create it
        console.log('User does not exist, creating...');
      }

      // Create the test user
      const userCredential = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      setMessage(`✅ Test user created successfully: ${TEST_EMAIL}`);
      
      // Sign out so tests can log in
      await auth.signOut();
      
    } catch (err) {
      console.error('Error creating test user:', err);
      if (err.code === 'auth/email-already-in-use') {
        setMessage(`✅ Test user already exists: ${TEST_EMAIL}`);
      } else {
        setError(`Error: ${err.message}`);
      }
    }
  };

  const verifyTestUser = async () => {
    if (!auth) {
      setError('Firebase auth not initialized');
      return;
    }

    setMessage('Verifying test user...');
    setError('');

    try {
      await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      setMessage(`✅ Test user login successful! Redirecting to dashboard...`);
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Error verifying test user:', err);
      setError(`Login failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Setup</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Test Credentials:</strong>
          </p>
          <p className="text-sm text-blue-700 font-mono">
            Email: {TEST_EMAIL}<br/>
            Password: {TEST_PASSWORD}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={createTestUser}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Test User
          </button>

          <button
            onClick={verifyTestUser}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Verify Test User Login
          </button>

          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go to Login Page
          </button>
        </div>

        {message && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{message}</p>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}