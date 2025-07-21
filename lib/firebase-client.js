'use client';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAIagVTVnvTAynzWpR1rN9LYjqP0VR-jRY",
  authDomain: "betterish.firebaseapp.com",
  projectId: "betterish",
  storageBucket: "betterish.appspot.com",
  messagingSenderId: "518718685590",
  appId: "1:518718685590:web:81365b3437a62636bd5db7"
};

// Factory to init on demand (called in effects)
export function initializeFirebaseClient() {
  if (typeof window === 'undefined') {
    console.warn('[Firebase Client] Attempted init on non-browser environment');
    return { app: null, auth: null, db: null };
  }

  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    console.log('[Firebase Client] Firebase initialized:', { 
      app: !!app, 
      auth: !!auth, 
      db: !!db,
      environment: 'client'  // Force client-only log
    });
    return { app, auth, db };
  } catch (err) {
    console.error('[Firebase Client] Init failed:', err);
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
