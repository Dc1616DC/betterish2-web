import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_API_KEY = process.env.GROK_API_KEY;

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map();

function checkRateLimit(userId, tier) {
  // TEMPORARILY DISABLED FOR TESTING
  console.log('⚠️ Rate limiting temporarily disabled for testing');
  return true;
  
  const key = `${userId}-${new Date().toISOString().slice(0, 7)}`; // monthly key
  const current = rateLimitStore.get(key) || 0;
  
  const limits = {
    free: 3,
    premium: 100,
    family: 150
  };
  
  if (current >= limits[tier]) {
    return false;
  }
  
  rateLimitStore.set(key, current + 1);
  return true;
}

function buildDadSidekickPrompt(task, userProfile, conversationHistory) {
  const isProject = task.category === 'project' && task.subtasks;
  
  let taskContext;
  if (isProject) {
    const completedSubtasks = task.subtasks.filter(st => st.completed);
    const pendingSubtasks = task.subtasks.filter(st => !st.completed);
    
    taskContext = `
CURRENT PROJECT CONTEXT:
- Project: "${task.title}"
- Progress: ${completedSubtasks.length}/${task.subtasks.length} steps completed
- Remaining steps: ${pendingSubtasks.map(st => st.title).join(', ')}
- Completed steps: ${completedSubtasks.length > 0 ? completedSubtasks.map(st => st.title).join(', ') : 'None yet'}`;
  } else {
    taskContext = `
CURRENT TASK CONTEXT:
- Task: "${task.title}"
- Detail: "${task.detail}" 
- Category: ${task.category}`;
  }

  const contextPrompt = `You are a knowledgeable, supportive dad friend helping another modern father. Your name is "Sidekick" and you talk like a helpful neighbor dad who's been through this before.

${taskContext}

YOUR PERSONALITY:
- Practical and encouraging
- Slightly humorous but not cheesy
- Assumes he's competent but needs guidance
- Provides specific product recommendations with rough prices
- Mentions YouTube channels or tutorials when relevant
- Keeps responses conversational and under 150 words
- Never condescending - treat him as an equal

RESPONSE GUIDELINES:
- Start responses naturally (no "As a dad friend..." intros)
- Include specific brands/products when helpful
- Mention rough time estimates ("this usually takes about 30 minutes")
- Suggest backup plans for common problems
- Reference YouTube, Home Depot, Amazon when relevant
- Keep it practical and actionable
${isProject ? '- For projects, focus on the current step or offer advice on tackling remaining steps efficiently' : ''}

USER CONTEXT:
- Modern father trying to manage home, family, and personal responsibilities
- Values efficiency and competence
- Has limited time but wants to do things right

Conversation so far:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Respond as the Dad Sidekick to help with this ${isProject ? 'project' : 'task'}. Be conversational, practical, and supportive.`;

  return contextPrompt;
}

async function callGrokAPI(prompt, message) {
  if (!GROK_API_KEY) {
    throw new Error('GROK API key not configured');
  }

  const requestBody = {
    model: 'grok-4-0709',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: message }
    ],
    temperature: 0.7,
    max_tokens: 1000,
    stream: false
  };

  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GROK API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error(`Unexpected API response structure: ${JSON.stringify(data)}`);
    }
    
    const content = data.choices[0].message.content;
    return content || 'Sorry, I couldn\'t generate a response right now.';
    
  } catch (fetchError) {
    throw fetchError;
  }
}

async function logChatInteraction(userId, taskId, userMessage, assistantResponse) {
  try {
    if (!db) {
      console.log('Firestore admin not configured, skipping chat log');
      return;
    }
    
    const logRef = db.collection('chatLogs').doc(`${userId}_${Date.now()}`);
    await logRef.set({
      userId,
      taskId,
      userMessage,
      assistantResponse,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to log chat interaction:', error);
  }
}

export async function POST(request) {
  try {
    const { task, message, conversationHistory, userProfile } = await request.json();

    console.log('📨 Sidekick chat request received');
    console.log('Task:', task);
    console.log('Message:', message);
    console.log('User:', userProfile);

    // Validate required fields
    if (!task || !message || !userProfile?.id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check rate limit
    const userTier = userProfile.tier || 'free';
    if (!checkRateLimit(userProfile.id, userTier)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          suggestion: 'Upgrade to Pro for unlimited chat'
        },
        { status: 429 }
      );
    }

    // Build the dad-specific prompt
    const prompt = buildDadSidekickPrompt(task, userProfile, conversationHistory || []);

    // Call GROK API
    const grokResponse = await callGrokAPI(prompt, message);
    
    // DEBUG: Log what we got back
    console.log('🔄 Grok response received:', grokResponse);

    // Log the interaction for analytics
    await logChatInteraction(userProfile.id, task.id, message, grokResponse);

    return NextResponse.json({ 
      success: true, 
      response: grokResponse 
    });

  } catch (error) {
    console.error('Sidekick chat error:', error.message);
    console.error('Full error details:', error);
    
    // Include debug information in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      return NextResponse.json({ 
        success: false,
        error: error.message,
        debugInfo: {
          errorType: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
          hasGrokKey: !!GROK_API_KEY,
          grokKeyLength: GROK_API_KEY ? GROK_API_KEY.length : 0
        }
      });
    }
    
    // Provide fallback response for production
    const fallbackResponse = "I'm having trouble connecting right now, but here's what I'd suggest: break this down into smaller steps, check YouTube for tutorials on this specific task, and don't hesitate to ask for help at your local hardware store. You've got this, dad!";
    
    return NextResponse.json({ 
      success: true, 
      response: fallbackResponse,
      fallback: true
    });
  }
}