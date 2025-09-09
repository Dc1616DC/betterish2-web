/**
 * AI Service - Centralized AI/ML Integration Layer
 * Provides task suggestions, behavioral predictions, and voice processing
 */

import { 
  Task, 
  User, 
  TaskCategory, 
  TaskPriority, 
  TaskSource,
  CreateTaskData 
} from '@/types/models';
import { 
  AiResponse, 
  AiSuggestion, 
  UserBehaviorData,
  BehaviorPrediction,
  VoiceToTaskRequest,
  VoiceToTaskResponse,
  AiConfig
} from '@/types/ai';
import { getGrokService } from './GrokService';

export class AiService {
  private config: AiConfig;
  private openAiKey: string | undefined;
  private useGrok: boolean;

  constructor(config?: Partial<AiConfig>) {
    this.openAiKey = process.env.OPENAI_API_KEY;
    this.useGrok = !!process.env.GROK_API_KEY; // Prefer Grok if available
    this.config = {
      providers: {
        openai: {
          name: 'openai',
          apiKey: this.openAiKey,
          baseUrl: 'https://api.openai.com/v1',
          model: 'gpt-4-turbo-preview'
        },
        ...config?.providers
      },
      features: {
        voiceToTask: true,
        behaviorPrediction: true,
        taskSuggestions: true,
        smartReminders: true,
        ...config?.features
      },
      limits: {
        maxSuggestionsPerDay: 10,
        maxVoiceProcessingPerHour: 20,
        ...config?.limits
      }
    };
  }

  /**
   * Generate personalized daily task mix based on user patterns
   * Returns 3-5 tasks balanced across categories
   */
  async generateDailyMix(user: User, existingTasks: Task[]): Promise<AiResponse<AiSuggestion>> {
    try {
      // Use Grok if available, otherwise fall back to local generation
      if (this.useGrok) {
        const grokService = getGrokService();
        return await grokService.generateDailyMix(user, existingTasks);
      }
      
      // Analyze existing task distribution
      const tasksByCategory = this.analyzeTaskDistribution(existingTasks);
      
      // Determine which categories need attention
      const suggestions = this.createBalancedSuggestions(user, tasksByCategory);
      
      return {
        data: {
          tasks: suggestions,
          rationale: this.generateRationale(suggestions, user),
          priority: 'medium',
          category: TaskCategory.PERSONAL,
          confidence: 0.85
        }
      };
    } catch (error) {
      return {
        data: this.getFallbackSuggestions(user),
        error: error instanceof Error ? error.message : 'Failed to generate suggestions',
        metadata: { fallback: true }
      };
    }
  }

  /**
   * Convert voice transcription to structured task
   */
  async processVoiceToTask(request: VoiceToTaskRequest): Promise<AiResponse<VoiceToTaskResponse>> {
    try {
      const { transcription, userContext } = request;
      
      // Parse the transcription to extract task details
      const parsedTask = await this.parseTranscription(transcription.text, userContext);
      
      return {
        data: {
          suggestedTask: parsedTask,
          confidence: transcription.confidence * 0.9,
          requiresConfirmation: transcription.confidence < 0.8,
          alternativeSuggestions: transcription.confidence < 0.7 
            ? [this.generateAlternativeTask(parsedTask)]
            : undefined
        }
      };
    } catch (error) {
      return {
        data: {
          suggestedTask: {
            title: request.transcription.text,
            category: TaskCategory.PERSONAL,
            priority: TaskPriority.MEDIUM
          },
          confidence: 0.5,
          requiresConfirmation: true
        },
        error: 'Could not fully parse voice input'
      };
    }
  }

  /**
   * Predict task completion likelihood based on user behavior
   */
  async predictTaskBehavior(
    task: Task, 
    behaviorData: UserBehaviorData
  ): Promise<AiResponse<BehaviorPrediction>> {
    try {
      const prediction = this.analyzeCompletionLikelihood(task, behaviorData);
      
      return {
        data: {
          taskId: task.id,
          likelyToComplete: prediction.likelihood > 0.6,
          confidence: prediction.confidence,
          suggestedNudge: prediction.likelihood < 0.5 
            ? this.generateNudgeMessage(task, behaviorData)
            : undefined,
          optimalReminderTime: this.calculateOptimalReminder(task, behaviorData),
          riskFactors: prediction.riskFactors
        }
      };
    } catch (error) {
      return {
        data: {
          taskId: task.id,
          likelyToComplete: true,
          confidence: 0.5,
          riskFactors: ['Unable to analyze patterns']
        },
        error: 'Prediction analysis failed'
      };
    }
  }

