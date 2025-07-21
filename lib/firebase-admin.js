import 'server-only';  // Prevent client bundling
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp;
let adminAuth;
let adminDb;

// Only initialize if we have the required environment variables
const hasRequiredEnvVars = process.env.FIREBASE_ADMIN_CLIENT_EMAIL && 
                          process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
                          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (hasRequiredEnvVars) {
  try {
    const adminConfig = {
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    };
    
    adminApp = getApps().find(app => app.name === 'admin') || initializeApp(adminConfig, 'admin');
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    console.log('[Firebase Admin] Initialized successfully');
  } catch (error) {
    console.error('[Firebase Admin] Failed to initialize:', error);
  }
} else {
  console.warn('[Firebase Admin] Missing required environment variables, admin SDK disabled');
}

export { adminAuth, adminDb };
