'use client';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Factory to init on demand (called in effects)
export function initializeFirebaseClient() {
  if (typeof window === 'undefined') {
    // Attempted Firebase init on server-side
    return { app: null, auth: null, db: null };
  }

  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Note: Offline persistence handled elsewhere to avoid conflicts
    
    // Firebase initialized successfully
    return { app, auth, db };
  } catch (err) {
    // Firebase initialization failed
    console.error('Firebase initialization failed:', err);
    return { app: null, auth: null, db: null };
  }
}

// Export singleton instances for compatibility with existing code
let firebaseInstances = null;

function getFirebaseInstances() {
  if (typeof window !== 'undefined' && !firebaseInstances) {
    firebaseInstances = initializeFirebaseClient();
  }
  return firebaseInstances || { app: null, auth: null, db: null };
}

export const auth = typeof window !== 'undefined' ? getFirebaseInstances().auth : null;
export const db = typeof window !== 'undefined' ? getFirebaseInstances().db : null;
