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
  writeBatch 
} from 'firebase/firestore';

// Task Status Constants
export const TaskStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed', 
  SNOOZED: 'snoozed',
  ARCHIVED: 'archived'
};

// Task Categories
export const TaskCategory = {
  PERSONAL: 'personal',
  HOUSEHOLD: 'household',
  WORK: 'work',
  BABY: 'baby',
  RELATIONSHIP: 'relationship', 
  HEALTH: 'health',
  EVENTS: 'events',
  MAINTENANCE: 'maintenance',
  HOME_PROJECTS: 'home_projects'
};

// Task Priority
export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// Task Sources
export const TaskSource = {
  MANUAL: 'manual',
  AI_MENTOR: 'ai_mentor',
  VOICE: 'voice',
  TEMPLATE: 'template'
};

class TaskService {
  constructor(db) {
    this.db = db;
    this.collection = 'tasks';
  }

  // =============================================
  // VALIDATION HELPERS
  // =============================================

  validateTaskData(taskData) {
    const errors = [];

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
    if (!Object.values(TaskCategory).includes(taskData.category)) {
      errors.push('Invalid task category');
    }

    // Priority validation
    if (!Object.values(TaskPriority).includes(taskData.priority)) {
      errors.push('Invalid task priority');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  // Clean and normalize task data
  normalizeTaskData(rawData) {
    return {
      title: rawData.title?.trim(),
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

  async createTask(userId, taskData) {
    if (!this.db) throw new Error('Database not initialized');
    if (!userId) throw new Error('User ID is required');

    const normalizedData = this.normalizeTaskData(taskData);
    this.validateTaskData(normalizedData);

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
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error creating task:', error);
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  async checkForDuplicates(userId, title) {
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

  async getTasks(userId, filters = {}) {
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
      const tasks = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Skip deleted, dismissed, and template tasks
        if (data.deleted || data.dismissed || this.isTemplateTask(data)) {
          return;
        }

        tasks.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to Date objects
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
          completedAt: data.completedAt?.toDate?.() || null,
          snoozedUntil: data.snoozedUntil?.toDate?.() || null
        });
      });

      console.log(`✅ Loaded ${tasks.length} tasks for user ${userId}`);
      return tasks;
    } catch (error) {
      console.error('❌ Error loading tasks:', error);
      throw new Error(`Failed to load tasks: ${error.message}`);
    }
  }

  // Get active tasks (not completed, not snoozed, not archived)
  async getActiveTasks(userId) {
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
  async getCompletedTasks(userId, limitCount = 50) {
    return this.getTasks(userId, { 
      status: TaskStatus.COMPLETED,
      limit: limitCount 
    });
  }

  // Get projects only
  async getProjects(userId) {
    return this.getTasks(userId, { isProject: true });
  }

  // Get past promises (incomplete tasks older than 1 day)
  async getPastPromises(userId) {
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

  async updateTask(taskId, updates) {
    if (!this.db) throw new Error('Database not initialized');
    if (!taskId) throw new Error('Task ID is required');

    // Validate updates if they contain validated fields
    if (updates.title !== undefined || updates.category !== undefined || updates.priority !== undefined) {
      const tempData = { 
        title: updates.title || 'temp',
        category: updates.category || TaskCategory.PERSONAL,
        priority: updates.priority || TaskPriority.MEDIUM
      };
      this.validateTaskData(tempData);
    }

    const updateData = {
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
        };
      }
      
      throw new Error('Task not found after update');
    } catch (error) {
      console.error('❌ Error updating task:', error);
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }

  // Complete a task
  async completeTask(taskId) {
    return this.updateTask(taskId, {
      status: TaskStatus.COMPLETED,
      completed: true,
      completedAt: serverTimestamp()
    });
  }

  // Uncomplete a task  
  async uncompleteTask(taskId) {
    return this.updateTask(taskId, {
      status: TaskStatus.ACTIVE,
      completed: false,
      completedAt: null
    });
  }

  // Snooze a task
  async snoozeTask(taskId, until) {
    return this.updateTask(taskId, {
      status: TaskStatus.SNOOZED,
      snoozedUntil: until
    });
  }

  // Archive a task (soft delete)
  async archiveTask(taskId) {
    return this.updateTask(taskId, {
      status: TaskStatus.ARCHIVED
    });
  }

  // =============================================
  // DELETE OPERATIONS
  // =============================================

  async deleteTask(taskId) {
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
  async permanentlyDeleteTask(taskId) {
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

  async completeTasks(taskIds) {
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

  async archiveTasks(taskIds) {
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

  async convertToProject(taskId, subtasks = []) {
    const subtaskData = subtasks.map((subtask, index) => ({
      id: index + 1,
      title: subtask.title?.trim(),
      completed: false,
      completedAt: null
    }));

    return this.updateTask(taskId, {
      isProject: true,
      subtasks: subtaskData,
      progress: 0
    });
  }

  async addSubtask(projectId, subtaskData) {
    const project = await this.getTask(projectId);
    if (!project) throw new Error('Project not found');
    if (!project.isProject) throw new Error('Task is not a project');

    const newSubtask = {
      id: (project.subtasks?.length || 0) + 1,
      title: subtaskData.title?.trim(),
      completed: false,
      completedAt: null
    };

    const updatedSubtasks = [...(project.subtasks || []), newSubtask];
    const progress = this.calculateProjectProgress(updatedSubtasks);

    return this.updateTask(projectId, {
      subtasks: updatedSubtasks,
      progress
    });
  }

  async updateSubtask(projectId, subtaskId, updates) {
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

  calculateProjectProgress(subtasks) {
    if (!subtasks || subtasks.length === 0) return 0;
    
    const completedCount = subtasks.filter(st => st.completed).length;
    return Math.round((completedCount / subtasks.length) * 100);
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  async getTask(taskId) {
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
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting task:', error);
      throw new Error(`Failed to get task: ${error.message}`);
    }
  }

  // Check if task is a template/legacy task
  isTemplateTask(taskData) {
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
  async searchTasks(userId, searchQuery) {
    const allTasks = await this.getTasks(userId);
    const query = searchQuery.toLowerCase();
    
    return allTasks.filter(task => {
      const titleMatch = task.title.toLowerCase().includes(query);
      const descMatch = task.description?.toLowerCase().includes(query) || false;
      return titleMatch || descMatch;
    });
  }
}

// Export singleton instance factory
let taskServiceInstance = null;

export function createTaskService(db) {
  if (!taskServiceInstance || taskServiceInstance.db !== db) {
    taskServiceInstance = new TaskService(db);
  }
  return taskServiceInstance;
}

export default TaskService;