// lib/firebase.js
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

console.log('🔥 Firebase module loading...');

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
console.log('🔥 Firebase app initialized:', app.name);

const auth = getAuth(app);
console.log('🔥 Firebase auth initialized:', !!auth);

const db = getFirestore(app);
console.log('🔥 Firebase firestore initialized:', !!db);

export { auth, db };