import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getDevelopmentalContext } from '@/lib/developmental-stages';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, userProfile, userMessage, chatHistory } = body;

    if (!task || !userMessage) {
      return NextResponse.json(
        { error: 'Task and user message are required' },
        { status: 400 }
      );
    }

    // Get developmental context if child's age is available
    let developmentalContext = '';
    if (userProfile?.children?.[0]?.ageInMonths) {
      developmentalContext = getDevelopmentalContext(userProfile.children[0].ageInMonths);
    }

    // Build context for the AI
    const contextParts = [
      '=== TASK CONTEXT ===',
      `Task: ${task.title}`,
      task.description ? `Description: ${task.description}` : '',
      `Category: ${task.category}`,
      `Priority: ${task.priority}`,
      task.aiGenerated ? '(This task was suggested by AI)' : '',
    ];

    if (userProfile) {
      contextParts.push(
        '',
        '=== USER PROFILE ===',
        userProfile.name ? `Name: ${userProfile.name}` : '',
        userProfile.hasPartner !== undefined ? `Has Partner: ${userProfile.hasPartner ? 'Yes' : 'No'}` : '',
        userProfile.state ? `Location: ${userProfile.state}` : '',
        userProfile.isHomeowner !== undefined ? `Homeowner: ${userProfile.isHomeowner ? 'Yes' : 'No'}` : '',
        userProfile.homeType ? `Home Type: ${userProfile.homeType}` : '',
        userProfile.workSituation ? `Work: ${userProfile.workSituation}` : '',
      );
    }

    if (developmentalContext) {
      contextParts.push('', '=== CHILD DEVELOPMENTAL STAGE ===', developmentalContext);
    }

    const context = contextParts.filter(Boolean).join('\n');

    // Build message history
    const messages: Anthropic.MessageParam[] = [];

    // Add previous chat history if exists
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach((msg: { role: 'user' | 'assistant'; content: string }) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: `You are a supportive "Dad Sidekick" AI assistant helping a father manage his tasks and family life. You're practical, encouraging, and understand the challenges of being a parent.

${context}

Guidelines:
- Be conversational and supportive, like a friend who's also a dad
- Give practical, actionable advice
- If discussing child development activities, reference the developmental stage information provided
- Keep responses concise but helpful
- Use a warm, encouraging tone
- Don't over-explain obvious things - dads are smart
- If the task is about the child, make suggestions age-appropriate
- Remember the context (homeowner vs renter, work situation, etc.) when giving advice`,
      messages,
    });

    const aiMessage = response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({
      message: aiMessage,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (error: any) {
    console.error('AI Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
