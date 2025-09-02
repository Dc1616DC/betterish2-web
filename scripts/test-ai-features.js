#!/usr/bin/env node

/**
 * Test AI features of the app
 */

const fetch = require('node-fetch');

async function testAIFeatures() {
  console.log('🤖 Testing AI Features...\n');
  
  // Test 1: AI Check-in endpoint
  console.log('1️⃣ Testing AI Check-in endpoint...');
  try {
    const response = await fetch('http://localhost:3001/api/ai-checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-user',
        action: 'check_in',
        userTasks: [
          { title: 'Review quarterly reports', category: 'work' },
          { title: 'Call mom', category: 'personal' }
        ]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ AI Check-in working!');
      console.log('   Response:', data.message ? data.message.substring(0, 100) + '...' : 'OK');
    } else {
      console.log('❌ AI Check-in failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ AI Check-in error:', error.message);
  }
  
  console.log('\n2️⃣ Testing Sidekick Chat endpoint...');
  try {
    const response = await fetch('http://localhost:3001/api/sidekick-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: {
          id: 'test-task-1',
          title: 'Organize home office',
          detail: 'Need to declutter and set up productivity space',
          category: 'personal'
        },
        message: 'How can I tackle this task efficiently?',
        conversationHistory: [],
        userProfile: {
          id: 'test-user',
          tier: 'free'
        }
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sidekick Chat working!');
      console.log('   Response:', data.response ? data.response.substring(0, 100) + '...' : 'OK');
    } else {
      console.log('❌ Sidekick Chat failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Sidekick Chat error:', error.message);
  }
  
  console.log('\n🎉 AI Features test complete!');
}

testAIFeatures();