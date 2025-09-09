/**
 * Grok (xAI) Integration Service
 * Uses Grok API for task suggestions and AI features
 */

import { 
  Task, 
  User, 
  TaskCategory, 
  TaskPriority, 
  TaskSource,
  TaskStatus
} from '@/types/models';
import { 
  AiResponse, 
  AiSuggestion 
} from '@/types/ai';

interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokRequest {
  messages: GrokMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

interface GrokResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class GrokService {
  private apiKey: string | undefined;
  private baseUrl: string = 'https://api.x.ai/v1';
  private model: string = 'grok-beta'; // or 'grok-2' when available

  constructor() {
    this.apiKey = process.env.GROK_API_KEY;
  }

  /**
   * Generate daily task suggestions using Grok
   */
  async generateDailyMix(user: User, existingTasks: Task[]): Promise<AiResponse<AiSuggestion>> {
    if (!this.apiKey) {
      return this.getFallbackResponse(user);
    }

    try {
      const prompt = this.buildDailyMixPrompt(user, existingTasks);
      const response = await this.callGrokAPI({
        messages: [
          {
            role: 'system',
            content: `You are helping a busy dad manage household tasks to be more present with his family. 
                     Generate 3-5 balanced task suggestions that help him win at home.
                     Focus on: relationship, household, baby care, and personal wellness.
                     Keep tasks specific, actionable, and achievable in under 30 minutes.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const suggestions = this.parseGrokResponse(response, user);
      return {
        data: suggestions
      };
    } catch (error) {
      console.error('Grok API error:', error);
      return this.getFallbackResponse(user);
    }
  }

  /**
   * Call Grok API
   */
  private async callGrokAPI(request: GrokRequest): Promise<GrokResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        ...request
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Build prompt for daily mix generation
   */
  private buildDailyMixPrompt(user: User, existingTasks: Task[]): string {
    const tasksByCategory = this.analyzeTaskDistribution(existingTasks);
    const userContext = this.getUserContext(user);
    
    return `
User Context:
${userContext}

Current Tasks by Category:
${Object.entries(tasksByCategory).map(([cat, count]) => `- ${cat}: ${count} tasks`).join('\n')}

Generate 3-5 task suggestions that:
1. Balance underrepresented categories
2. Are specific and actionable
3. Can be completed in under 30 minutes
4. Help this dad be more present with his family

Format each suggestion as:
Title: [specific action]
Category: [relationship/household/baby/personal/health]
Priority: [high/medium/low]
Why: [brief reason this helps]
    `;
  }

  /**
   * Parse Grok's response into structured suggestions
   */
  private parseGrokResponse(response: GrokResponse, user: User): AiSuggestion {
    const content = response.choices[0]?.message?.content || '';
    const tasks: Task[] = [];
    
    // Parse the text response into structured tasks
    const suggestions = content.split('\n\n').filter(s => s.trim());
    
    suggestions.forEach(suggestion => {
      const lines = suggestion.split('\n');
      const title = this.extractField(lines, 'Title:') || 'Suggested task';
      const categoryStr = this.extractField(lines, 'Category:') || 'personal';
      const priorityStr = this.extractField(lines, 'Priority:') || 'medium';
      const why = this.extractField(lines, 'Why:') || '';
      
      tasks.push({
        id: `grok_${Date.now()}_${Math.random()}`,
        userId: user.uid,
        title,
        description: why,
        category: this.mapToTaskCategory(categoryStr),
        priority: this.mapToTaskPriority(priorityStr),
        status: TaskStatus.ACTIVE,
        source: TaskSource.AI_MENTOR,
        completed: false,
        isProject: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        snoozedUntil: null,
        aiGenerated: true,
        aiContext: {
          model: 'grok',
          confidence: 0.85
        }
      } as Task);
    });

    return {
      tasks: tasks.slice(0, 5), // Max 5 suggestions
      rationale: 'Grok\'s personalized suggestions to help you win at home',
      priority: 'medium',
      category: TaskCategory.PERSONAL,
      confidence: 0.85
    };
  }

  /**
   * Extract field value from parsed lines
   */
  private extractField(lines: string[], fieldName: string): string {
    const line = lines.find(l => l.startsWith(fieldName));
    return line ? line.replace(fieldName, '').trim() : '';
  }

  /**
   * Map string to TaskCategory enum
   */
  private mapToTaskCategory(category: string): TaskCategory {
    const normalized = category.toLowerCase().trim();
    const mapping: Record<string, TaskCategory> = {
      'relationship': TaskCategory.RELATIONSHIP,
      'household': TaskCategory.HOUSEHOLD,
      'baby': TaskCategory.BABY,
      'personal': TaskCategory.PERSONAL,
      'health': TaskCategory.HEALTH,
      'work': TaskCategory.WORK,
      'maintenance': TaskCategory.MAINTENANCE,
      'home_projects': TaskCategory.HOME_PROJECTS,
      'events': TaskCategory.EVENTS
    };
    return mapping[normalized] || TaskCategory.PERSONAL;
  }

  /**
   * Map string to TaskPriority enum
   */
  private mapToTaskPriority(priority: string): TaskPriority {
    const normalized = priority.toLowerCase().trim();
    const mapping: Record<string, TaskPriority> = {
      'high': TaskPriority.HIGH,
      'medium': TaskPriority.MEDIUM,
      'low': TaskPriority.LOW
    };
    return mapping[normalized] || TaskPriority.MEDIUM;
  }

  /**
   * Analyze task distribution by category
   */
  private analyzeTaskDistribution(tasks: Task[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    Object.values(TaskCategory).forEach(cat => {
      distribution[cat] = 0;
    });
    
    tasks.forEach(task => {
      if (task.category) {
        distribution[task.category] = (distribution[task.category] || 0) + 1;
      }
    });
    
    return distribution;
  }

  /**
   * Build user context string for Grok
   */
  private getUserContext(user: User): string {
    const profile = user.profile || {};
    const contexts = [];
    
    if (profile.hasPartner) contexts.push('Has a partner');
    if (profile.hasChildren) contexts.push(`Has children (ages: ${profile.childrenAges?.join(', ') || 'unknown'})`);
    if (profile.isHomeowner) contexts.push('Homeowner');
    if (profile.workType) contexts.push(`Work: ${profile.workType}`);
    if (profile.state) contexts.push(`Location: ${profile.state}`);
    
    return contexts.length > 0 ? contexts.join(', ') : 'Busy professional managing home and family';
  }

  /**
   * Get fallback response when Grok is unavailable
   */
  private getFallbackResponse(user: User): AiResponse<AiSuggestion> {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    const tasks: Task[] = [];
    
    // Morning task
    if (hour < 12) {
      tasks.push(this.createTask(user.uid, 
        'Morning check-in with family',
        'Start the day connected',
        TaskCategory.RELATIONSHIP,
        TaskPriority.HIGH
      ));
    }
    
    // Household task
    tasks.push(this.createTask(user.uid,
      isWeekend ? 'Weekend home project (30 min)' : 'Quick evening tidy (15 min)',
      'Keep the home running smoothly',
      TaskCategory.HOUSEHOLD,
      TaskPriority.MEDIUM
    ));
    
    // Personal wellness
    tasks.push(this.createTask(user.uid,
      'Take a 10-minute walk',
      'Clear your head and recharge',
      TaskCategory.HEALTH,
      TaskPriority.LOW
    ));
    
    return {
      data: {
        tasks,
        rationale: 'Daily essentials to keep you on track',
        priority: 'medium',
        category: TaskCategory.PERSONAL,
        confidence: 0.6
      },
      metadata: { fallback: true }
    };
  }

  /**
   * Helper to create a task object
   */
  private createTask(
    userId: string,
    title: string,
    description: string,
    category: TaskCategory,
    priority: TaskPriority
  ): Task {
    return {
      id: `fallback_${Date.now()}_${Math.random()}`,
      userId,
      title,
      description,
      category,
      priority,
      status: TaskStatus.ACTIVE,
      source: TaskSource.TEMPLATE,
      completed: false,
      isProject: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      snoozedUntil: null
    } as Task;
  }
}

// Export singleton
let grokServiceInstance: GrokService | null = null;

export function getGrokService(): GrokService {
  if (!grokServiceInstance) {
    grokServiceInstance = new GrokService();
  }
  return grokServiceInstance;
}