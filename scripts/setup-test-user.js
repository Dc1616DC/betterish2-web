const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');

// Firebase Admin configuration
// Load environment variables first
require('dotenv').config({ path: '.env.local' });

if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
  console.error('❌ Missing Firebase Admin environment variables');
  console.error('   Required: FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_CLIENT_EMAIL');
  process.exit(1);
}

const serviceAccount = {
  type: "service_account",
  project_id: "betterish",
  private_key_id: "1", // Dummy value
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  client_id: "1", // Dummy value
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
};

// Test user credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test123!';
const TEST_UID = 'test-user-for-testsprite';

async function setupTestUser() {
  try {
    console.log('🔧 Setting up Firebase Admin...');
    
    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: 'betterish'
    });

    const auth = getAuth(app);
    console.log('✅ Firebase Admin initialized');

    // Check if test user already exists
    console.log(`🔍 Checking if test user exists: ${TEST_EMAIL}`);
    
    try {
      const existingUser = await auth.getUserByEmail(TEST_EMAIL);
      console.log(`✅ Test user already exists with UID: ${existingUser.uid}`);
      
      // Update password to ensure it matches our test password
      await auth.updateUser(existingUser.uid, {
        password: TEST_PASSWORD
      });
      console.log('✅ Test user password updated');
      
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('📝 Test user not found, creating...');
        
        // Create the test user
        const userRecord = await auth.createUser({
          uid: TEST_UID,
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          emailVerified: true,
          disabled: false
        });
        
        console.log(`✅ Test user created with UID: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    console.log('🎉 Test user setup complete!');
    console.log('📋 Test Credentials:');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error setting up test user:', error);
    process.exit(1);
  }
}

setupTestUser();