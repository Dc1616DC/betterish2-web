#!/usr/bin/env node

/**
 * Simple Firestore cleanup using Firebase CLI
 * This bypasses Firebase Admin SDK authentication issues
 */

const { execSync } = require('child_process');

const TEMPLATE_PREFIXES = ['rel_', 'baby_', 'house_', 'self_', 'admin_', 'seas_', 'work_', 'health_', 'maint_', 'fam_', 'pers_', 'home_'];

console.log('🚀 Starting Firestore cleanup using Firebase CLI...\n');

try {
  // Check if Firebase CLI is authenticated
  console.log('Checking Firebase authentication...');
  const projects = execSync('firebase projects:list --json', { encoding: 'utf8' });
  const projectList = JSON.parse(projects);
  
  if (!projectList || projectList.length === 0) {
    console.log('❌ No Firebase projects found. Please run: firebase login');
    process.exit(1);
  }
  
  console.log('✅ Firebase CLI authenticated\n');
  
  // Use betterish project
  console.log('Setting Firebase project to betterish...');
  execSync('firebase use betterish', { stdio: 'inherit' });
  
  console.log('\n🔍 This script will help you identify tasks to delete.');
  console.log('Due to Firebase CLI limitations, you\'ll need to delete them manually in Firebase Console.\n');
  
  console.log('📝 Tasks to look for and delete in Firebase Console:');
  console.log('   Go to: https://console.firebase.google.com/project/betterish/firestore/data');
  console.log('   Collection: tasks');
  console.log('   Delete tasks with IDs starting with:');
  
  TEMPLATE_PREFIXES.forEach(prefix => {
    console.log(`   - ${prefix}`);
  });
  
  console.log('\n📋 Also delete tasks with these exact titles:');
  const templateTitles = [
    'Ask how her day was',
    'Put your phone away at dinner', 
    'Text her something appreciative',
    'Clean up after dinner',
    'Sit and talk for 5 mins',
    'Tell her one thing she\'s great at',
    'Wipe kitchen counters',
    'Quick toy pickup',
    'Take out trash',
    'Make the bed',
    'Do laundry',
    'Schedule dentist',
    'Check car oil',
    'Water plants'
  ];
  
  templateTitles.forEach(title => {
    console.log(`   - "${title}"`);
  });
  
  console.log('\n🔗 Direct link: https://console.firebase.google.com/project/betterish/firestore/data/~2Ftasks');
  console.log('\n💡 Pro tip: Use the Firebase Console filter to search for tasks by ID prefix');
  console.log('   Example: Filter by "Document ID" contains "rel_" to find all relationship tasks\n');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\nTry running: firebase login');
  process.exit(1);
}