  /**
   * Generate smart task suggestions based on context
   */
  async generateSmartSuggestions(
    user: User,
    context: {
      timeOfDay: string;
      dayOfWeek: string;
      recentCompletions: Task[];
      upcomingEvents?: any[];
    }
  ): Promise<AiResponse<Task[]>> {
    try {
      const suggestions: CreateTaskData[] = [];
      
      // Morning routine suggestions
      if (context.timeOfDay === 'morning' && context.dayOfWeek !== 'Sunday') {
        suggestions.push({
          title: 'Review today\'s priorities with partner',
          category: TaskCategory.RELATIONSHIP,
          priority: TaskPriority.HIGH,
          source: TaskSource.AI_MENTOR,
          estimatedMinutes: 10
        });
      }
      
      // Weekend home suggestions
      if (['Saturday', 'Sunday'].includes(context.dayOfWeek)) {
        suggestions.push({
          title: 'Tackle one home improvement project',
          category: TaskCategory.HOME_PROJECTS,
          priority: TaskPriority.MEDIUM,
          source: TaskSource.AI_MENTOR,
          estimatedMinutes: 120
        });
      }
      
      // Evening family time
      if (context.timeOfDay === 'evening' && user.profile?.hasChildren) {
        suggestions.push({
          title: 'Dedicated family time - no devices',
          category: TaskCategory.RELATIONSHIP,
          priority: TaskPriority.HIGH,
          source: TaskSource.AI_MENTOR,
          estimatedMinutes: 60
        });
      }
      
      return {
        data: suggestions.map(s => ({
          ...s,
          id: this.generateId(),
          userId: user.uid,
          status: TaskSource.AI_MENTOR,
          completed: false,
          isProject: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
          snoozedUntil: null
        } as Task))
      };
    } catch (error) {
      return {
        data: [],
        error: 'Failed to generate suggestions'
      };
    }
  }

  // =============================================
  // PRIVATE HELPER METHODS
  // =============================================

  private analyzeTaskDistribution(tasks: Task[]): Record<TaskCategory, number> {
    const distribution: Partial<Record<TaskCategory, number>> = {};
    
    tasks.forEach(task => {
      distribution[task.category] = (distribution[task.category] || 0) + 1;
    });
    
    // Fill in zeros for missing categories
    Object.values(TaskCategory).forEach(category => {
      if (!distribution[category]) {
        distribution[category] = 0;
      }
    });
    
    return distribution as Record<TaskCategory, number>;
  }

  private createBalancedSuggestions(
    user: User, 
    currentDistribution: Record<TaskCategory, number>
  ): Task[] {
    const suggestions: Task[] = [];
    const targetCategories = this.getUnderrepresentedCategories(currentDistribution);
    
    targetCategories.forEach(category => {
      suggestions.push(this.createSuggestionForCategory(category, user));
    });
    
    return suggestions;
  }

  private getUnderrepresentedCategories(
    distribution: Record<TaskCategory, number>
  ): TaskCategory[] {
    const threshold = 2; // Minimum tasks per category
    return Object.entries(distribution)
      .filter(([_, count]) => count < threshold)
      .map(([category]) => category as TaskCategory)
      .slice(0, 3); // Max 3 suggestions
  }

  private createSuggestionForCategory(category: TaskCategory, user: User): Task {
    const suggestions: Record<TaskCategory, Partial<Task>> = {
      [TaskCategory.RELATIONSHIP]: {
        title: 'Plan a surprise for your partner',
        description: 'Small gesture to show appreciation'
      },
      [TaskCategory.HOUSEHOLD]: {
        title: 'Organize one area of the house',
        description: '15-minute declutter session'
      },
      [TaskCategory.HEALTH]: {
        title: 'Take a 20-minute walk',
        description: 'Clear your head and get moving'
      },
      [TaskCategory.PERSONAL]: {
        title: 'Journal for 10 minutes',
        description: 'Reflect on today\'s wins'
      },
      [TaskCategory.BABY]: {
        title: 'Prep tomorrow\'s baby supplies',
        description: 'Bottles, clothes, and diapers ready'
      },
      [TaskCategory.WORK]: {
        title: 'Clear inbox to zero',
        description: 'Process and organize emails'
      },
      [TaskCategory.MAINTENANCE]: {
        title: 'Check and replace air filters',
        description: 'Monthly home maintenance'
      },
      [TaskCategory.HOME_PROJECTS]: {
        title: 'Research next home improvement',
        description: 'Find tutorials or get quotes'
      },
      [TaskCategory.EVENTS]: {
        title: 'RSVP to pending invitations',
        description: 'Check calendar and respond'
      }
    };
    
    const base = suggestions[category] || {
      title: `Focus on ${category.toLowerCase()}`,
      description: 'Take action in this area'
    };
    
    return {
      id: this.generateId(),
      userId: user.uid,
      title: base.title!,
      description: base.description,
      category,
      priority: TaskPriority.MEDIUM,
      status: TaskSource.AI_MENTOR,
      source: TaskSource.AI_MENTOR,
      completed: false,
      isProject: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      snoozedUntil: null,
      aiGenerated: true,
      aiContext: {
        model: 'daily-mix-generator',
        confidence: 0.8
      }
    } as Task;
  }

