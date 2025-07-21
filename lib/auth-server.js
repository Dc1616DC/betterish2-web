import { cookies } from 'next/headers';
import { adminAuth } from './firebase-admin';

export async function getServerSession() {
  const sessionCookie = cookies().get('session')?.value;
  
  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const user = await adminAuth.getUser(decodedClaims.uid);
    return user;
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getServerSession();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}
