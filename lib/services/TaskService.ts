/**
 * TaskService - Centralized Task Management
 * Handles ALL task CRUD operations, validation, and business logic
 * Clean separation between UI and data operations
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch,
  Firestore,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { Task, TaskId, UserId, TaskCategory, TaskPriority, TaskStatus, TaskSource, Subtask, User } from '../../types/models';
import { getAiService } from '@/lib/ai/AiService';
import { AiSuggestion } from '@/types/ai';

// Task Status Constants (using enum from types)
export { TaskStatus, TaskCategory, TaskPriority, TaskSource } from '../../types/models';

// Task filters interface
export interface TaskFilters {
  status?: TaskStatus;
  category?: TaskCategory;
  isProject?: boolean;
  limit?: number;
}

// Task creation data interface
export interface CreateTaskData {
  title: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  status?: TaskStatus;
  isProject?: boolean;
  subtasks?: Subtask[];
  source?: TaskSource;
  tags?: string[];
}

// Task validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

class TaskService {
  private db: Firestore;
  private readonly collection = 'tasks';

  constructor(db: Firestore) {
    this.db = db;
  }

  // =============================================
  // VALIDATION HELPERS
  // =============================================

  validateTaskData(taskData: CreateTaskData): ValidationResult {
    const errors: string[] = [];

    // Title validation
    if (!taskData.title?.trim()) {
      errors.push('Task title is required');
    } else if (taskData.title.trim().length > 100) {
      errors.push('Task title must be less than 100 characters');
    }

    // Description validation  
    if (taskData.description && taskData.description.length > 500) {
      errors.push('Task description must be less than 500 characters');
    }

    // Category validation
    if (taskData.category && !Object.values(TaskCategory).includes(taskData.category)) {
      errors.push('Invalid task category');
    }

    // Priority validation
    if (taskData.priority && !Object.values(TaskPriority).includes(taskData.priority)) {
      errors.push('Invalid task priority');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Clean and normalize task data
  private normalizeTaskData(rawData: Partial<CreateTaskData>): CreateTaskData {
    return {
      title: rawData.title?.trim() || '',
      description: rawData.description?.trim() || '',
      category: rawData.category || TaskCategory.PERSONAL,
      priority: rawData.priority || TaskPriority.MEDIUM,
      status: rawData.status || TaskStatus.ACTIVE,
      isProject: rawData.isProject || false,
      subtasks: rawData.subtasks || [],
      source: rawData.source || TaskSource.MANUAL,
      tags: rawData.tags || []
    };
  }

  // =============================================
  // CREATE OPERATIONS
  // =============================================

  async createTask(userId: UserId, taskData: CreateTaskData): Promise<Task> {
    if (!this.db) throw new Error('Database not initialized');
    if (!userId) throw new Error('User ID is required');

    const normalizedData = this.normalizeTaskData(taskData);
    const validation = this.validateTaskData(normalizedData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check for duplicates (same title in last hour)
    await this.checkForDuplicates(userId, normalizedData.title);

    const taskDoc = {
      ...normalizedData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Ensure clean state
      completed: false,
      completedAt: null,
      snoozedUntil: null,
      dismissed: false,
      deleted: false
    };

    try {
      const docRef = await addDoc(collection(this.db, this.collection), taskDoc);
      console.log('✅ Task created:', docRef.id);
      
      // Return the created task with ID
      return {
        id: docRef.id,
        ...taskDoc,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: taskDoc.category as TaskCategory,
        priority: taskDoc.priority as TaskPriority,
        status: taskDoc.status as TaskStatus
      } as Task;
    } catch (error) {
      console.error('❌ Error creating task:', error);
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  private async checkForDuplicates(userId: UserId, title: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const q = query(
      collection(this.db, this.collection),
      where('userId', '==', userId),
      where('title', '==', title),
      where('createdAt', '>', oneHourAgo),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error('Duplicate task: A task with this title was created recently');
    }
  }

  // =============================================
  // READ OPERATIONS
  // =============================================

  async getTasks(userId: UserId, filters: TaskFilters = {}): Promise<Task[]> {
    if (!this.db) throw new Error('Database not initialized');
    if (!userId) throw new Error('User ID is required');

    try {
      let q = query(
        collection(this.db, this.collection),
        where('userId', '==', userId)
      );

      // Apply filters
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters.isProject !== undefined) {
        q = query(q, where('isProject', '==', filters.isProject));
      }

      // Always order by creation date (newest first)
      q = query(q, orderBy('createdAt', 'desc'));

      // Apply limit if specified
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      const tasks: Task[] = [];

      snapshot.docs.forEach(docSnap => {
        const data: DocumentData = docSnap.data();
        
        // Skip deleted, dismissed, and template tasks
        if (data.deleted || data.dismissed || this.isTemplateTask(data)) {
          return;
        }

        tasks.push({
          id: docSnap.id,
          ...data,
          // Convert Firestore timestamps to Date objects
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
          completedAt: data.completedAt?.toDate?.() || null,
          snoozedUntil: data.snoozedUntil?.toDate?.() || null
        } as Task);
      });

      console.log(`✅ Loaded ${tasks.length} tasks for user ${userId}`);
      return tasks;
    } catch (error) {
      console.error('❌ Error loading tasks:', error);
      throw new Error(`Failed to load tasks: ${error.message}`);
    }
  }

  // Get active tasks (not completed, not snoozed, not archived)
  async getActiveTasks(userId: UserId): Promise<Task[]> {
    const tasks = await this.getTasks(userId, { status: TaskStatus.ACTIVE });
    
    // Filter out snoozed tasks that haven't reached their snooze time
    const now = new Date();
    return tasks.filter(task => {
      if (task.snoozedUntil && task.snoozedUntil > now) {
        return false; // Still snoozed
      }
      return true;
    });
  }

  // Get completed tasks
  async getCompletedTasks(userId: UserId, limitCount = 50): Promise<Task[]> {
    return this.getTasks(userId, { 
      status: TaskStatus.COMPLETED,
      limit: limitCount 
    });
  }

  // Get projects only
  async getProjects(userId: UserId): Promise<Task[]> {
    return this.getTasks(userId, { isProject: true });
  }

  // Get past promises (incomplete tasks older than 1 day)
  async getPastPromises(userId: UserId): Promise<Task[]> {
    const allTasks = await this.getTasks(userId, { status: TaskStatus.ACTIVE });
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    return allTasks.filter(task => {
      const taskDate = task.createdAt;
      return taskDate < oneDayAgo && taskDate > fourteenDaysAgo;
    });
  }

  // =============================================
  // UPDATE OPERATIONS  
  // =============================================

  async updateTask(taskId: TaskId, updates: Partial<Task>): Promise<Task> {
    if (!this.db) throw new Error('Database not initialized');
    if (!taskId) throw new Error('Task ID is required');

    // Validate updates if they contain validated fields
    if (updates.title !== undefined || updates.category !== undefined || updates.priority !== undefined) {
      const tempData: CreateTaskData = { 
        title: updates.title || 'temp',
        category: updates.category || TaskCategory.PERSONAL,
        priority: updates.priority || TaskPriority.MEDIUM
      };
      const validation = this.validateTaskData(tempData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
    }

    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    // Clean undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    try {
      const taskRef = doc(this.db, this.collection, taskId);
      await updateDoc(taskRef, updateData);
      
      console.log('✅ Task updated:', taskId);
      
      // Return updated task
      const updatedDoc = await getDoc(taskRef);
      if (updatedDoc.exists()) {
        const data = updatedDoc.data();
        return {
          id: taskId,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
          completedAt: data.completedAt?.toDate?.() || null,
          snoozedUntil: data.snoozedUntil?.toDate?.() || null
        } as Task;
      }
      
      throw new Error('Task not found after update');
    } catch (error) {
      console.error('❌ Error updating task:', error);
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }

  // Complete a task
  async completeTask(taskId: TaskId): Promise<Task> {
    return this.updateTask(taskId, {
      status: TaskStatus.COMPLETED,
      completed: true,
      completedAt: serverTimestamp() as any
    });
  }

  // Uncomplete a task  
  async uncompleteTask(taskId: TaskId): Promise<Task> {
    return this.updateTask(taskId, {
      status: TaskStatus.ACTIVE,
      completed: false,
      completedAt: null
    });
  }

  // Snooze a task
  async snoozeTask(taskId: TaskId, until: Date): Promise<Task> {
    return this.updateTask(taskId, {
      status: TaskStatus.SNOOZED,
      snoozedUntil: until
    });
  }

  // Archive a task (soft delete)
  async archiveTask(taskId: TaskId): Promise<Task> {
    return this.updateTask(taskId, {
      status: TaskStatus.ARCHIVED
    });
  }

  // =============================================
  // DELETE OPERATIONS
  // =============================================

  async deleteTask(taskId: TaskId): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    if (!taskId) throw new Error('Task ID is required');

    try {
      // Soft delete by default
      await this.updateTask(taskId, {
        status: TaskStatus.ARCHIVED,
        deleted: true
      });
      
      console.log('✅ Task archived:', taskId);
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  // Hard delete (permanent removal)
  async permanentlyDeleteTask(taskId: TaskId): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    if (!taskId) throw new Error('Task ID is required');

    try {
      const taskRef = doc(this.db, this.collection, taskId);
      await deleteDoc(taskRef);
      
      console.log('✅ Task permanently deleted:', taskId);
    } catch (error) {
      console.error('❌ Error permanently deleting task:', error);
      throw new Error(`Failed to permanently delete task: ${error.message}`);
    }
  }

  // =============================================
  // BULK OPERATIONS
  // =============================================

  async completeTasks(taskIds: TaskId[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      throw new Error('Task IDs array is required');
    }

    const batch = writeBatch(this.db);
    const timestamp = serverTimestamp();

    taskIds.forEach(taskId => {
      const taskRef = doc(this.db, this.collection, taskId);
      batch.update(taskRef, {
        status: TaskStatus.COMPLETED,
        completed: true,
        completedAt: timestamp,
        updatedAt: timestamp
      });
    });

    try {
      await batch.commit();
      console.log(`✅ Completed ${taskIds.length} tasks`);
    } catch (error) {
      console.error('❌ Error completing tasks:', error);
      throw new Error(`Failed to complete tasks: ${error.message}`);
    }
  }

  async archiveTasks(taskIds: TaskId[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      throw new Error('Task IDs array is required');
    }

    const batch = writeBatch(this.db);
    const timestamp = serverTimestamp();

    taskIds.forEach(taskId => {
      const taskRef = doc(this.db, this.collection, taskId);
      batch.update(taskRef, {
        status: TaskStatus.ARCHIVED,
        deleted: true,
        updatedAt: timestamp
      });
    });

    try {
      await batch.commit();
      console.log(`✅ Archived ${taskIds.length} tasks`);
    } catch (error) {
      console.error('❌ Error archiving tasks:', error);
      throw new Error(`Failed to archive tasks: ${error.message}`);
    }
  }

  // =============================================
  // PROJECT OPERATIONS
  // =============================================

  async convertToProject(taskId: TaskId, subtasks: Partial<Subtask>[] = []): Promise<Task> {
    const subtaskData: Subtask[] = subtasks.map((subtask, index) => ({
      id: index + 1,
      title: subtask.title?.trim() || '',
      completed: false,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    return this.updateTask(taskId, {
      isProject: true,
      subtasks: subtaskData,
      progress: 0
    });
  }

  async addSubtask(projectId: TaskId, subtaskData: Partial<Subtask>): Promise<Task> {
    const project = await this.getTask(projectId);
    if (!project) throw new Error('Project not found');
    if (!project.isProject) throw new Error('Task is not a project');

    const newSubtask: Subtask = {
      id: (project.subtasks?.length || 0) + 1,
      title: subtaskData.title?.trim() || '',
      completed: false,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedSubtasks = [...(project.subtasks || []), newSubtask];
    const progress = this.calculateProjectProgress(updatedSubtasks);

    return this.updateTask(projectId, {
      subtasks: updatedSubtasks,
      progress
    });
  }

  async updateSubtask(projectId: TaskId, subtaskId: number, updates: Partial<Subtask>): Promise<Task> {
    const project = await this.getTask(projectId);
    if (!project) throw new Error('Project not found');
    if (!project.isProject) throw new Error('Task is not a project');

    const subtasks = project.subtasks || [];
    const subtaskIndex = subtasks.findIndex(st => st.id === subtaskId);
    if (subtaskIndex === -1) throw new Error('Subtask not found');

    // Update the subtask
    subtasks[subtaskIndex] = {
      ...subtasks[subtaskIndex],
      ...updates,
      id: subtaskId // Preserve ID
    };

    const progress = this.calculateProjectProgress(subtasks);

    return this.updateTask(projectId, {
      subtasks,
      progress
    });
  }

  private calculateProjectProgress(subtasks: Subtask[]): number {
    if (!subtasks || subtasks.length === 0) return 0;
    
    const completedCount = subtasks.filter(st => st.completed).length;
    return Math.round((completedCount / subtasks.length) * 100);
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  async getTask(taskId: TaskId): Promise<Task | null> {
    if (!this.db) throw new Error('Database not initialized');
    if (!taskId) throw new Error('Task ID is required');

    try {
      const taskRef = doc(this.db, this.collection, taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (taskDoc.exists()) {
        const data = taskDoc.data();
        return {
          id: taskId,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
          completedAt: data.completedAt?.toDate?.() || null,
          snoozedUntil: data.snoozedUntil?.toDate?.() || null
        } as Task;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting task:', error);
      throw new Error(`Failed to get task: ${error.message}`);
    }
  }

  // Check if task is a template/legacy task
  private isTemplateTask(taskData: DocumentData): boolean {
    if (!taskData.title) return false;
    
    const templatePrefixes = [
      'rel_', 'baby_', 'household_', 'maintenance_', 
      'health_', 'work_', 'personal_', 'events_'
    ];
    
    return templatePrefixes.some(prefix => 
      taskData.title.toLowerCase().startsWith(prefix.toLowerCase())
    ) || taskData.source === TaskSource.TEMPLATE;
  }

  // Search tasks by title/description
  async searchTasks(userId: UserId, searchQuery: string): Promise<Task[]> {
    const allTasks = await this.getTasks(userId);
    const query = searchQuery.toLowerCase();
    
    return allTasks.filter(task => {
      const titleMatch = task.title.toLowerCase().includes(query);
      const descMatch = task.description?.toLowerCase().includes(query) || false;
      return titleMatch || descMatch;
    });
  }

  // =============================================
  // AI-POWERED FEATURES
  // =============================================

  /**
   * Generate personalized daily task mix using AI
   * Balances across categories based on user patterns
   */
  async generateDailyMix(user: User): Promise<AiSuggestion> {
    try {
      const aiService = getAiService();
      const existingTasks = await this.getTasks(user.uid);
      
      // Get AI-generated suggestions
      const response = await aiService.generateDailyMix(user, existingTasks);
      
      if (response.error) {
        console.warn('AI generation warning:', response.error);
      }
      
      // Store the suggested tasks if user accepts them
      // This method just returns suggestions without creating them
      return response.data!;
    } catch (error) {
      console.error('Failed to generate daily mix:', error);
      
      // Return fallback suggestions
      return {
        tasks: await this.getFallbackDailyTasks(user.uid),
        rationale: 'Here are some tasks to keep you productive today',
        priority: 'medium' as const,
        category: TaskCategory.PERSONAL,
        confidence: 0.5
      };
    }
  }

  /**
   * Create tasks from AI suggestions
   * Used when user accepts the daily mix
   */
  async createTasksFromSuggestions(
    userId: UserId, 
    suggestions: Task[]
  ): Promise<Task[]> {
    const createdTasks: Task[] = [];
    
    for (const suggestion of suggestions) {
      try {
        const taskData: CreateTaskData = {
          title: suggestion.title,
          description: suggestion.description,
          category: suggestion.category,
          priority: suggestion.priority,
          source: TaskSource.AI_MENTOR,
          tags: ['ai-generated', 'daily-mix']
        };
        
        const created = await this.createTask(userId, taskData);
        createdTasks.push(created);
      } catch (error) {
        console.error('Failed to create suggested task:', error);
      }
    }
    
    return createdTasks;
  }

  /**
   * Get fallback daily tasks when AI is unavailable
   */
  private async getFallbackDailyTasks(userId: UserId): Promise<Task[]> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const fallbackTasks: Partial<Task>[] = [
      {
        title: 'Review today\'s priorities',
        category: TaskCategory.PERSONAL,
        priority: TaskPriority.HIGH,
        source: TaskSource.TEMPLATE
      },
      {
        title: isWeekend ? 'Family time activity' : 'Connect with partner',
        category: TaskCategory.RELATIONSHIP,
        priority: TaskPriority.MEDIUM,
        source: TaskSource.TEMPLATE
      },
      {
        title: 'Quick home tidy (15 min)',
        category: TaskCategory.HOUSEHOLD,
        priority: TaskPriority.LOW,
        source: TaskSource.TEMPLATE
      }
    ];
    
    // Convert to full Task objects
    return fallbackTasks.map(task => ({
      id: `fallback_${Date.now()}_${Math.random()}`,
      userId,
      title: task.title!,
      description: task.description,
      category: task.category!,
      priority: task.priority!,
      status: TaskStatus.ACTIVE,
      source: task.source!,
      completed: false,
      isProject: false,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      snoozedUntil: null
    } as Task));
  }
}

// Export singleton instance factory
let taskServiceInstance: TaskService | null = null;

export function createTaskService(db: Firestore): TaskService {
  if (!taskServiceInstance || taskServiceInstance['db'] !== db) {
    taskServiceInstance = new TaskService(db);
  }
  return taskServiceInstance;
}

export default TaskService;