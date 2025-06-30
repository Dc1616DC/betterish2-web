// lib/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug: log the config so we can compare local vs production
// NOTE: these are public Firebase keys; safe to log.
// eslint-disable-next-line no-console
console.log('[Firebase] Initialising with config:', firebaseConfig);

let app;
try {
  // Avoid “Firebase app already exists” when HMR runs locally
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  // eslint-disable-next-line no-console
  console.log('[Firebase] Firebase initialised successfully');
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[Firebase] Failed to initialise Firebase:', err);
  throw err;
}

export const auth = getAuth(app);
export const db = getFirestore(app);