  private generateRationale(suggestions: Task[], user: User): string {
    const categories = suggestions.map(s => s.category).join(', ');
    return `Today's mix focuses on ${categories} to maintain balance across your responsibilities.`;
  }

  private getFallbackSuggestions(user: User): AiSuggestion {
    return {
      tasks: [
        this.createSuggestionForCategory(TaskCategory.PERSONAL, user),
        this.createSuggestionForCategory(TaskCategory.HOUSEHOLD, user)
      ],
      rationale: 'Here are some general suggestions to keep you productive',
      priority: 'low',
      category: TaskCategory.PERSONAL,
      confidence: 0.5
    };
  }

  private async parseTranscription(
    text: string, 
    context?: any
  ): Promise<Partial<Task>> {
    // Simple keyword-based parsing for now
    const lowerText = text.toLowerCase();
    
    let category = TaskCategory.PERSONAL;
    let priority = TaskPriority.MEDIUM;
    
    // Detect category from keywords
    if (lowerText.includes('baby') || lowerText.includes('diaper')) {
      category = TaskCategory.BABY;
      priority = TaskPriority.HIGH;
    } else if (lowerText.includes('wife') || lowerText.includes('partner')) {
      category = TaskCategory.RELATIONSHIP;
    } else if (lowerText.includes('house') || lowerText.includes('clean')) {
      category = TaskCategory.HOUSEHOLD;
    } else if (lowerText.includes('work') || lowerText.includes('meeting')) {
      category = TaskCategory.WORK;
    }
    
    // Detect urgency
    if (lowerText.includes('urgent') || lowerText.includes('asap')) {
      priority = TaskPriority.HIGH;
    }
    
    return {
      title: text,
      category,
      priority,
      source: TaskSource.VOICE
    };
  }

  private generateAlternativeTask(original: Partial<Task>): Partial<Task> {
    return {
      ...original,
      title: `Alternative: ${original.title}`,
      priority: TaskPriority.LOW
    };
  }

  private analyzeCompletionLikelihood(
    task: Task, 
    behaviorData: UserBehaviorData
  ): { likelihood: number; confidence: number; riskFactors: string[] } {
    let likelihood = 0.7; // Base likelihood
    const riskFactors: string[] = [];
    
    // Check historical completion rate for category
    const categoryCompletions = behaviorData.completionPatterns.byCategory[task.category] || 0;
    const avgCompletions = Object.values(behaviorData.completionPatterns.byCategory)
      .reduce((a, b) => a + b, 0) / Object.keys(behaviorData.completionPatterns.byCategory).length;
    
    if (categoryCompletions < avgCompletions * 0.5) {
      likelihood -= 0.2;
      riskFactors.push('Low historical completion in this category');
    }
    
    // Check time of day patterns
    const currentHour = new Date().getHours().toString();
    const hourlyCompletions = behaviorData.completionPatterns.byHour[currentHour] || 0;
    
    if (hourlyCompletions < 1) {
      likelihood -= 0.1;
      riskFactors.push('Low activity at this time of day');
    }
    
    return {
      likelihood: Math.max(0, Math.min(1, likelihood)),
      confidence: 0.75,
      riskFactors
    };
  }

  private generateNudgeMessage(task: Task, behaviorData: UserBehaviorData): string {
    const messages = [
      `This ${task.category} task often gets postponed. How about tackling it now?`,
      `You're most productive with ${task.category} tasks in the morning. Give it a shot!`,
      `Small win opportunity: ${task.title} will only take a few minutes.`,
      `Your partner would appreciate you handling this one: ${task.title}`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private calculateOptimalReminder(
    task: Task, 
    behaviorData: UserBehaviorData
  ): Date {
    // Find the hour with highest completion rate
    const bestHour = Object.entries(behaviorData.completionPatterns.byHour)
      .sort(([, a], [, b]) => b - a)[0];
    
    const reminderTime = new Date();
    reminderTime.setHours(parseInt(bestHour?.[0] || '9'), 0, 0, 0);
    
    // If that time has passed today, set for tomorrow
    if (reminderTime < new Date()) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    return reminderTime;
  }

  private generateId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let aiServiceInstance: AiService | null = null;

export function getAiService(config?: Partial<AiConfig>): AiService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AiService(config);
  }
  return aiServiceInstance;
}