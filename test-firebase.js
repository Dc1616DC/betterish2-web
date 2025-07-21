// Simple Firebase test
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAIagVTVnvTAynzWpR1rN9LYjqP0VR-jRY",
  authDomain: "betterish.firebaseapp.com", 
  projectId: "betterish",
  storageBucket: "betterish.appspot.com",
  messagingSenderId: "518718685590",
  appId: "1:518718685590:web:81365b3437a62636bd5db7"
};

console.log('Testing Firebase...');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
console.log('Firebase app:', app);
console.log('Firebase auth:', auth);
