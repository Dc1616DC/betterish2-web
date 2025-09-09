// lib/firebase.ts
'use client';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Client-safe Firebase initialization with proper typing
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let dbInstance: Firestore | null = null;

if (typeof window !== 'undefined') {
  // Only initialize on client side
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  dbInstance = getFirestore(app);
  
  // Development emulator setup - simplified and more robust
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
    // Use a more reliable flag check
    const win = window as any;
    
    if (!win.__firebaseEmulatorsInitialized) {
      win.__firebaseEmulatorsInitialized = true;
      
      // Import and connect emulators with proper error handling
      Promise.all([
        import('firebase/auth'),
        import('firebase/firestore')
      ]).then(([authModule, firestoreModule]) => {
        const { connectAuthEmulator } = authModule;
        const { connectFirestoreEmulator } = firestoreModule;
        
        // Check auth emulator
        try {
          if (auth && !(auth as any).emulatorConfig) {
            connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
            console.log('✅ Auth emulator connected');
          }
        } catch (error) {
          // Silently ignore if already connected
          if (error instanceof Error && !error.message.includes('already been called')) {
            console.warn('Auth emulator:', error.message);
          }
        }
        
        // Check Firestore emulator
        try {
          if (dbInstance && !(dbInstance as any)._settings?.host?.includes('localhost')) {
            connectFirestoreEmulator(dbInstance, 'localhost', 8080);
            console.log('✅ Firestore emulator connected');
          }
        } catch (error) {
          // Silently ignore if already connected
          if (error instanceof Error && !error.message.includes('already been called')) {
            console.warn('Firestore emulator:', error.message);
          }
        }
      }).catch(error => {
        console.warn('Emulator setup skipped:', error);
      });
    }
  }
}

// Export db with non-null assertion for components that expect it to be initialized
export { auth };
export const db = dbInstance as Firestore; // Components should check if Firebase is initialized
export type { FirebaseApp, Auth, Firestore };