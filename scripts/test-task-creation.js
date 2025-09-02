#!/usr/bin/env node

/**
 * Test task creation with the new architecture
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAIagVTVnvTAynzWpR1rN9LYjqP0VR-jRY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "betterish.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "betterish",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "betterish.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "855646080247",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:855646080247:web:8c3a4e4f4e4f4e4f4e4f4e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testTaskCreation() {
  console.log('🧪 Testing task creation with new architecture...\n');
  
  try {
    // Create or sign in test user
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    const password = 'test123456';
    
    console.log('📧 Signing in test user...');
    let user;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
      console.log('✅ Signed in successfully\n');
    } catch (error) {
      if (error.code === 'auth/invalid-credential') {
        // Try to create the user
        console.log('📝 Creating test user...');
        const { createUserWithEmailAndPassword } = require('firebase/auth');
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          user = userCredential.user;
          console.log('✅ Test user created and signed in\n');
        } catch (createError) {
          console.log('❌ Failed to create user:', createError.message);
          process.exit(1);
        }
      } else {
        console.log('❌ Sign in failed:', error.message);
        process.exit(1);
      }
    }
    
    // Create a test task
    console.log('📝 Creating test task...');
    const taskData = {
      title: 'Test Task ' + new Date().toISOString(),
      description: 'This is a test task created by the new architecture',
      category: 'personal',
      priority: 'medium',
      status: 'active',
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completed: false,
      completedAt: null,
      dismissed: false,
      deleted: false,
      snoozedUntil: null
    };
    
    const docRef = await addDoc(collection(db, 'tasks'), taskData);
    console.log('✅ Task created with ID:', docRef.id, '\n');
    
    // Query tasks to verify
    console.log('🔍 Querying tasks for user...');
    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    
    console.log(`✅ Found ${snapshot.size} task(s) for user\n`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('Task:', {
        id: doc.id,
        title: data.title,
        status: data.status,
        category: data.category
      });
    });
    
    console.log('\n🎉 Task creation test successful!');
    console.log('✅ The new architecture is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testTaskCreation();