import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI with the same API key used for transcription
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { taskTitle, context } = await request.json();
    
    if (!taskTitle) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    const prompt = `Break down this task into 3-6 specific, actionable subtasks for a busy parent to complete. Focus on practical, concrete steps that can be done individually.

Task: "${taskTitle}"
${context ? `Context: ${context}` : ''}

Return ONLY a JSON array of subtask titles (strings), no other text or formatting. Each subtask should be a clear action someone can complete in 15-60 minutes.

Example format: ["Step 1 description", "Step 2 description", "Step 3 description"]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content.trim();
    
    try {
      // Parse the JSON response
      const subtasks = JSON.parse(responseText);
      
      if (!Array.isArray(subtasks)) {
        throw new Error('Response is not an array');
      }

      // Validate and clean the subtasks
      const cleanedSubtasks = subtasks
        .filter(task => typeof task === 'string' && task.length > 5)
        .slice(0, 6) // Limit to 6 subtasks max
        .map(task => task.trim());

      if (cleanedSubtasks.length === 0) {
        throw new Error('No valid subtasks generated');
      }

      return NextResponse.json({ 
        subtasks: cleanedSubtasks,
        originalTask: taskTitle 
      });

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      
      // Fallback: try to extract task-like content from response
      const lines = responseText.split('\n')
        .filter(line => line.trim().length > 5)
        .slice(0, 6);
        
      if (lines.length > 0) {
        return NextResponse.json({ 
          subtasks: lines.map(line => line.replace(/^[\d\.\-\*\s]+/, '').trim()),
          originalTask: taskTitle 
        });
      } else {
        throw new Error('Could not parse AI response');
      }
    }

  } catch (error) {
    console.error('AI breakdown error:', error);
    
    // Return generic fallback subtasks based on common patterns
    const genericSubtasks = generateFallbackSubtasks(taskTitle);
    
    return NextResponse.json({ 
      subtasks: genericSubtasks,
      originalTask: taskTitle,
      fallback: true
    });
  }
}

function generateFallbackSubtasks(taskTitle) {
  const task = taskTitle.toLowerCase();
  
  // Common project patterns
  if (task.includes('organize') || task.includes('clean')) {
    return [
      "Sort items into keep/donate/trash",
      "Clean and prepare the space", 
      "Set up organization system",
      "Put everything in its place"
    ];
  }
  
  if (task.includes('plan') && task.includes('party')) {
    return [
      "Set date and guest list",
      "Choose venue or location",
      "Plan menu and order supplies",
      "Send invitations",
      "Prepare day-of timeline"
    ];
  }
  
  if (task.includes('fix') || task.includes('repair')) {
    return [
      "Diagnose the problem",
      "Gather necessary tools and materials",
      "Complete the repair",
      "Test that it's working properly"
    ];
  }
  
  // Generic fallback
  return [
    "Research and plan approach",
    "Gather necessary materials",
    "Complete the main work",
    "Review and finalize"
  ];
}